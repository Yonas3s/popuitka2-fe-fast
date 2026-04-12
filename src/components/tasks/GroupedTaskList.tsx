import { useMemo, useState } from 'react';
import type { Task, TaskStatus, TaskType, TeamMember, DirectionTag } from '../../types/models';

type GroupedTaskListProps = {
  tasks: Task[];
  members: TeamMember[];
  directions: DirectionTag[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onTitleSave: (taskId: string, title: string) => void;
  onCreateTask: (title: string) => void;
};

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'review', 'todo', 'backlog', 'done'];

const STATUS_META: Record<TaskStatus, { label: string; icon: string; iconClass: string }> = {
  in_progress: { label: 'In Progress', icon: '◑', iconClass: 'gtl-si-progress' },
  review: { label: 'In Review', icon: '◕', iconClass: 'gtl-si-review' },
  todo: { label: 'Todo', icon: '○', iconClass: 'gtl-si-todo' },
  backlog: { label: 'Backlog', icon: '◌', iconClass: 'gtl-si-backlog' },
  done: { label: 'Done', icon: '●', iconClass: 'gtl-si-done' },
};

const TYPE_META: Record<TaskType, { label: string; dotColor: string }> = {
  feature: { label: 'Feature', dotColor: '#f472b6' },
  bug: { label: 'Bug', dotColor: '#ef4444' },
  task: { label: 'Task', dotColor: '#6b7280' },
  improvement: { label: 'Improvement', dotColor: '#06b6d4' },
  chore: { label: 'Chore', dotColor: '#a3a3a3' },
};

const PRIORITY_BARS: Record<string, { bars: number; color: string; title: string }> = {
  urgent: { bars: 4, color: '#ef4444', title: 'Urgent' },
  high: { bars: 3, color: '#f97316', title: 'High' },
  medium: { bars: 2, color: '#eab308', title: 'Medium' },
  low: { bars: 1, color: '#9ca3af', title: 'Low' },
  none: { bars: 0, color: 'transparent', title: 'No priority' },
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  const p = PRIORITY_BARS[priority] || PRIORITY_BARS.none;
  if (p.bars === 0) {
    return <span className="gtl-prio" title={p.title}><span className="gtl-prio-dots">···</span></span>;
  }
  return (
    <span className="gtl-prio" title={p.title}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="gtl-prio-bar"
          style={{
            background: i <= p.bars ? p.color : '#e5e7eb',
            height: `${6 + i * 3}px`,
          }}
        />
      ))}
    </span>
  );
};

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  const meta = STATUS_META[status];
  return <span className={`gtl-si ${meta.iconClass}`}>{meta.icon}</span>;
};

const ALL_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const formatDate = (raw: Record<string, unknown>): string => {
  const v = (raw.createdAt as string) || (raw.created_at as string) || '';
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
};

export const GroupedTaskList = ({
  tasks,
  members,
  directions,
  onStatusChange,
  onDelete,
  onTitleSave,
  onCreateTask,
}: GroupedTaskListProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingGroup, setAddingGroup] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState('');

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.username])),
    [members],
  );

  const directionNameById = useMemo(
    () => Object.fromEntries(directions.map((d) => [d.id, d.name])),
    [directions],
  );

  const groups = useMemo(
    () => STATUS_ORDER.map((status) => ({
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
    if (trimmed) onTitleSave(taskId, trimmed);
    setEditingId(null);
  };

  const submitNew = () => {
    const trimmed = newDraft.trim();
    if (trimmed) onCreateTask(trimmed);
    setNewDraft('');
    setAddingGroup(null);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="gtl">
      {groups.map(({ status, meta, tasks: groupTasks }) => {
        const isCollapsed = Boolean(collapsed[status]);

        return (
          <section key={status} className="gtl-group">
            <div className="gtl-group-header">
              <button className="gtl-group-toggle-btn" onClick={() => toggle(status)}>
                <span className="gtl-toggle">{isCollapsed ? '▸' : '▾'}</span>
                <StatusIcon status={status} />
                <span className="gtl-label">{meta.label}</span>
                <span className="gtl-count">{groupTasks.length}</span>
              </button>
              <button
                className="gtl-group-add"
                onClick={() => { setAddingGroup(status); setNewDraft(''); }}
                title="Добавить задачу"
              >
                +
              </button>
            </div>

            {!isCollapsed ? (
              <div className="gtl-body">
                {groupTasks.map((task) => {
                  const type = TYPE_META[task.taskType] || TYPE_META.task;
                  const isEditing = editingId === task.id;
                  const assigneeName = task.assigneeUserId ? memberNameById[task.assigneeUserId] : null;
                  const taskDirs = task.directionIds
                    .map((id) => directionNameById[id])
                    .filter(Boolean);
                  const dateLabel = formatDate(task.raw);

                  return (
                    <article
                      key={task.id}
                      className={`gtl-row ${status === 'done' ? 'is-done' : ''}`}
                    >
                      {/* Priority */}
                      <PriorityIcon priority={task.priority} />

                      {/* Issue key */}
                      {task.issueKey ? (
                        <span className="gtl-key">{task.issueKey.toUpperCase()}</span>
                      ) : (
                        <span className="gtl-key gtl-key-empty" />
                      )}

                      {/* Status icon (clickable) */}
                      {onStatusChange ? (
                        <div className="gtl-status-wrap">
                          <StatusIcon status={task.status} />
                          <select
                            className="gtl-status-select"
                            value={task.status}
                            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_META[s].label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <StatusIcon status={task.status} />
                      )}

                      {/* Title */}
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
                        <span className="gtl-title" onDoubleClick={() => startEdit(task)}>
                          {task.title}
                          {task.description ? (
                            <span className="gtl-title-sub"> › {task.description.slice(0, 40)}</span>
                          ) : null}
                        </span>
                      )}

                      {/* Right side: labels, assignee, date */}
                      <div className="gtl-right">
                        {/* Type label */}
                        <span className="gtl-label-pill">
                          <span className="gtl-label-dot" style={{ background: type.dotColor }} />
                          {type.label}
                        </span>

                        {/* Direction labels */}
                        {taskDirs.slice(0, 1).map((name) => (
                          <span key={name} className="gtl-label-pill gtl-label-dir">
                            <span className="gtl-label-dot" style={{ background: '#3b82f6' }} />
                            {name}
                          </span>
                        ))}

                        {/* Assignee avatar */}
                        {assigneeName ? (
                          <span className="gtl-avatar" title={`@${assigneeName}`}>
                            {getInitial(assigneeName)}
                          </span>
                        ) : (
                          <span className="gtl-avatar gtl-avatar-empty" />
                        )}

                        {/* Date */}
                        {dateLabel ? (
                          <span className="gtl-date">{dateLabel}</span>
                        ) : null}

                        {/* Delete */}
                        <button
                          className="gtl-delete"
                          title="Удалить"
                          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                })}

                {addingGroup === status ? (
                  <div className="gtl-inline-add">
                    <input
                      className="gtl-inline-input"
                      autoFocus
                      placeholder="Название задачи..."
                      value={newDraft}
                      onChange={(e) => setNewDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitNew();
                        if (e.key === 'Escape') { setAddingGroup(null); setNewDraft(''); }
                      }}
                      onBlur={() => {
                        if (!newDraft.trim()) { setAddingGroup(null); setNewDraft(''); }
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
};
