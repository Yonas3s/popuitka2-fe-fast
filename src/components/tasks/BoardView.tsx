import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { DirectionTag, Task, TaskPriority, TaskStatus, TaskType, TeamMember } from '../../types/models';
import { getDirectionColor } from '../../lib/directions/color';
import {
  TaskMetaMenu,
  TASK_TYPE_CFG,
  ALL_TASK_TYPES,
  TASK_PRIORITY_CFG,
  ALL_TASK_PRIORITIES,
  type MetaMenuItem,
} from './TaskMetaMenu';

type BoardViewProps = {
  tasks: Task[];
  members: TeamMember[];
  directions?: DirectionTag[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskTypeChange?: (taskId: string, taskType: TaskType) => void;
  onAssigneeChange?: (taskId: string, assigneeUserId: string | null) => void;
  onDirectionsChange?: (taskId: string, directionIds: string[]) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  onOpenTask?: (taskId: string) => void;
  onCreateTask: (title: string) => void;
};

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog',     label: 'Backlog',     color: '#94a3b8' },
  { status: 'todo',        label: 'Todo',        color: '#6366f1' },
  { status: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { status: 'review',      label: 'In Review',   color: '#10b981' },
  { status: 'done',        label: 'Done',        color: '#3b82f6' },
];

const P: Record<string, { n: number; c: string }> = {
  urgent: { n: 4, c: '#ef4444' }, high: { n: 3, c: '#f97316' },
  medium: { n: 2, c: '#eab308' }, low: { n: 1, c: '#94a3b8' },
};

const PrioBars = ({ p }: { p: string }) => {
  const info = P[p];
  if (!info) return null;
  return (
    <svg width="14" height="12" viewBox="0 0 14 12">
      {[0,1,2,3].map(i => {
        const h = 4 + i * 2.5;
        return <rect key={i} x={i * 3.5} y={12 - h} width="2.5" height={h} rx="0.5" fill={i < info.n ? info.c : '#e2e8f0'}/>;
      })}
    </svg>
  );
};

const StatusDot = ({ status, color }: { status: TaskStatus; color: string }) => {
  if (status === 'done') return (
    <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill={color}/><path d="M4.5 7l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
  );
  if (status === 'in_progress') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1"/><path d="M7 1.5A5.5 5.5 0 0 1 7 12.5" fill={color}/></svg>
  );
  if (status === 'review') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1"/><path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" fill={color}/></svg>
  );
  if (status === 'todo') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1"/></svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2.5 2"/></svg>
  );
};

type OpenMenu = { kind: 'type' | 'assignee' | 'directions' | 'priority'; taskId: string; anchor: HTMLElement } | null;

type CardVisualProps = {
  task: Task;
  mem: TeamMember | null;
  tp: { label: string; color: string };
  color: string;
  dirs: { id: string; name: string; color: string | null }[];
  interactive?: boolean;
  directionsCount?: number;
  onOpenMenu?: (kind: 'type' | 'assignee' | 'directions' | 'priority', taskId: string, el: HTMLElement) => void;
  onOpenTask?: (taskId: string) => void;
};

/** Stop drag from starting when user clicks an interactive control. */
const stopDrag = (e: React.PointerEvent | React.MouseEvent) => {
  e.stopPropagation();
};

