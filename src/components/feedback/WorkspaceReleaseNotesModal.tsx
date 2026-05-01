import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  getWorkspaceReleaseStorageKey,
  WORKSPACE_RELEASE,
} from '../../lib/config/workspace-release';

const WORKSPACE_ROUTE_PREFIXES = ['/admin', '/projects', '/settings', '/teams'];

const isWorkspaceRoute = (pathname: string) =>
  WORKSPACE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const WorkspaceReleaseNotesModal = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const storageKey = useMemo(
    () => getWorkspaceReleaseStorageKey(WORKSPACE_RELEASE.id),
    [],
  );
  const shouldShowOnRoute = useMemo(
    () => isWorkspaceRoute(location.pathname),
    [location.pathname],
  );

  const closeModal = useCallback(() => {
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // localStorage may be unavailable in private contexts; fail closed.
    }
    setOpen(false);
  }, [storageKey]);

  useEffect(() => {
    if (!isAuthenticated || !shouldShowOnRoute) {
      setOpen(false);
      return;
    }

    try {
      const alreadySeen = localStorage.getItem(storageKey);
      setOpen(!alreadySeen);
    } catch {
      setOpen(true);
    }
  }, [isAuthenticated, shouldShowOnRoute, storageKey]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="projects-v3-modal-backdrop"
      role="presentation"
      onClick={closeModal}
    >
      <section
        className="projects-v3-modal workspace-release-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-release-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="projects-v3-modal-head workspace-release-head">
          <div>
            <p className="workspace-release-kicker">{WORKSPACE_RELEASE.badge}</p>
            <h2 id="workspace-release-title">{WORKSPACE_RELEASE.title}</h2>
          </div>

          <button
            type="button"
            className="projects-v3-modal-close"
            aria-label="Закрыть окно обновления"
            onClick={closeModal}
          >
            ✕
          </button>
        </header>

        <section className="projects-v3-create workspace-release-body">
          <p className="workspace-release-summary">{WORKSPACE_RELEASE.summary}</p>

          <div className="workspace-release-sections">
            {WORKSPACE_RELEASE.sections.map((section) => (
              <article key={section.title} className="workspace-release-section">
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="projects-v3-form-actions workspace-release-actions">
            <button
              type="button"
              className="ui-btn ui-btn-primary ui-btn-sm"
              onClick={closeModal}
            >
              Понятно
            </button>
          </div>
        </section>
      </section>
    </div>
  );
};
