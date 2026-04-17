import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DirectionTag, Task, TaskStatus, TaskType, TeamMember } from '../../types/models';
import { TaskMetaMenu, TASK_TYPE_CFG, ALL_TASK_TYPES, type MetaMenuItem } from './TaskMetaMenu';

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  backlog:     { label: 'Backlog',     color: '#94a3b8' },
  todo:        { label: 'Todo',        color: '#6366f1' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  review:      { label: 'In Review',   color: '#10b981' },
  done:        { label: 'Done',        color: '#3b82f6' },
};

const STATUS_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const PRIORITY_META: Record<string, { label: string; color: string; bars: number }> = {
  urgent: { label: 'Urgent', color: '#ef4444', bars: 4 },
  high:   { label: 'High',   color: '#f97316', bars: 3 },
  medium: { label: 'Medium', color: '#eab308', bars: 2 },
  low:    { label: 'Low',    color: '#94a3b8', bars: 1 },
  none:   { label: 'No priority', color: '#cbd5e1', bars: 0 },
};

const PrioBars = ({ p }: { p: string }) => {
  const info = PRIORITY_META[p];
  if (!info || info.bars === 0) return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <circle cx="4.5" cy="7" r="1" fill="#cbd5e1"/>
      <circle cx="7" cy="7" r="1" fill="#cbd5e1"/>
      <circle cx="9.5" cy="7" r="1" fill="#cbd5e1"/>
    </svg>
  );
  return (
    <svg width="14" height="12" viewBox="0 0 14 12">
      {[0,1,2,3].map(i => {
        const h = 4 + i * 2.5;
        return <rect key={i} x={i * 3.5} y={12 - h} width="2.5" height={h} rx="0.5" fill={i < info.bars ? info.color : '#e2e8f0'}/>;
      })}
    </svg>
  );
};

const StatusDot = ({ s }: { s: TaskStatus }) => {
  const col = STATUS_META[s].color;
  if (s === 'done') return <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill={col}/><path d="M4.5 7l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
  if (s === 'in_progress') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/><path d="M7 1.5A5.5 5.5 0 0 1 7 12.5" fill={col}/></svg>;
  if (s === 'review') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/><path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" fill={col}/></svg>;
  if (s === 'todo') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2.5 2"/></svg>;
};

type OpenMenu = { kind: 'status' | 'type' | 'assignee' | 'directions'; anchor: HTMLElement } | null;

