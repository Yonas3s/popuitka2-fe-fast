import type { KeyboardEvent, RefObject } from 'react';
import type { DuckMessage } from '../../store/duck.store';
import type { WorkflowType } from '../../types/models';

type StageOption = {
  id: string;
  label: string;
};

type QuickAction = {
  id: string;
  label: string;
  icon: string;
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

export const DuckDialog = ({
  open,
  projectId,
  projectName,
  canCreateTasks,
  createTasks,
  taskLimit,
  draft,
  isTyping,
  quickActions,
  onClose,
  onSubmit,
  onDraftChange,
  onCreateTasksChange,
  onTaskLimitChange,
  onResetConversation,
  inputRef,
}: DuckDialogProps) => {
  if (!open) {
    return null;
  }

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
    subtitleParts.push('Orbit Payments');
  }
  const subtitle = subtitleParts.join(' · ');

  return (
    <div className="duck-dialog">
      {/* Header */}
      <header className="duck-dialog-head">
        <div className="duck-dialog-title">
          <div className="duck-dialog-icon">
            <span className="material-symbols-outlined duck-icon-filled">smart_toy</span>
          </div>
          <div>
            <h3>Утка</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="duck-close-btn">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* Body */}
      <div className="duck-dialog-body">
        {/* Quick Scenarios */}
        <div className="duck-quick-scenarios">
          <label className="duck-section-label">Быстрые сценарии</label>
          <div className="duck-quick-actions">
            {quickActions.map((action) => (
              <button key={action.id} type="button" onClick={action.onClick} className="duck-quick-action-btn">
                <span className="material-symbols-outlined duck-action-icon">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Row */}
        <div className="duck-settings-row">
          <label className="duck-toggle-label">
            <div className="duck-toggle">
              <input
                type="checkbox"
                checked={createTasks && canCreateTasks}
                disabled={!canCreateTasks}
                onChange={(event) => onCreateTasksChange(event.target.checked)}
                className="duck-toggle-input"
              />
              <span className="duck-toggle-track"></span>
              <span className="duck-toggle-thumb"></span>
            </div>
            <span className="duck-toggle-text">Автосоздание задач</span>
          </label>
          <div className="duck-limit-control">
            <label htmlFor="duck-limit-input" className="duck-limit-label">Лимит</label>
            <input
              id="duck-limit-input"
              type="number"
              min={1}
              max={20}
              value={taskLimit}
              disabled={!createTasks || !canCreateTasks}
              onChange={(event) => onTaskLimitChange(Number(event.target.value))}
              className="duck-limit-input"
            />
          </div>
        </div>

        {/* Main Input */}
        <div className="duck-input-area">
          <textarea
            ref={inputRef}
            value={draft}
            onKeyDown={onTextareaKeyDown}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Что нужно сделать?"
            rows={4}
            className="duck-textarea"
          />
        </div>

        {/* Info Area */}
        <div className="duck-info-area">
          <span className="material-symbols-outlined duck-info-icon">info</span>
          <p className="duck-info-text">
            Нажми на быстрый сценарий или напиши запрос в свободной форме. ИИ проанализирует контекст проекта и предложит варианты действий.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="duck-dialog-footer">
        <button type="button" className="duck-footer-btn duck-footer-btn-outline" onClick={onResetConversation}>
          Очистить
        </button>
        <button type="submit" className="duck-footer-btn duck-footer-btn-primary" onClick={onSubmit} disabled={!draft.trim() || isTyping}>
          Отправить
          <span className="material-symbols-outlined duck-send-icon">send</span>
        </button>
      </footer>
    </div>
  );
};