/* ── Card Content (shared between card and overlay) ── */
const CardContent = ({
  task, mem, tp, color, dirs, interactive, directionsCount, onOpenMenu,
}: CardVisualProps) => (
  <>
    <div className="bv-c-top">
      <span className="bv-c-key">{task.issueKey?.toUpperCase() || ''}</span>
      {interactive && onOpenMenu ? (
        <button
          type="button"
          className={`bv-c-av-btn${mem ? '' : ' bv-c-av-btn-empty'}`}
          onPointerDown={stopDrag}
          onClick={(e) => { e.stopPropagation(); onOpenMenu('assignee', task.id, e.currentTarget); }}
          title={mem ? `@${mem.username}` : 'Назначить'}
          aria-label={mem ? `Исполнитель: @${mem.username}. Изменить` : 'Назначить исполнителя'}
        >
          {mem ? mem.username[0].toUpperCase() : '?'}
        </button>
      ) : mem ? (
        <span className="bv-c-av" title={`@${mem.username}`}>{mem.username[0].toUpperCase()}</span>
      ) : null}
    </div>
    <p className="bv-c-title">
      <StatusDot status={task.status} color={color} />
      {task.title}
    </p>
    <div className="bv-c-bot">
      {interactive && onOpenMenu ? (
        <button
          type="button"
          className="bv-c-prio-btn"
          onPointerDown={stopDrag}
          onClick={(e) => { e.stopPropagation(); onOpenMenu('priority', task.id, e.currentTarget); }}
          title={`Приоритет: ${TASK_PRIORITY_CFG[task.priority].label}`}
          aria-label={`Приоритет: ${TASK_PRIORITY_CFG[task.priority].label}. Изменить`}
        >
          <PrioBars p={task.priority} />
        </button>
      ) : (
        <PrioBars p={task.priority} />
      )}
      {interactive && onOpenMenu ? (
        <button
          type="button"
          className="bv-c-label bv-c-label-btn"
          style={{ '--lc': tp.color } as React.CSSProperties}
          onPointerDown={stopDrag}
          onClick={(e) => { e.stopPropagation(); onOpenMenu('type', task.id, e.currentTarget); }}
          aria-label={`Тип: ${tp.label}. Изменить`}
        >{tp.label}</button>
      ) : (
        <span className="bv-c-label" style={{ '--lc': tp.color } as React.CSSProperties}>
          {tp.label}
        </span>
      )}
      {dirs.slice(0, 2).map((d) => {
        const dc = getDirectionColor(d.color, d.name);
        return (
          <span
            key={d.id}
            className="bv-c-label bv-c-label-dir"
            style={{ background: dc.bg, color: dc.fg, borderColor: 'transparent' }}
          >{d.name}</span>
        );
      })}
      {interactive && onOpenMenu && (directionsCount ?? 0) > 0 && (
        <button
          type="button"
          className="bv-c-dir-add"
          onPointerDown={stopDrag}
          onClick={(e) => { e.stopPropagation(); onOpenMenu('directions', task.id, e.currentTarget); }}
          title="Направления"
          aria-label="Направления"
        >+</button>
      )}
    </div>
  </>
);

