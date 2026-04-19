import { useEffect, useRef } from 'react';
import type { TaskPriority } from '../../types/models';
import { ALL_TASK_PRIORITIES, TASK_PRIORITY_CFG } from './TaskMetaMenu';

export type ViewMode = 'list' | 'board';
export type Grouping = 'status' | 'priority' | 'none';
export type Ordering = 'priority' | 'created' | 'manual';

export type VisibleColumns = {
  id: boolean;
  status: boolean;
  assignee: boolean;
  priority: boolean;
  labels: boolean;
  created: boolean;
};

type ViewSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  grouping: Grouping;
  onGroupingChange: (g: Grouping) => void;
  ordering: Ordering;
  onOrderingChange: (o: Ordering) => void;
  showEmptyGroups: boolean;
  onShowEmptyGroupsChange: (v: boolean) => void;
  visibleColumns: VisibleColumns;
  onVisibleColumnsChange: (cols: VisibleColumns) => void;
  priorityFilter: TaskPriority[];
  onPriorityFilterChange: (next: TaskPriority[]) => void;
};

const COL_LABELS: { key: keyof VisibleColumns; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'labels', label: 'Labels' },
  { key: 'created', label: 'Created' },
];

export const ViewSettingsPanel = ({
  open, onClose,
  grouping, onGroupingChange,
  ordering, onOrderingChange,
  showEmptyGroups, onShowEmptyGroupsChange,
  visibleColumns, onVisibleColumnsChange,
  priorityFilter, onPriorityFilterChange,
}: ViewSettingsPanelProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const toggleCol = (key: keyof VisibleColumns) => {
    onVisibleColumnsChange({ ...visibleColumns, [key]: !visibleColumns[key] });
  };

  const togglePriority = (p: TaskPriority) => {
    const set = new Set(priorityFilter);
    if (set.has(p)) set.delete(p); else set.add(p);
    onPriorityFilterChange(Array.from(set));
  };

  return (
    <div className="vsp" ref={ref}>
      {/* Grouping */}
      <div className="vsp-row">
        <span className="vsp-label">Grouping</span>
        <select className="vsp-select" value={grouping} onChange={(e) => onGroupingChange(e.target.value as Grouping)}>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
          <option value="none">No grouping</option>
        </select>
      </div>

      {/* Ordering */}
      <div className="vsp-row">
        <span className="vsp-label">Ordering</span>
        <select className="vsp-select" value={ordering} onChange={(e) => onOrderingChange(e.target.value as Ordering)}>
          <option value="priority">Priority</option>
          <option value="created">Created</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Show empty groups */}
      <div className="vsp-row">
        <span className="vsp-label">Show empty groups</span>
        <button
          className={`vsp-toggle ${showEmptyGroups ? 'active' : ''}`}
          onClick={() => onShowEmptyGroupsChange(!showEmptyGroups)}
          aria-pressed={showEmptyGroups}
        >
          <span className="vsp-toggle-thumb" />
        </button>
      </div>

      <div className="vsp-divider" />

      {/* Filter: priority */}
      <div className="vsp-section-label">
        <span>Filter by priority</span>
        {priorityFilter.length > 0 && (
          <button
            type="button"
            className="vsp-section-clear"
            onClick={() => onPriorityFilterChange([])}
          >
            Clear
          </button>
        )}
      </div>
      <div className="vsp-cols">
        {ALL_TASK_PRIORITIES.map((p) => {
          const active = priorityFilter.includes(p);
          return (
            <button
              key={p}
              type="button"
              className={`vsp-col-chip vsp-col-chip-dot ${active ? 'active' : ''}`}
              onClick={() => togglePriority(p)}
              aria-pressed={active}
            >
              <span className="vsp-chip-dot" style={{ background: TASK_PRIORITY_CFG[p].color }} />
              {TASK_PRIORITY_CFG[p].label}
            </button>
          );
        })}
      </div>

      <div className="vsp-divider" />

      {/* Display properties */}
      <div className="vsp-section-label">Display properties</div>
      <div className="vsp-cols">
        {COL_LABELS.map(({ key, label }) => (
          <button
            key={key}
            className={`vsp-col-chip ${visibleColumns[key] ? 'active' : ''}`}
            onClick={() => toggleCol(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
