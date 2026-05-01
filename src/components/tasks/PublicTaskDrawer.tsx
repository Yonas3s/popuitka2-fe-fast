import { useEffect, type CSSProperties } from 'react';
import type { Task, TaskStatus } from '../../types/models';
import { TASK_TYPE_CFG } from './TaskMetaMenu';

const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: 'pending' | 'active' | 'review' | 'completed'; color: string }> = {
  backlog: { label: 'Запланировано', tone: 'pending', color: '#94a3b8' },
  todo: { label: 'В очереди', tone: 'pending', color: '#6366f1' },
  in_progress: { label: 'В работе', tone: 'active', color: '#f59e0b' },
  review: { label: 'На проверке', tone: 'review', color: '#f43f5e' },
  done: { label: 'Готово', tone: 'completed', color: '#10b981' },
};

const formatCreatedAt = (raw: Record<string, unknown>) => {
  const value = typeof raw.createdAt === 'string'
    ? raw.createdAt
    : typeof raw.created_at === 'string'
      ? raw.created_at
      : '';

  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

type PublicTaskDrawerProps = {
  task: Task;
  onClose: () => void;
};

export const PublicTaskDrawer = ({ task, onClose }: PublicTaskDrawerProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const statusMeta = TASK_STATUS_META[task.status];
  const typeMeta = TASK_TYPE_CFG[task.taskType] || TASK_TYPE_CFG.task;
  const description = task.description?.trim() || 'Описание для этой задачи пока не добавлено.';
  const createdAt = formatCreatedAt(task.raw);
  const taskKey = task.issueKey?.toUpperCase() || task.id.slice(0, 8);

  return (
    <div className="tdd-overlay" onClick={onClose}>
      <div className="tdd" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={task.title}>
        <header className="tdd-top">
          <div className="tdd-top-crumbs">
            <span className="tdd-top-key">{taskKey}</span>
          </div>
          <div className="tdd-top-actions">
            <button className="tdd-top-btn" onClick={onClose} title="Закрыть (Esc)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="tdd-body">
          <section className="tdd-main">
            <span className="pcp-drawer-note">Публичный просмотр задачи</span>
            <h2 className="tdd-title tdd-title-ro">{task.title}</h2>

            <div className="pcp-task-drawer-meta">
              <span className={`pcp-pill pcp-pill--${statusMeta.tone}`}>
                <span className="pcp-pill-dot" />
                {statusMeta.label}
              </span>
              <span className="pcp-task-type" style={{ '--tc': typeMeta.color } as CSSProperties}>
                <span className="pcp-task-type-dot" />
                {typeMeta.label}
              </span>
            </div>

            <label className="tdd-block-label">Описание</label>
            <div className="tdd-desc tdd-desc--readonly">{description}</div>
          </section>

          <aside className="tdd-aside">
            <div className="tdd-prop">
              <span className="tdd-prop-lab">Статус</span>
              <span className="tdd-prop-val-ro">
                <span className="tdd-dot" style={{ background: statusMeta.color }} />
                <span>{statusMeta.label}</span>
              </span>
            </div>

            <div className="tdd-prop">
              <span className="tdd-prop-lab">Тип</span>
              <span className="tdd-prop-val-ro">
                <span className="tdd-dot" style={{ background: typeMeta.color }} />
                <span>{typeMeta.label}</span>
              </span>
            </div>

            <hr className="tdd-sep" />

            <div className="tdd-prop tdd-prop-meta">
              <span className="tdd-prop-lab">Ключ</span>
              <span className="tdd-prop-val-ro tdd-mono">{taskKey}</span>
            </div>

            <div className="tdd-prop tdd-prop-meta">
              <span className="tdd-prop-lab">ID</span>
              <span className="tdd-prop-val-ro tdd-mono">{task.id}</span>
            </div>

            {createdAt && (
              <div className="tdd-prop tdd-prop-meta">
                <span className="tdd-prop-lab">Создана</span>
                <span className="tdd-prop-val-ro">{createdAt}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
