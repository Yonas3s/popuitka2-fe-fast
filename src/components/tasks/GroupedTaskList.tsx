import { useMemo, useState } from 'react';
import type { Task, TaskStatus, TaskType, TeamMember, DirectionTag } from '../../types/models';
import { TaskMetaMenu, TASK_TYPE_CFG, ALL_TASK_TYPES, type MetaMenuItem } from './TaskMetaMenu';

type VisibleColumns = {
  id: boolean;
  status: boolean;
  assignee: boolean;
  priority: boolean;
  labels: boolean;
  created: boolean;
};

type Props = {
  tasks: Task[];
  members: TeamMember[];
  directions: DirectionTag[];
  showEmptyGroups?: boolean;
  visibleColumns?: VisibleColumns;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskTypeChange?: (taskId: string, taskType: TaskType) => void;
  onAssigneeChange?: (taskId: string, assigneeUserId: string | null) => void;
  onDirectionsChange?: (taskId: string, directionIds: string[]) => void;
  onOpenTask?: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onTitleSave: (taskId: string, title: string) => void;
  onCreateTask: (title: string) => void;
};

const DEFAULT_COLS: VisibleColumns = {
  id: true, status: true, assignee: true,
  priority: true, labels: true, created: true,
};

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'review', 'todo', 'backlog', 'done'];
const ALL_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const S: Record<TaskStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  review:      { label: 'In Review',   color: '#10b981' },
  todo:        { label: 'Todo',        color: '#6366f1' },
  backlog:     { label: 'Backlog',     color: '#94a3b8' },
  done:        { label: 'Done',        color: '#5a67d8' },
};

/** Alias for compatibility with existing code below. */
const T = TASK_TYPE_CFG;

const P: Record<string, { n: number; c: string }> = {
  urgent: { n: 4, c: '#ef4444' }, high: { n: 3, c: '#f97316' },
  medium: { n: 2, c: '#eab308' }, low: { n: 1, c: '#94a3b8' },
};

/* ── SVG Status Circle (14px, exactly like Linear) ── */
const SC = ({ s }: { s: TaskStatus }) => {
  const col = S[s].color;
  if (s === 'done') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill={col}/>
      <path d="M4.5 7l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (s === 'in_progress') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/>
      <path d="M7 1.5A5.5 5.5 0 0 1 7 12.5" fill={col}/>
    </svg>
  );
  if (s === 'review') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/>
      <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" fill={col}/>
    </svg>
  );
  if (s === 'todo') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1"/>
    </svg>
  );
  // backlog
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2.5 2"/>
    </svg>
  );
};

