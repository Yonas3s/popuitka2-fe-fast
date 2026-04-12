import { useMemo, useState } from 'react';
import type { Task, TaskStatus, TaskType, TeamMember } from '../../types/models';

type BoardViewProps = {
  tasks: Task[];
  members: TeamMember[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask: (title: string) => void;
};

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog',     label: 'Backlog',     color: '#94a3b8' },
  { status: 'todo',        label: 'Todo',        color: '#6366f1' },
  { status: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { status: 'review',      label: 'In Review',   color: '#10b981' },
  { status: 'done',        label: 'Done',        color: '#3b82f6' },
];

const TYPE_COLORS: Record<TaskType, string> = {
  feature: '#ec4899', bug: '#ef4444', task: '#6b7280',
  improvement: '#06b6d4', chore: '#a3a3a3',
};

export const BoardView = ({ tasks, members, onStatusChange, onCreateTask }: BoardViewProps) => {
  const [addCol, setAddCol] = useState<string | null>(null);
  const [addVal, setAddVal] = useState('');

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const grouped = useMemo(
    () => COLUMNS.map((col) => ({ ...col, tasks: tasks.filter((t) => t.status === col.status) })),
    [tasks],
  );

  return (
    <div className="bv">
      {grouped.map(({ status, label, color, tasks: colTasks }) => (
        <div key={status} className="bv-col">
          <div className="bv-col-head">
            <span className="bv-col-dot" style={{ background: color }} />
            <span className="bv-col-label">{label}</span>
            <span className="bv-col-count">{colTasks.length}</span>
          </div>

          <div className="bv-col-body">
            {colTasks.map((task) => {
              const mem = task.assigneeUserId ? memberMap[task.assigneeUserId] : null;
              const tc = TYPE_COLORS[task.taskType] || '#6b7280';
              return (
                <div key={task.id} className="bv-card">
                  <div className="bv-card-top">
                    {task.issueKey ? <span className="bv-card-key">{task.issueKey.toUpperCase()}</span> : null}
                    {onStatusChange ? (
                      <select
                        className="bv-card-status"
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>{c.label}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                  <p className="bv-card-title">{task.title}</p>
                  <div className="bv-card-bottom">
                    <span className="bv-card-type" style={{ '--tc': tc } as React.CSSProperties}>
                      {task.taskType}
                    </span>
                    {mem ? (
                      <span className="bv-card-av" title={`@${mem.username}`}>
                        {mem.username[0].toUpperCase()}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {addCol === status ? (
              <input
                className="bv-add-input"
                autoFocus
                placeholder="Issue title..."
                value={addVal}
                onChange={(e) => setAddVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && addVal.trim()) { onCreateTask(addVal.trim()); setAddVal(''); setAddCol(null); }
                  if (e.key === 'Escape') { setAddCol(null); setAddVal(''); }
                }}
                onBlur={() => { if (!addVal.trim()) { setAddCol(null); setAddVal(''); } }}
              />
            ) : (
              <button className="bv-add-btn" onClick={() => { setAddCol(status); setAddVal(''); }}>
                + Add issue
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