/* ── Draggable Card ── */
const DraggableCard = (props: CardVisualProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });

  return (
    <div
      ref={setNodeRef}
      className={`bv-c ${isDragging ? 'bv-c-dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!props.onOpenTask) return;
        const target = e.target as HTMLElement;
        if (target.closest('button, select, input, .tmm, [data-no-open]')) return;
        props.onOpenTask(props.task.id);
      }}
    >
      <CardContent {...props} />
    </div>
  );
};

/* ── Droppable Column ── */
const DroppableColumn = ({
  status, label, color, tasks: ct, memberMap, directionMap,
  addCol, addVal, setAddCol, setAddVal, onCreateTask,
  directionsCount, onOpenMenu, onOpenTask,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  memberMap: Record<string, TeamMember>;
  directionMap: Record<string, DirectionTag>;
  addCol: string | null;
  addVal: string;
  setAddCol: (v: string | null) => void;
  setAddVal: (v: string) => void;
  onCreateTask: (t: string) => void;
  directionsCount: number;
  onOpenMenu: (kind: 'type' | 'assignee' | 'directions' | 'priority', taskId: string, el: HTMLElement) => void;
  onOpenTask?: (taskId: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`bv-col ${isOver ? 'bv-col-over' : ''}`}>
      <div className="bv-hd">
        <StatusDot status={status} color={color} />
        <span className="bv-hd-name">{label}</span>
        <span className="bv-hd-n">{ct.length}</span>
        <span className="bv-hd-spacer" />
        <button className="bv-hd-dots" title="Options">···</button>
        <button className="bv-hd-plus" onClick={() => { setAddCol(status); setAddVal(''); }} title="Add issue">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div ref={setNodeRef} className="bv-cards">
        {ct.map((task) => {
          const mem = task.assigneeUserId ? memberMap[task.assigneeUserId] : null;
          const tp = TASK_TYPE_CFG[task.taskType] || TASK_TYPE_CFG.task;
          const dirs = task.directionIds
            .map((id) => {
              const d = directionMap[id];
              return d ? { id: d.id, name: d.name, color: d.color } : null;
            })
            .filter((d): d is { id: string; name: string; color: string | null } => d !== null);
          return (
            <DraggableCard
              key={task.id}
              task={task}
              mem={mem}
              tp={tp}
              color={color}
              dirs={dirs}
              interactive
              directionsCount={directionsCount}
              onOpenMenu={onOpenMenu}
              onOpenTask={onOpenTask}
            />
          );
        })}

        {addCol === status ? (
          <div className="bv-c bv-c-add">
            <input
              className="bv-add-in"
              autoFocus
              placeholder="Issue title"
              value={addVal}
              onChange={(e) => setAddVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addVal.trim()) { onCreateTask(addVal.trim()); setAddVal(''); setAddCol(null); }
                if (e.key === 'Escape') { setAddCol(null); setAddVal(''); }
              }}
              onBlur={() => { if (!addVal.trim()) { setAddCol(null); setAddVal(''); } }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ── Main Component ── */
export const BoardView = ({
  tasks, members, directions = [],
  onStatusChange, onTaskTypeChange, onAssigneeChange, onDirectionsChange,
  onPriorityChange,
  onOpenTask,
  onCreateTask,
}: BoardViewProps) => {
  const [addCol, setAddCol] = useState<string | null>(null);
  const [addVal, setAddVal] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menu, setMenu] = useState<OpenMenu>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const directionMap = useMemo(
    () => Object.fromEntries(directions.map((d) => [d.id, d])),
    [directions],
  );

  const grouped = useMemo(
    () => COLUMNS.map((col) => ({ ...col, tasks: tasks.filter((t) => t.status === col.status) })),
    [tasks],
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !onStatusChange) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  const openMenu = (kind: 'type' | 'assignee' | 'directions' | 'priority', taskId: string, anchor: HTMLElement) => {
    setMenu({ kind, taskId, anchor });
  };
  const closeMenu = () => setMenu(null);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bv">
        {grouped.map(({ status, label, color, tasks: ct }) => (
          <DroppableColumn
            key={status}
            status={status}
            label={label}
            color={color}
            tasks={ct}
            memberMap={memberMap}
            directionMap={directionMap}
            addCol={addCol}
            addVal={addVal}
            setAddCol={setAddCol}
            setAddVal={setAddVal}
            onCreateTask={onCreateTask}
            directionsCount={directions.length}
            onOpenMenu={openMenu}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bv-c bv-c-overlay">
            <CardContent
              task={activeTask}
              mem={activeTask.assigneeUserId ? memberMap[activeTask.assigneeUserId] : null}
              tp={TASK_TYPE_CFG[activeTask.taskType] || TASK_TYPE_CFG.task}
              color={COLUMNS.find((c) => c.status === activeTask.status)?.color || '#94a3b8'}
              dirs={activeTask.directionIds
                .map((id) => {
                  const d = directionMap[id];
                  return d ? { id: d.id, name: d.name, color: d.color } : null;
                })
                .filter((d): d is { id: string; name: string; color: string | null } => d !== null)}
            />
          </div>
        ) : null}
      </DragOverlay>

      {menu && (() => {
        const task = tasks.find((t) => t.id === menu.taskId);
        if (!task) return null;
        if (menu.kind === 'type' && onTaskTypeChange) {
          const items: MetaMenuItem[] = ALL_TASK_TYPES.map((t) => ({
            value: t, label: TASK_TYPE_CFG[t].label, dot: TASK_TYPE_CFG[t].color,
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
            ...members.map((m) => ({ value: m.id, label: m.username, initial: m.username[0].toUpperCase() })),
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
        if (menu.kind === 'priority' && onPriorityChange) {
          const items: MetaMenuItem[] = ALL_TASK_PRIORITIES.map((p) => ({
            value: p, label: TASK_PRIORITY_CFG[p].label, dot: TASK_PRIORITY_CFG[p].color,
          }));
          return (
            <TaskMetaMenu
              anchor={menu.anchor}
              items={items}
              selected={[task.priority]}
              onSelect={(vals) => {
                const v = vals[0] as TaskPriority;
                if (v && v !== task.priority) onPriorityChange(task.id, v);
              }}
              onClose={closeMenu}
            />
          );
        }
        return null;
      })()}
    </DndContext>
  );
};
