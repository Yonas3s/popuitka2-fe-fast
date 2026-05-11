import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UnifiedHeader } from './UnifiedHeader';
import { WorkspaceReleaseNotesModal } from '../feedback/WorkspaceReleaseNotesModal';

type WorkspaceTab = 'teams' | 'projects' | 'settings';

type WorkspaceHeaderProps = {
  activeTab: WorkspaceTab;
};

export const WorkspaceHeader = ({ activeTab }: WorkspaceHeaderProps) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, loadMe, meLoaded, meLoading, user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/signin');
  };

  const emailToggleClassName = `header-email-toggle${isEmailRevealed ? '' : ' is-blurred'}`;

  return (
    <>
      <UnifiedHeader
        className="projects-v3-header"
        containerClassName="projects-v3-container projects-v3-header-row"
        leftClassName="projects-v3-header-left"
        brandClassName="projects-v3-brand"
        brandContent={
          <>
            unit-labs
            <span>_</span>
          </>
        }
        leftContent={
          <nav className="projects-v3-nav" aria-label="Основная навигация">
            <Link className={activeTab === 'teams' ? 'is-active' : ''} to="/teams">
              Команды
            </Link>
            <Link className={activeTab === 'projects' ? 'is-active' : ''} to="/projects">
              Проекты
            </Link>
            <Link className={activeTab === 'settings' ? 'is-active' : ''} to="/settings">
              Настройки
            </Link>
          </nav>
        }
        rightClassName="projects-v3-header-right workspace-header-right"
        rightContent={
          <>
            <div className="workspace-user-block" aria-label="Текущий пользователь">
              <strong>{user?.username || 'Пользователь'}</strong>
              {meLoading ? (
                <span>Загрузка...</span>
              ) : user?.email ? (
                <button
                  type="button"
                  className={emailToggleClassName}
                  onClick={() => setIsEmailRevealed(true)}
                  aria-label="Показать почту"
                >
                  {user.email}
                </button>
              ) : null}
            </div>
            <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm workspace-logout-desktop" onClick={handleLogout}>
              Выйти
            </button>
            <button
              type="button"
              className="workspace-burger"
              aria-label="Меню"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span aria-hidden="true">{mobileOpen ? '✕' : '☰'}</span>
            </button>
          </>
        }
      />

      {mobileOpen ? (
        <div
          className="workspace-mobile-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <nav className="workspace-mobile-menu" aria-label="Основная навигация">
            <div className="workspace-mobile-user">
              <strong>{user?.username || 'Пользователь'}</strong>
              {user?.email ? (
                <button
                  type="button"
                  className={emailToggleClassName}
                  onClick={() => setIsEmailRevealed(true)}
                  aria-label="Показать почту"
                >
                  {user.email}
                </button>
              ) : null}
            </div>

            <div className="workspace-mobile-links">
              <Link
                to="/teams"
                className={activeTab === 'teams' ? 'is-active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                Команды
              </Link>
              <Link
                to="/projects"
                className={activeTab === 'projects' ? 'is-active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                Проекты
              </Link>
              <Link
                to="/settings"
                className={activeTab === 'settings' ? 'is-active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                Настройки
              </Link>
            </div>

            <div className="workspace-mobile-actions">
              <button type="button" className="ui-btn ui-btn-ghost" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </nav>
        </div>
      ) : null}

      <WorkspaceReleaseNotesModal />
    </>
  );
};
