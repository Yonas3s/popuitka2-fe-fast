import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import type { DuckMessage } from '../../store/duck.store';
import type { WorkflowType } from '../../types/models';

type StageOption = {
  id: string;
  label: string;
};

type QuickAction = {
  id: string;
  label: string;
  onClick: () => void;
};

type DuckDialogProps = {
  open: boolean;
  projectId?: string;
  projectName?: string;
  stageId?: string | null;
  stageName?: string;
  workflowType?: WorkflowType;
  canCreateTasks: boolean;
  createTasks: boolean;
  taskLimit: number;
  model: string;
  draft: string;
  isTyping: boolean;
  messages: DuckMessage[];
  stageOptions: StageOption[];
  preferredStageId: string | null;
  quickActions: QuickAction[];
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCreateTasksChange: (value: boolean) => void;
  onTaskLimitChange: (value: number) => void;
  onPreferredStageChange: (value: string | null) => void;
  onResetConversation: () => void;
  inputRef: RefObject<HTMLTextAreaElement>;
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const DuckDialog = ({
  open,
  projectId,
  projectName,
  stageName,
  workflowType = 'stages',
  canCreateTasks,
  createTasks,
  taskLimit,
  draft,
  isTyping,
  messages,
  stageOptions,
  preferredStageId,
  quickActions,
  onClose,
  onSubmit,
  onDraftChange,
  onCreateTasksChange,
  onTaskLimitChange,
  onPreferredStageChange,
  onResetConversation,
  inputRef,
}: DuckDialogProps) => {
  if (!open) {
    return null;
  }

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      onSubmit();
    }
  };

  // Friendly context subtitle. Falls back to "глобально" when the user is
  // not on a project page — better than showing raw uuids as in v1.
  const subtitleParts: string[] = [];
  if (projectName) {
    subtitleParts.push(projectName);
  } else if (projectId) {
    subtitleParts.push('проект');
  } else {
    subtitleParts.push('глобальный контекст');
  }
  if (stageName && workflowType === 'stages') {
    subtitleParts.push(stageName);
  }
  const subtitle = subtitleParts.join(' · ');

  return (
    <section className="duck-dialog" role="dialog" aria-modal="true" aria-label="Утка — AI-агент">
      <header className="duck-dialog-head">
        <div>
          <h3>Утка</h3>
          <p>{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>

      <div className="duck-dialog-actions">
        {quickActions.map((action) => (
          <button key={action.id} type="button" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>

      <div className="duck-dialog-controls">
        <label className={!canCreateTasks ? 'is-disabled' : ''}>
          <input
            type="checkbox"
            checked={createTasks && canCreateTasks}
            disabled={!canCreateTasks}
            onChange={(event) => onCreateTasksChange(event.target.checked)}
          />
          <span>Автосоздание задач</span>
        </label>

        <label>
          <span>Лимит</span>
          <input
            type="number"
            min={1}
            max={20}
            value={taskLimit}
            disabled={!createTasks || !canCreateTasks}
            onChange={(event) => onTaskLimitChange(Number(event.target.value))}
          />
        </label>

        {workflowType === 'stages' ? (
          <label>
            <span>Этап</span>
            <select
              value={preferredStageId ?? ''}
              disabled={!createTasks || !canCreateTasks || stageOptions.length === 0}
              onChange={(event) => onPreferredStageChange(event.target.value || null)}
            >
              {stageOptions.length === 0 ? <option value="">Нет этапов</option> : null}
              {stageOptions.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="duck-dialog-history">
        {messages.length === 0 ? (
          <p className="duck-dialog-empty">
            Нажми на быстрый сценарий или напиши запрос. Комбинация отправки: <code>Ctrl/Cmd + Enter</code>.
          </p>
        ) : (
          <ul>
            {messages.map((message) => (
              <li key={message.id} className={`duck-message ${message.role === 'assistant' ? 'is-assistant' : 'is-user'}`}>
                <div className="duck-message-meta">
                  <strong>{message.role === 'assistant' ? 'Duck' : 'Вы'}</strong>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
                <p>{message.text}</p>
              </li>
            ))}
          </ul>
        )}
        {isTyping ? <p className="duck-dialog-typing">Duck думает…</p> : null}
      </div>

      <form className="duck-dialog-input" onSubmit={onFormSubmit}>
        <textarea
          ref={inputRef}
          value={draft}
          onKeyDown={onTextareaKeyDown}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Что нужно сделать?"
          rows={3}
        />
        <div className="duck-dialog-input-actions">
          <button type="button" className="duck-link-btn" onClick={onResetConversation}>
            Очистить
          </button>
          <button type="submit" className="duck-primary-btn" disabled={!draft.trim() || isTyping}>
            Отправить
          </button>
        </div>
      </form>
    </section>
  );
};
