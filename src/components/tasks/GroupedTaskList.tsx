import { useMemo, useState } from 'react';
import type { Task, TaskStatus, TaskType, TeamMember, DirectionTag } from '../../types/models';
import { useUiStore } from '../../store/ui.store';

type GroupedTaskListProps = {
  tasks: Task[];
  members: TeamMember[];
  directions: DirectionTag[];
  onToggle: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onTitleSave: (taskId: string, title: string) => void;
  onCreateTask: (title: string) => void;
};

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'review', 'todo', 'backlog', 'done'];

const STATUS_META: Record<TaskStatus, { label: string; dotColor: string }> = {
  in_progress: { label: 'В РАБОТЕ', dotColor: '#f59e0b' },
  review: { label: 'НА РЕВЬЮ', dotColor: '#8b5cf6' },
  todo: { label: 'К ВЫПОЛНЕНИЮ', dotColor: '#3b82f6' },
  backlog: { label: 'БЭКЛОГ', dotColor: '#9ca3af' },
  done: { label: 'ЗАВЕРШЕНО', dotColor: '#10b981' },
};

const TYPE_META: Record<TaskType, { label: string; color: string; bg: string; border: string }> = {
  feature: { label: 'Фича', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  bug: { label: 'Баг', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  task: { label: 'Задача', color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' },
  improvement: { label: 'Улучшение', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  chore: { label: 'Техдолг', color: '#78716c', bg: '#fafaf9', border: '#e7e5e4' },
};

const PRIORITY_META: Record<string, { icon: string; color: string } | null> = {
  urgent: { icon: '⚡', color: '#ef4444' },
  high: { icon: '⏶', color: '#f97316' },
  medium: { icon: '〓', color: '#6b7280' },
  low: { icon: '⏷', color: '#cbd5e1' },
  none: null,
};

const ALL_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export const GroupedTaskList = ({
  tasks,
  members,
  onToggle,
  onStatusChange,
  onDelete,
  onTitleSave,
  onCreateTask,
}: GroupedTaskListProps) => {
  const pushToast = useUiStore((state) => state.pushToast);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newTaskDraft, setNewTaskDraft] = useState('');
  const [newTaskGroup, setNewTaskGroup] = useState<string | null>(null);

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, `@${m.username}`])),
    [members],
  );

  const groups = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        meta: STATUS_META[status],
        tasks: tasks.filter((t) => t.status === status),
      })),
    [tasks],
  );

  const toggle = (s: string) => setCollapsed((p) => ({ ...p, [s]: !p[s] }));

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveEdit = (taskId: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      pushToast('Название не может быть пустым', 'info');
      return;
    }
    onTitleSave(taskId, trimmed);
    setEditingId(null);
  };

  const submitNewTask = (status: TaskStatus) => {
    const trimmed = newTaskDraft.trim();
    if (!trimmed) return;
    onCreateTask(trimmed);
    setNewTaskDraft('');
    setNewTaskGroup(null);
  };

  return (
    <div className="gtl">
      {groups.map(({ status, meta, tasks: groupTasks }) => {
        const isCollapsed = Boolean(collapsed[status]);

        return (
          <section key={status} className="gtl-group">
            <button className="gtl-group-header" onClick={() => toggle(status)}>
              <span className="gtl-toggle">{isCollapsed ? '▸' : '▾'}</span>
              <span className="gtl-dot" style={{ color: meta.dotColor }}>●</span>
              <span className="gtl-label">{meta.label}</span>
              <span className="gtl-count">{groupTasks.length}</span>
            </button>

            {!isCollapsed ? (
              <div className="gtl-body">
                {groupTasks.length === 0 ? (
                  <div className="gtl-empty">Нет задач</div>
                ) : null}

                {groupTasks.map((task) => {
                  const type = TYPE_META[task.taskType] || TYPE_META.task;
                  const prio = PRIORITY_META[task.priority];
                  const isEditing = editingId === task.id;

                  return (
                    <article
                      key={task.id}
                      className={`gtl-task ${status === 'done' ? 'is-done' : ''}`}
                    >
                      <span
                        className="gtl-priority"
                        style={{ color: prio?.color || 'transparent' }}
                        title={task.priority !== 'none' ? task.priority : undefined}
                      >
                        {prio?.icon || ''}
                      </span>

                      {task.issueKey ? (
                        <span className="gtl-key">{task.issueKey.toUpperCase()}</span>
                      ) : (
                        <span className="gtl-key gtl-key-empty" />
                      )}

                      {isEditing ? (
                        <input
                          className="gtl-title-input"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(task.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(task.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <span
                          className="gtl-title"
                          onDoubleClick={() => startEdit(task)}
                        >
                          {task.title}
                        </span>
                      )}

                      <div className="gtl-right">
                        {onStatusChange ? (
                          <select
                            className="gtl-status-select"
                            value={task.status}
                            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                        ) : null}

                        <span
                          className="gtl-type"
                          style={{ color: type.color, background: type.bg, borderColor: type.border }}
                        >
                          {type.label}
                        </span>

                        {task.assigneeUserId ? (
                          <span className="gtl-assignee">
                            {memberNameById[task.assigneeUserId] || task.assigneeUserId.slice(0, 8)}
                          </span>
                        ) : null}

                        <button
                          className="gtl-action-btn"
                          title="Удалить"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* Inline add */}
                {newTaskGroup === status ? (
                  <div className="gtl-add-input-row">
                    <input
                      className="gtl-add-input"
                      autoFocus
                      placeholder="Название задачи..."
                      value={newTaskDraft}
                      onChange={(e) => setNewTaskDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitNewTask(status);
                        if (e.key === 'Escape') { setNewTaskGroup(null); setNewTaskDraft(''); }
                      }}
                      onBlur={() => {
                        if (!newTaskDraft.trim()) { setNewTaskGroup(null); setNewTaskDraft(''); }
                      }}
                    />
                  </div>
                ) : (
                  <button className="gtl-add-row" onClick={() => setNewTaskGroup(status)}>
                    <span className="gtl-add-icon">+</span>
                    <span>Новая задача...</span>
                  </button>
                )}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
};
