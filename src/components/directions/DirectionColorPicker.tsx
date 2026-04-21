import { useEffect, useRef, useState } from 'react';
import {
  DIRECTION_PALETTE,
  getDirectionColor,
  getDirectionColorKey,
} from '../../lib/directions/color';

type Props = {
  directionId: string;
  name: string;
  color: string | null;
  onPickColor: (paletteKey: string) => void | Promise<void>;
};

/**
 * Chip that renders a direction with its current color and opens a palette
 * popover on click. Change is delegated to the parent via onPickColor so the
 * parent can PATCH the backend and refresh the directions list.
 */
export function DirectionColorPicker({ directionId, name, color, onPickColor }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dc = getDirectionColor(color, name);
  const currentKey = getDirectionColorKey(color, name);

  return (
    <span className="dcp-wrap" ref={wrapRef} data-direction-id={directionId}>
      <button
        type="button"
        className="flat-directions-chip dcp-chip"
        style={{ background: dc.bg, color: dc.fg, borderColor: 'transparent' }}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Цвет направления ${name}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {name}
      </button>
      {open && (
        <div className="dcp-pop" role="dialog" aria-label="Выбор цвета">
          {DIRECTION_PALETTE.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`dcp-sw${p.key === currentKey ? ' dcp-sw-active' : ''}`}
              style={{ background: p.bg, color: p.fg }}
              onClick={() => {
                setOpen(false);
                void onPickColor(p.key);
              }}
              title={p.label}
              aria-label={p.label}
            >
              Aa
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