export type TaskDetailsDrawerProps = {
  task: Task;
  members: TeamMember[];
  directions: DirectionTag[];
  onClose: () => void;
  onTitleSave: (taskId: string, title: string) => void;
  onDescriptionSave: (taskId: string, description: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTypeChange: (taskId: string, type: TaskType) => void;
  onAssigneeChange: (taskId: string, assigneeUserId: string | null) => void;
  onDirectionsChange: (taskId: string, directionIds: string[]) => void;
  onDelete?: (taskId: string) => void;
};

export const TaskDetailsDrawer = ({
  task, members, directions,
  onClose, onTitleSave, onDescriptionSave,
  onStatusChange, onTypeChange, onAssigneeChange, onDirectionsChange,
  onDelete,
}: TaskDetailsDrawerProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [menu, setMenu] = useState<OpenMenu>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync local state when task changes (e.g. optimistic update from parent).
  useEffect(() => { setTitle(task.title); }, [task.id, task.title]);
  useEffect(() => { setDescription(task.description ?? ''); }, [task.id, task.description]);

  // Auto-grow title textarea.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !menu) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, menu]);

  const saveTitle = useCallback(() => {
    const next = title.trim();
    if (next && next !== task.title) onTitleSave(task.id, next);
  }, [title, task.id, task.title, onTitleSave]);

  const saveDescription = useCallback(() => {
    if (description !== (task.description ?? '')) onDescriptionSave(task.id, description);
  }, [description, task.id, task.description, onDescriptionSave]);

  const memberMap = useMemo(
    () => Object.fromEntries(members.map(m => [m.id, m])),
    [members],
  );

  const assignee = task.assigneeUserId ? memberMap[task.assigneeUserId] : null;
  const selectedDirections = directions.filter(d => task.directionIds.includes(d.id));
  const fmtDate = (raw: Record<string, unknown>) => {
    const v = (raw.createdAt || raw.created_at || '') as string;
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const prMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.none;
  const tpMeta = TASK_TYPE_CFG[task.taskType] ?? TASK_TYPE_CFG.task;

  const openMenu = (kind: NonNullable<OpenMenu>['kind']) => (e: React.MouseEvent) => {
    setMenu({ kind, anchor: e.currentTarget as HTMLElement });
  };
  const closeMenu = () => setMenu(null);

  return (
    <div className="tdd-overlay" onClick={onClose}>
      <div className="tdd" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={task.title}>
        {/* Top bar */}
        <header className="tdd-top">
          <div className="tdd-top-crumbs">
            <span className="tdd-top-key">{task.issueKey?.toUpperCase() || task.id.slice(0, 6)}</span>
          </div>
          <div className="tdd-top-actions">
            {onDelete && (
              <button className="tdd-top-btn" onClick={() => onDelete(task.id)} title="Удалить">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2.5 3.5h9M5 3.5V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5M4 3.5v8a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-8M6 6v4M8 6v4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button className="tdd-top-btn" onClick={onClose} title="Закрыть (Esc)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="tdd-body">
          {/* Main content */}
          <section className="tdd-main">
            <textarea
              ref={titleRef}
              className="tdd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle(); (e.target as HTMLTextAreaElement).blur(); }
              }}
              placeholder="Название задачи"
              rows={1}
            />

            <label className="tdd-block-label">Описание</label>
            <textarea
              className="tdd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder="Добавьте описание, заметки, ссылки…"
            />
          </section>

          {/* Right sidebar — properties */}
          <aside className="tdd-aside">
            <div className="tdd-prop">
              <span className="tdd-prop-lab">Статус</span>
              <button type="button" className="tdd-prop-val" onClick={openMenu('status')}>
                <StatusDot s={task.status} />
                <span>{STATUS_META[task.status].label}</span>
              </button>
            </div>

            <div className="tdd-prop">
              <span className="tdd-prop-lab">Приоритет</span>
              <span className="tdd-prop-val tdd-prop-val-ro" title="Приоритет пока меняется только через агента">
                <PrioBars p={task.priority} />
                <span>{prMeta.label}</span>
              </span>
            </div>

            <div className="tdd-prop">
              <span className="tdd-prop-lab">Тип</span>
              <button type="button" className="tdd-prop-val" onClick={openMenu('type')}>
                <span className="tdd-dot" style={{ background: tpMeta.color }} />
                <span>{tpMeta.label}</span>
              </button>
            </div>

            <div className="tdd-prop">
              <span className="tdd-prop-lab">Исполнитель</span>
              <button type="button" className="tdd-prop-val" onClick={openMenu('assignee')}>
                {assignee ? (
                  <>
                    <span className="tdd-av">{assignee.username[0].toUpperCase()}</span>
                    <span>@{assignee.username}</span>
                  </>
                ) : (
                  <>
                    <span className="tdd-av tdd-av-empty">?</span>
                    <span className="tdd-muted">Не назначен</span>
                  </>
                )}
              </button>
            </div>

            <div className="tdd-prop tdd-prop-col">
              <span className="tdd-prop-lab">Направления</span>
              <div className="tdd-dirs">
                {selectedDirections.length > 0 ? (
                  selectedDirections.map((d) => (
                    <span key={d.id} className="tdd-dir-chip">{d.name}</span>
                  ))
                ) : (
                  <span className="tdd-muted tdd-muted-small">—</span>
                )}
                {directions.length > 0 && (
                  <button type="button" className="tdd-dir-add" onClick={openMenu('directions')} title="Направления">+</button>
                )}
              </div>
            </div>

            <hr className="tdd-sep" />

            <div className="tdd-prop tdd-prop-meta">
              <span className="tdd-prop-lab">ID</span>
              <span className="tdd-prop-val-ro tdd-mono">{task.issueKey?.toUpperCase() || task.id.slice(0, 8)}</span>
            </div>

            <div className="tdd-prop tdd-prop-meta">
              <span className="tdd-prop-lab">Создана</span>
              <span className="tdd-prop-val-ro">{fmtDate(task.raw) || '—'}</span>
            </div>
          </aside>
        </div>

        {menu && (() => {
          if (menu.kind === 'status') {
            const items: MetaMenuItem[] = STATUS_ORDER.map((s) => ({
              value: s, label: STATUS_META[s].label, dot: STATUS_META[s].color,
            }));
            return (
              <TaskMetaMenu
                anchor={menu.anchor}
                items={items}
                selected={[task.status]}
                onSelect={(vals) => { const v = vals[0] as TaskStatus; if (v && v !== task.status) onStatusChange(task.id, v); }}
                onClose={closeMenu}
              />
            );
          }
          if (menu.kind === 'type') {
            const items: MetaMenuItem[] = ALL_TASK_TYPES.map((t) => ({
              value: t, label: TASK_TYPE_CFG[t].label, dot: TASK_TYPE_CFG[t].color,
            }));
            return (
              <TaskMetaMenu
                anchor={menu.anchor}
                items={items}
                selected={[task.taskType]}
                onSelect={(vals) => { const v = vals[0] as TaskType; if (v && v !== task.taskType) onTypeChange(task.id, v); }}
                onClose={closeMenu}
              />
            );
          }
          if (menu.kind === 'assignee') {
            const items: MetaMenuItem[] = [
              { value: '', label: 'Не назначен', initial: '–' },
              ...members.map((m) => ({ value: m.id, label: m.username, initial: m.username[0].toUpperCase() })),
            ];
            return (
              <TaskMetaMenu
                anchor={menu.anchor}
                items={items}
                selected={task.assigneeUserId ? [task.assigneeUserId] : ['']}
                searchable={members.length > 5}
                placeholder="Поиск участника…"
                onSelect={(vals) => onAssigneeChange(task.id, vals[0] || null)}
                onClose={closeMenu}
              />
            );
          }
          if (menu.kind === 'directions') {
            const items: MetaMenuItem[] = directions.map((d) => ({
              value: d.id, label: d.name, dot: '#3b82f6',
            }));
            return (
              <TaskMetaMenu
                anchor={menu.anchor}
                items={items}
                selected={task.directionIds}
                multi
                searchable={directions.length > 5}
                placeholder="Поиск направления…"
                emptyLabel="Нет направлений"
                onSelect={(vals) => onDirectionsChange(task.id, vals)}
                onClose={closeMenu}
              />
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};
