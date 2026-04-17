import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TaskType } from '../../types/models';

/**
 * Shared config for task types — single source of truth for label/color.
 * Used by GroupedTaskList and BoardView.
 */
export const TASK_TYPE_CFG: Record<TaskType, { label: string; color: string }> = {
  feature:     { label: 'Feature',     color: '#ec4899' },
  bug:         { label: 'Bug',         color: '#ef4444' },
  task:        { label: 'Task',        color: '#6b7280' },
  improvement: { label: 'Improvement', color: '#06b6d4' },
  chore:       { label: 'Chore',       color: '#a3a3a3' },
};

export const ALL_TASK_TYPES: TaskType[] = ['feature', 'bug', 'task', 'improvement', 'chore'];

export type MetaMenuItem = {
  value: string;
  label: string;
  /** HEX color for the leading dot. */
  dot?: string;
  /** Optional single-character "avatar" fallback (first letter of username, etc.) */
  initial?: string;
  /** Optional secondary text rendered after the label in muted tone. */
  hint?: string;
};

type TaskMetaMenuProps = {
  anchor: HTMLElement;
  items: MetaMenuItem[];
  selected: string[];
  multi?: boolean;
  searchable?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  onSelect: (next: string[]) => void;
  onClose: () => void;
};

/**
 * Linear-style popover for changing task type / assignee / directions.
 * Positions itself below the anchor, closes on outside click and Escape.
 * For `multi: false` — picks one value and closes.
 * For `multi: true` — toggles values and stays open (user closes by clicking outside).
 */
export const TaskMetaMenu = ({
  anchor, items, selected, multi, searchable, placeholder = 'Поиск…',
  emptyLabel = 'Ничего не найдено',
  onSelect, onClose,
}: TaskMetaMenuProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });

  // Position below the anchor (clamped to viewport).
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const panelWidth = 240;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.left;
    if (left + panelWidth > vw - 8) left = Math.max(8, vw - panelWidth - 8);
    let top = r.bottom + 4;
    // If it would overflow bottom, render above the anchor instead.
    const estimatedHeight = 260;
    if (top + estimatedHeight > vh - 8 && r.top > estimatedHeight) {
      top = r.top - 4 - estimatedHeight;
    }
    setPos({ top, left, width: panelWidth });
  }, [anchor]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !anchor.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    if (searchable) inputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose, searchable]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      it.label.toLowerCase().includes(q) ||
      (it.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [items, query]);

  const toggle = (value: string) => {
    if (multi) {
      const set = new Set(selected);
      if (set.has(value)) set.delete(value); else set.add(value);
      onSelect(Array.from(set));
    } else {
      onSelect([value]);
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className="tmm"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
      role="listbox"
      aria-multiselectable={multi || undefined}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {searchable && (
        <div className="tmm-search">
          <input
            ref={inputRef}
            className="tmm-input"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}
      <div className="tmm-list">
        {filtered.length === 0 && <div className="tmm-empty">{emptyLabel}</div>}
        {filtered.map(item => {
          const isSel = selected.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              className={`tmm-item${isSel ? ' is-sel' : ''}`}
              onClick={() => toggle(item.value)}
              role="option"
              aria-selected={isSel}
            >
              {item.dot !== undefined && (
                <span className="tmm-dot" style={{ background: item.dot }} />
              )}
              {item.initial !== undefined && (
                <span className="tmm-init">{item.initial}</span>
              )}
              <span className="tmm-lab">{item.label}</span>
              {item.hint && <span className="tmm-hint">{item.hint}</span>}
              {isSel && (
                <svg className="tmm-ok" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
