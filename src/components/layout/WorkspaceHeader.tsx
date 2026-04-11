import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { apiService } from '../../lib/api/service';
import { UnifiedHeader } from './UnifiedHeader';

type WorkspaceTab = 'teams' | 'projects' | 'settings';

type WorkspaceHeaderProps = {
  activeTab: WorkspaceTab;
};

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M21.9 4.4 18.5 20c-.3 1.2-1 1.5-2 .9l-5.4-4-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.4 9.8-8.8c.4-.4-.1-.6-.6-.2L4.7 12.1l-5.2-1.6c-1.1-.4-1.2-1.1.2-1.7L20.5 2.8c1-.3 1.7.2 1.4 1.6Z" />
  </svg>
);

export const WorkspaceHeader = ({ activeTab }: WorkspaceHeaderProps) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, loadMe, meLoaded, meLoading, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTgLinked(null);
      setTgUsername(null);
      return;
    }

    let cancelled = false;
    apiService
      .getMeTelegram()
      .then((data) => {
        if (cancelled) return;
        setTgLinked(data.linked);
        setTgUsername(data.telegramUsername);
      })
      .catch(() => {
        if (cancelled) return;
        setTgLinked(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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

  const tgBadge = (
    <Link
      to="/settings/telegram"
      className={`workspace-tg-badge ${tgLinked ? 'is-linked' : ''}`}
      title={tgLinked ? `Telegram: @${tgUsername || ''}` : 'Telegram не привязан'}
      onClick={() => setMobileOpen(false)}
    >
      <span className="workspace-tg-icon" aria-hidden="true"><TelegramIcon /></span>
      <span>
        {tgLinked === null ? 'Telegram' : tgLinked ? (tgUsername ? `@${tgUsername}` : 'Telegram') : 'Не привязан'}
      </span>
    </Link>
  );

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
              <span>{meLoading ? 'Загрузка...' : (user?.email || '')}</span>
            </div>
            {tgBadge}
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
              <span>{user?.email || ''}</span>
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
              {tgBadge}
              <button type="button" className="ui-btn ui-btn-ghost" onClick={handleLogout}>
                Выйти
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
};
