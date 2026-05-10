export type SectionRailIconName =
  | 'activity'
  | 'agent'
  | 'settings'
  | 'stages'
  | 'tasks';

export type SectionRailItem = {
  id: string;
  label: string;
  helper: string;
  icon: SectionRailIconName;
  action?: 'page' | 'route';
  to?: string;
};

type SectionRailProps<T extends SectionRailItem = SectionRailItem> = {
  activeId: string;
  ariaLabel: string;
  items: T[];
  mobileOpen: boolean;
  sheetTitle: string;
  sheetSubtitle: string;
  onCloseMobile: () => void;
  onSelect: (item: T) => void;
};

const SectionRailIcon = ({ name }: { name: SectionRailIconName }) => {
  switch (name) {
    case 'activity':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 17h3l2-9 4 12 3-7h4" />
        </svg>
      );
    case 'agent':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v3" />
          <rect x="5" y="7" width="14" height="12" rx="4" />
          <path d="M9 12h.01M15 12h.01M10 16h4" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h7M15 7h5M4 12h12M19 12h1M4 17h4M12 17h8" />
          <path d="M13 5v4M17 10v4M10 15v4" />
        </svg>
      );
    case 'stages':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14M5 12h14M5 18h14" />
          <path d="M8 4v16M16 4v16" />
        </svg>
      );
    case 'tasks':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h12M7 12h12M7 17h12" />
          <path d="m3.5 7 .8.8 1.7-2M3.5 12l.8.8 1.7-2M3.5 17l.8.8 1.7-2" />
        </svg>
      );
  }
};

export const SectionRail = <T extends SectionRailItem>({
  activeId,
  ariaLabel,
  items,
  mobileOpen,
  sheetTitle,
  sheetSubtitle,
  onCloseMobile,
  onSelect,
}: SectionRailProps<T>) => (
  <>
    <aside className="project-section-rail" aria-label={ariaLabel}>
      <nav className="project-section-rail-inner">
        {items.map((item) => (
          <button
            key={item.id}
            className={`project-section-rail-button ${activeId === item.id ? 'is-active' : ''}`}
            type="button"
            title={item.label}
            onClick={() => onSelect(item)}
          >
            <span className="project-section-rail-icon">
              <SectionRailIcon name={item.icon} />
            </span>
            <span className="project-section-rail-copy">
              <strong>{item.label}</strong>
              <small>{item.helper}</small>
            </span>
          </button>
        ))}
      </nav>
    </aside>

    {mobileOpen ? (
      <div className="project-section-sheet-backdrop" role="presentation" onClick={onCloseMobile}>
        <div
          className="project-section-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="project-section-sheet-head">
            <div>
              <strong>{sheetTitle}</strong>
              <span>{sheetSubtitle}</span>
            </div>
            <button type="button" onClick={onCloseMobile} aria-label="Закрыть меню разделов">
              ×
            </button>
          </div>

          <div className="project-section-sheet-list">
            {items.map((item) => (
              <button
                key={item.id}
                className={`project-section-sheet-action ${activeId === item.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => onSelect(item)}
              >
                <span className="project-section-rail-icon">
                  <SectionRailIcon name={item.icon} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.helper}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ) : null}
  </>
);
