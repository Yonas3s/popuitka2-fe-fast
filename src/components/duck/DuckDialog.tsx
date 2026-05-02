import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import type { DuckMessage } from '../../store/duck.store';
import type { WorkflowType } from '../../types/models';
import { PixelDuck, type DuckMood } from './PixelDuck';

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
  mood: DuckMood;
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
  model,
  mood,
  draft,
  isTyping,
  messages,
  stageOptions,
  preferredStageId,
  quickActions,
  onClose,
  onSubmit,
  onDraftChange,
  onModelChange,
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
  const modeLabel = workflowType === 'flat' ? 'flat-проект' : 'этапы';
  const statusLabel = isTyping ? 'думаю' : canCreateTasks ? 'готов к задачам' : 'только анализ';

  return (
    <section className="duck-dialog" role="dialog" aria-modal="true" aria-label="Утка - AI-агент">
      <header className="duck-dialog-head">
        <div className="duck-dialog-hero">
          <div className={`duck-dialog-avatar duck-dialog-avatar--${mood}`}>
            <PixelDuck mood={mood} className="duck-dialog-avatar-art" />
          </div>
          <div className="duck-dialog-title">
            <div className="duck-dialog-title-line">
              <h3>Утка</h3>
              <span className={`duck-dialog-status ${isTyping ? 'is-busy' : 'is-ready'}`}>
                {statusLabel}
              </span>
            </div>
            <p>{subtitle}</p>
          </div>
        </div>
        <button className="duck-dialog-close" type="button" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>

      <div className="duck-dialog-actions">
        {quickActions.map((action, index) => (
          <button key={action.id} type="button" onClick={action.onClick}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{action.label}</strong>
          </button>
        ))}
      </div>

      <div className="duck-dialog-controls">
        <div className={`duck-dialog-control-card duck-dialog-control-toggle ${!canCreateTasks ? 'is-disabled' : ''}`}>
          <label>
            <input
              type="checkbox"
              checked={createTasks && canCreateTasks}
              disabled={!canCreateTasks}
              onChange={(event) => onCreateTasksChange(event.target.checked)}
            />
            <span>Автозадачи</span>
          </label>
          <small>{canCreateTasks ? 'Утка может создать задачи' : 'Нужна роль owner'}</small>
        </div>

        <label className="duck-dialog-control-card">
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
          <label className="duck-dialog-control-card duck-dialog-stage-control">
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

        <label className="duck-dialog-control-card duck-dialog-model-control">
          <span>Модель</span>
          <input
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            placeholder="auto"
          />
        </label>
      </div>

      <div className="duck-dialog-history">
        {messages.length === 0 ? (
          <div className="duck-dialog-empty">
            <strong>Готова разобрать текущий контекст</strong>
            <span>
              Выбери сценарий или напиши запрос. Контекст: {modeLabel}. Отправка: <code>Ctrl/Cmd + Enter</code>.
            </span>
          </div>
        ) : (
          <ul>
            {messages.map((message) => (
              <li key={message.id} className={`duck-message ${message.role === 'assistant' ? 'is-assistant' : 'is-user'}`}>
                <div className="duck-message-avatar" aria-hidden="true">
                  {message.role === 'assistant' ? (
                    <PixelDuck mood="idle" className="duck-message-duck" />
                  ) : (
                    <span>Вы</span>
                  )}
                </div>
                <div className="duck-message-bubble">
                  <div className="duck-message-meta">
                    <strong>{message.role === 'assistant' ? 'Duck' : 'Вы'}</strong>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                  <p>{message.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {isTyping ? (
          <div className="duck-dialog-typing">
            <span aria-hidden="true" />
            Duck собирает контекст...
          </div>
        ) : null}
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
          <span>Ctrl/Cmd + Enter</span>
          <button type="button" className="duck-link-btn" onClick={onResetConversation}>
            Очистить
          </button>
          <button type="submit" className="duck-primary-btn" disabled={!draft.trim() || isTyping}>
            Запустить
          </button>
        </div>
      </form>
    </section>
  );
};
