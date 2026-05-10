import { useEffect, useRef } from 'react';
import type { DirectionTag, TaskPriority, TaskType } from '../../types/models';
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
  taskTypeFilter?: 'all' | TaskType;
  onTaskTypeFilterChange?: (value: 'all' | TaskType) => void;
  directionFilter?: 'all' | string;
  onDirectionFilterChange?: (value: 'all' | string) => void;
  directions?: DirectionTag[];
  directionsLoading?: boolean;
  visibleCount?: number;
};

const COL_LABELS: { key: keyof VisibleColumns; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'labels', label: 'Labels' },
  { key: 'created', label: 'Created' },
];

const TASK_TYPE_OPTIONS: { value: 'all' | TaskType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'chore', label: 'Chore' },
];

export const ViewSettingsPanel = ({
  open, onClose,
  grouping, onGroupingChange,
  ordering, onOrderingChange,
  showEmptyGroups, onShowEmptyGroupsChange,
  visibleColumns, onVisibleColumnsChange,
  priorityFilter, onPriorityFilterChange,
  taskTypeFilter = 'all',
  onTaskTypeFilterChange,
  directionFilter = 'all',
  onDirectionFilterChange,
  directions = [],
  directionsLoading = false,
  visibleCount,
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

  const hasTaskFilters = Boolean(onTaskTypeFilterChange && onDirectionFilterChange);
  const activeTaskFilterCount = Number(taskTypeFilter !== 'all') + Number(directionFilter !== 'all');

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

      {hasTaskFilters && (
        <>
          <div className="vsp-divider" />

          <div className="vsp-section-label">
            <span>Filter by task</span>
            {activeTaskFilterCount > 0 && (
              <button
                type="button"
                className="vsp-section-clear"
                onClick={() => {
                  onTaskTypeFilterChange?.('all');
                  onDirectionFilterChange?.('all');
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="vsp-row">
            <span className="vsp-label">Type</span>
            <select
              className="vsp-select"
              value={taskTypeFilter}
              onChange={(event) => onTaskTypeFilterChange?.(event.target.value as 'all' | TaskType)}
            >
              {TASK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="vsp-row">
            <span className="vsp-label">Direction</span>
            <select
              className="vsp-select"
              value={directionFilter}
              disabled={directionsLoading || directions.length === 0}
              onChange={(event) => onDirectionFilterChange?.(event.target.value as 'all' | string)}
            >
              <option value="all">All directions</option>
              {directions.map((direction) => (
                <option key={direction.id} value={direction.id}>
                  {direction.name}
                </option>
              ))}
            </select>
          </div>

          {typeof visibleCount === 'number' ? (
            <div className="vsp-filter-footer">
              <span>Shown: {visibleCount}</span>
              {(priorityFilter.length > 0 || activeTaskFilterCount > 0) && (
                <button
                  type="button"
                  className="vsp-section-clear"
                  onClick={() => {
                    onPriorityFilterChange([]);
                    onTaskTypeFilterChange?.('all');
                    onDirectionFilterChange?.('all');
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          ) : null}
        </>
      )}

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
