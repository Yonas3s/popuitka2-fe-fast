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
  draft: string;
  isTyping: boolean;
  messages: DuckMessage[];
  quickActions: QuickAction[];
  onClose: () => void;
  onSubmit: () => void;
  onDraftChange: (value: string) => void;
  onCreateTasksChange: (value: boolean) => void;
  onTaskLimitChange: (value: number) => void;
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
  quickActions,
  onClose,
  onSubmit,
  onDraftChange,
  onCreateTasksChange,
  onTaskLimitChange,
  onResetConversation,
  inputRef,
}: Omit<DuckDialogProps, 'stageOptions' | 'preferredStageId' | 'onPreferredStageChange'>) => {
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

  // Friendly context subtitle. Falls back to "глобально" when the user is\n  // not on a project page — better than showing raw uuids as in v1.
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
        <div className="duck-dialog-title-group">
          <div className="duck-dialog-icon">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h3>Утка</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="duck-dialog-close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <div className="duck-dialog-section">
        <label className="duck-dialog-label">Быстрые сценарии</label>
        <div className="duck-dialog-actions">
          {quickActions.map((action) => (
            <button key={action.id} type="button" onClick={action.onClick} className="duck-action-btn">
              <span className="material-symbols-outlined duck-action-icon">list_alt</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="duck-dialog-settings-row">
        <label className="duck-toggle-label">
          <div className="duck-toggle">
            <input
              type="checkbox"
              checked={createTasks && canCreateTasks}
              disabled={!canCreateTasks}
              onChange={(event) => onCreateTasksChange(event.target.checked)}
            />
            <span className="duck-toggle-track"></span>
            <span className="duck-toggle-thumb"></span>
          </div>
          <span>Автосоздание задач</span>
        </label>
        <div className="duck-limit-group">
          <label htmlFor="duck-limit-input">Лимит</label>
          <input
            id="duck-limit-input"
            type="number"
            min={1}
            max={20}
            value={taskLimit}
            disabled={!createTasks || !canCreateTasks}
            onChange={(event) => onTaskLimitChange(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="duck-dialog-input-group">
        <textarea
          ref={inputRef}
          value={draft}
          onKeyDown={onTextareaKeyDown}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Что нужно сделать?"
          rows={4}
        />
      </div>

      <div className="duck-dialog-info">
        <span className="material-symbols-outlined duck-info-icon">info</span>
        <p>
          Нажми на быстрый сценарий или напиши запрос в свободной форме. ИИ проанализирует контекст проекта и предложит варианты действий.
        </p>
      </div>

      <form className="duck-dialog-history" onSubmit={onFormSubmit}>
        {messages.length === 0 ? (
          <p className="duck-dialog-empty">
            История сообщений пуста. Начните диалог с Уткой.
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
      </form>

      <footer className="duck-dialog-footer">
        <button type="button" className="duck-footer-btn duck-footer-btn-outline" onClick={onResetConversation}>
          Очистить
        </button>
        <button type="submit" form="duck-dialog-form" className="duck-footer-btn duck-footer-btn-primary" disabled={!draft.trim() || isTyping}>
          Отправить
          <span className="material-symbols-outlined">send</span>
        </button>
      </footer>
    </section>
  );
};