/* ── SVG Priority Bars (16px, exactly like Linear) ── */
const PB = ({ p }: { p: string }) => {
  const info = P[p];
  if (!info) return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="gtl-prio-svg">
      <circle cx="4.5" cy="8" r="1" fill="#cbd5e1"/><circle cx="8" cy="8" r="1" fill="#cbd5e1"/><circle cx="11.5" cy="8" r="1" fill="#cbd5e1"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="gtl-prio-svg">
      {[0,1,2,3].map(i => {
        const h = 5 + i * 3;
        return <rect key={i} x={1 + i * 4} y={16 - h - 1} width="2.5" height={h} rx="0.5" fill={i < info.n ? info.c : '#e2e8f0'}/>;
      })}
    </svg>
  );
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (raw: Record<string, unknown>) => {
  const v = (raw.createdAt || raw.created_at || '') as string;
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const GroupedTaskList = ({
  tasks, members, directions,
  showEmptyGroups = true,
  visibleColumns,
  onStatusChange, onTaskTypeChange, onAssigneeChange, onDirectionsChange: _onDirectionsChange,
  onOpenTask,
  onDelete: _onDelete, onTitleSave, onCreateTask,
}: Props) => {
  const cols = visibleColumns || DEFAULT_COLS;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ done: true });
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [addGroup, setAddGroup] = useState<string | null>(null);
  const [addVal, setAddVal] = useState('');
  const [menu, setMenu] = useState<
    | { kind: 'type' | 'assignee' | 'directions'; taskId: string; anchor: HTMLElement }
    | null
  >(null);

  const onDirectionsChange = _onDirectionsChange;

  const openMenu = (kind: 'type' | 'assignee' | 'directions', taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu({ kind, taskId, anchor: e.currentTarget as HTMLElement });
  };
  const closeMenu = () => setMenu(null);

  const mMap = useMemo(() => Object.fromEntries(members.map(m => [m.id, m])), [members]);
  const dMap = useMemo(() => Object.fromEntries(directions.map(d => [d.id, d.name])), [directions]);
  const groups = useMemo(() => STATUS_ORDER.map(s => ({ s, t: tasks.filter(t => t.status === s) })), [tasks]);

  return (
    <div className="li">
      {groups.filter(({ t: gt }) => showEmptyGroups || gt.length > 0).map(({ s, t: gt }) => {
        const isC = Boolean(collapsed[s]);
        return (
          <section key={s} className="li-g">
            {/* Group header */}
            <div className="li-gh">
              <button className="li-gh-l" onClick={() => setCollapsed(p => ({...p,[s]:!p[s]}))}>
                <svg width="12" height="12" viewBox="0 0 12 12" className="li-gh-arr" style={{transform:isC?'rotate(-90deg)':'none'}}>
                  <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <SC s={s}/>
                <span className="li-gh-name">{S[s].label}</span>
                <span className="li-gh-n">{gt.length}</span>
              </button>
              <button className="li-gh-add" onClick={()=>{setAddGroup(s);setAddVal('');}}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Rows */}
            {!isC && (
              <div className="li-rows">
                {gt.map(task => {
                  const tp = T[task.taskType] || T.task;
                  const mem = task.assigneeUserId ? mMap[task.assigneeUserId] : null;
                  const dirs = task.directionIds.map(id => dMap[id]).filter(Boolean);
                  const date = fmtDate(task.raw);
                  const editing = editId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`li-r${s==='done'?' li-done':''}`}
                      onClick={(e) => {
                        if (!onOpenTask) return;
                        // Ignore clicks on interactive children (tags, avatar, "+" button, selects, inputs, buttons).
                        const target = e.target as HTMLElement;
                        if (target.closest('button, select, input, .tmm, [data-no-open]')) return;
                        if (editId === task.id) return;
                        onOpenTask(task.id);
                      }}
                    >
                      {cols.priority && <div className="li-r-prio"><PB p={task.priority}/></div>}
                      {cols.id && <div className="li-r-key">{task.issueKey?.toUpperCase()||''}</div>}
                      {cols.status && <div className="li-r-st">
                        <SC s={task.status}/>
                        {onStatusChange && <select className="li-r-st-sel" value={task.status} onChange={e=>onStatusChange(task.id,e.target.value as TaskStatus)}>
                          {ALL_STATUSES.map(x=><option key={x} value={x}>{S[x].label}</option>)}
                        </select>}
                      </div>}
                      <div className="li-r-title">
                        {editing ? (
                          <input className="li-r-edit" autoFocus value={editVal}
                            onChange={e=>setEditVal(e.target.value)}
                            onBlur={()=>{if(editVal.trim())onTitleSave(task.id,editVal.trim());setEditId(null);}}
                            onKeyDown={e=>{if(e.key==='Enter'){if(editVal.trim())onTitleSave(task.id,editVal.trim());setEditId(null);}if(e.key==='Escape')setEditId(null);}}
                          />
                        ) : (
                          <span className="li-r-t" onDoubleClick={()=>{setEditId(task.id);setEditVal(task.title);}}>{task.title}</span>
                        )}
                      </div>
                      {cols.labels && <div className="li-r-tags">
                        {onTaskTypeChange ? (
                          <button
                            type="button"
                            className="li-tag li-tag-btn"
                            style={{'--tc':tp.color} as React.CSSProperties}
                            onClick={(e) => openMenu('type', task.id, e)}
                            aria-label={`Тип: ${tp.label}. Изменить`}
                          >{tp.label}</button>
                        ) : (
                          <span className="li-tag" style={{'--tc':tp.color} as React.CSSProperties}>{tp.label}</span>
                        )}
                        {dirs.map(n=><span key={n} className="li-tag" style={{'--tc':'#3b82f6'} as React.CSSProperties}>{n}</span>)}
                        {onDirectionsChange && directions.length > 0 && (
                          <button
                            type="button"
                            className="li-tag-add"
                            onClick={(e) => openMenu('directions', task.id, e)}
                            title="Направления"
                            aria-label="Направления"
                          >+</button>
                        )}
                      </div>}
                      {cols.assignee && <div className="li-r-av">
                        {onAssigneeChange ? (
                          <button
                            type="button"
                            className={`li-av-btn${mem ? '' : ' li-av-btn-empty'}`}
                            onClick={(e) => openMenu('assignee', task.id, e)}
                            aria-label={mem ? `Исполнитель: @${mem.username}. Изменить` : 'Назначить исполнителя'}
                          >
                            {mem ? mem.username[0].toUpperCase() : '?'}
                          </button>
                        ) : mem ? (
                          <span className="li-av" title={'@'+mem.username}>{mem.username[0].toUpperCase()}</span>
                        ) : null}
                      </div>}
                      {cols.created && <div className="li-r-date">{date}</div>}
                    </div>
                  );
                })}
                {addGroup===s && (
                  <div className="li-add">
                    <input className="li-add-in" autoFocus placeholder="Issue title..." value={addVal}
                      onChange={e=>setAddVal(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&addVal.trim()){onCreateTask(addVal.trim());setAddVal('');setAddGroup(null);}if(e.key==='Escape'){setAddGroup(null);setAddVal('');}}}
                      onBlur={()=>{if(!addVal.trim()){setAddGroup(null);setAddVal('');}}}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {menu && (() => {
        const task = tasks.find(t => t.id === menu.taskId);
        if (!task) return null;
        if (menu.kind === 'type' && onTaskTypeChange) {
          const items: MetaMenuItem[] = ALL_TASK_TYPES.map(t => ({
            value: t, label: T[t].label, dot: T[t].color,
          }));
          return (
            <TaskMetaMenu
              anchor={menu.anchor}
              items={items}
              selected={[task.taskType]}
              onSelect={(vals) => { const v = vals[0] as TaskType; if (v && v !== task.taskType) onTaskTypeChange(task.id, v); }}
              onClose={closeMenu}
            />
          );
        }
        if (menu.kind === 'assignee' && onAssigneeChange) {
          const items: MetaMenuItem[] = [
            { value: '', label: 'Unassigned', initial: '–' },
            ...members.map(m => ({ value: m.id, label: m.username, initial: m.username[0].toUpperCase(), hint: m.email ? undefined : undefined })),
          ];
          return (
            <TaskMetaMenu
              anchor={menu.anchor}
              items={items}
              selected={task.assigneeUserId ? [task.assigneeUserId] : ['']}
              searchable={members.length > 5}
              placeholder="Поиск участника…"
              onSelect={(vals) => { onAssigneeChange(task.id, vals[0] || null); }}
              onClose={closeMenu}
            />
          );
        }
        if (menu.kind === 'directions' && onDirectionsChange) {
          const items: MetaMenuItem[] = directions.map(d => ({
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
  );
};
