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

const TYPE_CFG: Record<TaskType, { label: string; color: string }> = {
  feature: { label: 'Feature', color: '#ec4899' },
  bug: { label: 'Bug', color: '#ef4444' },
  task: { label: 'Task', color: '#6b7280' },
  improvement: { label: 'Improvement', color: '#06b6d4' },
  chore: { label: 'Chore', color: '#a3a3a3' },
};

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

/* ── Draggable Card ── */
const DraggableCard = ({ task, mem, tp, color }: {
  task: Task;
  mem: TeamMember | null;
  tp: { label: string; color: string };
  color: string;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      className={`bv-c ${isDragging ? 'bv-c-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <CardContent task={task} mem={mem} tp={tp} color={color} />
    </div>
  );
};

/* ── Card Content (shared between card and overlay) ── */
const CardContent = ({ task, mem, tp, color }: {
  task: Task;
  mem: TeamMember | null;
  tp: { label: string; color: string };
  color: string;
}) => (
  <>
    <div className="bv-c-top">
      <span className="bv-c-key">{task.issueKey?.toUpperCase() || ''}</span>
      {mem ? (
        <span className="bv-c-av" title={`@${mem.username}`}>
          {mem.username[0].toUpperCase()}
        </span>
      ) : null}
    </div>
    <p className="bv-c-title">
      <StatusDot status={task.status} color={color} />
      {task.title}
    </p>
    <div className="bv-c-bot">
      <PrioBars p={task.priority} />
      <span className="bv-c-label" style={{ '--lc': tp.color } as React.CSSProperties}>
        {tp.label}
      </span>
    </div>
  </>
);

/* ── Droppable Column ── */
const DroppableColumn = ({ status, label, color, tasks: ct, memberMap, addCol, addVal, setAddCol, setAddVal, onCreateTask }: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  memberMap: Record<string, TeamMember>;
  addCol: string | null;
  addVal: string;
  setAddCol: (v: string | null) => void;
  setAddVal: (v: string) => void;
  onCreateTask: (t: string) => void;
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
          const tp = TYPE_CFG[task.taskType] || TYPE_CFG.task;
          return <DraggableCard key={task.id} task={task} mem={mem} tp={tp} color={color} />;
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
export const BoardView = ({ tasks, members, onStatusChange, onCreateTask }: BoardViewProps) => {
  const [addCol, setAddCol] = useState<string | null>(null);
  const [addVal, setAddVal] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
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
            addCol={addCol}
            addVal={addVal}
            setAddCol={setAddCol}
            setAddVal={setAddVal}
            onCreateTask={onCreateTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="bv-c bv-c-overlay">
            <CardContent
              task={activeTask}
              mem={activeTask.assigneeUserId ? memberMap[activeTask.assigneeUserId] : null}
              tp={TYPE_CFG[activeTask.taskType] || TYPE_CFG.task}
              color={COLUMNS.find((c) => c.status === activeTask.status)?.color || '#94a3b8'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
