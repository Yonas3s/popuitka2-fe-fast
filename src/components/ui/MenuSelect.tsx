import { useEffect, useMemo, useRef, useState } from 'react';

export type MenuSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type MenuSelectProps = {
  label: string;
  value: string;
  options: MenuSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const MenuSelect = ({ label, value, options, onChange, disabled }: MenuSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => {
    return options.find((option) => option.value === value) ?? options[0];
  }, [options, value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="menu-select" ref={rootRef}>
        <button
          type="button"
          className="menu-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
            }
          }}
        >
          <span className="menu-select-value">{selected?.label || 'Выбрать'}</span>
          <span className={`menu-select-chevron ${open ? 'open' : ''}`}>⌄</span>
        </button>

        {open ? (
          <div className="menu-select-panel" role="listbox" aria-label={label}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`menu-select-option ${active ? 'active' : ''}`}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="menu-select-option-label">{option.label}</span>
                  {option.description ? <span className="menu-select-option-description">{option.description}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
};
