import { useEffect, useRef } from 'react';

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
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  grouping: Grouping;
  onGroupingChange: (g: Grouping) => void;
  ordering: Ordering;
  onOrderingChange: (o: Ordering) => void;
  showEmptyGroups: boolean;
  onShowEmptyGroupsChange: (v: boolean) => void;
  visibleColumns: VisibleColumns;
  onVisibleColumnsChange: (cols: VisibleColumns) => void;
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
  viewMode, onViewModeChange,
  grouping, onGroupingChange,
  ordering, onOrderingChange,
  showEmptyGroups, onShowEmptyGroupsChange,
  visibleColumns, onVisibleColumnsChange,
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

  return (
    <div className="vsp" ref={ref}>
      {/* View mode toggle */}
      <div className="vsp-mode">
        <button className={`vsp-mode-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => onViewModeChange('list')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3.5h10M2 7h10M2 10.5h10" strokeLinecap="round"/>
          </svg>
          List
        </button>
        <button className={`vsp-mode-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => onViewModeChange('board')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="2" width="3.5" height="10" rx="1"/>
            <rect x="5.25" y="2" width="3.5" height="7" rx="1"/>
            <rect x="9.5" y="2" width="3.5" height="10" rx="1"/>
          </svg>
          Board
        </button>
      </div>

      <div className="vsp-divider" />

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
