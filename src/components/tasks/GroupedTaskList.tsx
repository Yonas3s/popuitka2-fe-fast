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

const STATUS_CFG: Record<TaskStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  review:      { label: 'In Review',   color: '#10b981' },
  todo:        { label: 'Todo',        color: '#6366f1' },
  backlog:     { label: 'Backlog',     color: '#9ca3af' },
  done:        { label: 'Done',        color: '#3b82f6' },
};

const TYPE_CFG: Record<TaskType, { label: string; color: string }> = {
  feature:     { label: 'Feature',     color: '#ec4899' },
  bug:         { label: 'Bug',         color: '#ef4444' },
  task:        { label: 'Task',        color: '#6b7280' },
  improvement: { label: 'Improvement', color: '#06b6d4' },
  chore:       { label: 'Chore',       color: '#a3a3a3' },
};

/* ── Status circle SVG ── */
const StatusCircle = ({ status, size = 16 }: { status: TaskStatus; size?: number }) => {
  const c = STATUS_CFG[status].color;
  const r = size / 2 - 1.5;
  const cx = size / 2;

  if (status === 'done') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gtl-status-svg">
        <circle cx={cx} cy={cx} r={r} fill={c} />
        <path d={`M${cx - 3} ${cx} l2 2 l4 -4`} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'in_progress') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gtl-status-svg">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={c} strokeWidth="1.5" />
        <path d={`M${cx} ${cx - r} A${r} ${r} 0 1 1 ${cx} ${cx + r}`} fill={c} />
      </svg>
    );
  }
  if (status === 'review') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gtl-status-svg">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={c} strokeWidth="1.5" />
        <path d={`M${cx} ${cx - r} A${r} ${r} 0 1 1 ${cx - r} ${cx} L${cx} ${cx} Z`} fill={c} />
      </svg>
    );
  }
  // todo, backlog — open circle
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gtl-status-svg">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={status === 'backlog' ? '#d1d5db' : c} strokeWidth="1.5"
        strokeDasharray={status === 'backlog' ? '2 2' : 'none'} />
    </svg>
  );
};

/* ── Priority bars ── */
const PriorityBars = ({ priority }: { priority: string }) => {
  const levels: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const colors: Record<string, string> = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8' };
  const n = levels[priority] || 0;
  const color = colors[priority] || '#d1d5db';

  if (n === 0) {
    return (
      <span className="gtl-prio" title="No priority">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#d1d5db">
          <circle cx="4" cy="8" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="12" cy="8" r="1" />
        </svg>
      </span>
    );
  }

  return (
    <span className="gtl-prio" title={priority}>
      <svg width="14" height="14" viewBox="0 0 14 14">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 3.5}
            y={14 - (4 + i * 3)}
            width="2.5"
            height={4 + i * 3}
            rx="0.5"
            fill={i < n ? color : '#e5e7eb'}
          />
        ))}
      </svg>
    </span>
  );
};

const ALL_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export const GroupedTaskList = ({
  tasks, members, directions,
  onStatusChange, onDelete: _onDelete, onTitleSave, onCreateTask,
}: GroupedTaskListProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingGroup, setAddingGroup] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState('');

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );
  const dirMap = useMemo(
    () => Object.fromEntries(directions.map((d) => [d.id, d.name])),
    [directions],
  );

  const groups = useMemo(
    () => STATUS_ORDER.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) })),
    [tasks],
  );

  const toggle = (s: string) => setCollapsed((p) => ({ ...p, [s]: !p[s] }));

  const startEdit = (t: Task) => { setEditingId(t.id); setEditValue(t.title); };
  const saveEdit = (id: string) => {
    if (editValue.trim()) onTitleSave(id, editValue.trim());
    setEditingId(null);
  };
  const submitNew = () => {
    if (newDraft.trim()) onCreateTask(newDraft.trim());
    setNewDraft(''); setAddingGroup(null);
  };

  const fmtDate = (raw: Record<string, unknown>) => {
    const v = (raw.createdAt || raw.created_at || '') as string;
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="gtl">
      {groups.map(({ status, tasks: gt }) => {
        const cfg = STATUS_CFG[status];
        const isCol = Boolean(collapsed[status]);

        return (
          <section key={status} className="gtl-group">
            {/* ── Group header ── */}
            <div className="gtl-gh">
              <button className="gtl-gh-btn" onClick={() => toggle(status)}>
                <svg className="gtl-gh-arrow" width="10" height="10" viewBox="0 0 10 10" style={{ transform: isCol ? 'rotate(-90deg)' : 'none' }}>
                  <path d="M2 3 l3 3 l3 -3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <StatusCircle status={status} />
                <span className="gtl-gh-label">{cfg.label}</span>
                <span className="gtl-gh-count">{gt.length}</span>
              </button>
              <button className="gtl-gh-plus" onClick={() => { setAddingGroup(status); setNewDraft(''); }}>
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* ── Rows ── */}
            {!isCol ? (
              <div className="gtl-rows">
                {gt.map((task) => {
                  const tp = TYPE_CFG[task.taskType] || TYPE_CFG.task;
                  const member = task.assigneeUserId ? memberMap[task.assigneeUserId] : null;
                  const dirs = task.directionIds.map((id) => dirMap[id]).filter(Boolean);
                  const date = fmtDate(task.raw);
                  const isEditing = editingId === task.id;

                  return (
                    <div key={task.id} className={`gtl-r ${status === 'done' ? 'gtl-r-done' : ''}`}>
                      {/* Priority */}
                      <PriorityBars priority={task.priority} />

                      {/* Key */}
                      <span className="gtl-r-key">{task.issueKey ? task.issueKey.toUpperCase() : ''}</span>

                      {/* Status */}
                      <div className="gtl-r-status">
                        <StatusCircle status={task.status} size={18} />
                        {onStatusChange ? (
                          <select
                            className="gtl-r-status-sel"
                            value={task.status}
                            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          >
                            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                          </select>
                        ) : null}
                      </div>

                      {/* Title */}
                      <div className="gtl-r-title-cell">
                        {isEditing ? (
                          <input
                            className="gtl-r-title-edit"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(task.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null); }}
                          />
                        ) : (
                          <span className="gtl-r-title" onDoubleClick={() => startEdit(task)}>
                            {task.title}
                          </span>
                        )}
                      </div>

                      {/* Labels */}
                      <div className="gtl-r-labels">
                        <span className="gtl-pill" style={{ '--pill-color': tp.color } as React.CSSProperties}>
                          {tp.label}
                        </span>
                        {dirs.slice(0, 1).map((name) => (
                          <span key={name} className="gtl-pill" style={{ '--pill-color': '#3b82f6' } as React.CSSProperties}>
                            {name}
                          </span>
                        ))}
                      </div>

                      {/* Assignee */}
                      <div className="gtl-r-assignee">
                        {member ? (
                          <span className="gtl-r-avatar" title={`@${member.username}`}>
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        ) : null}
                      </div>

                      {/* Date */}
                      <span className="gtl-r-date">{date}</span>
                    </div>
                  );
                })}

                {/* Inline add */}
                {addingGroup === status ? (
                  <div className="gtl-add">
                    <input
                      className="gtl-add-input"
                      autoFocus
                      placeholder="Новая задача..."
                      value={newDraft}
                      onChange={(e) => setNewDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') { setAddingGroup(null); setNewDraft(''); } }}
                      onBlur={() => { if (!newDraft.trim()) { setAddingGroup(null); setNewDraft(''); } }}
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
