import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { UnifiedHeader } from './UnifiedHeader';

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

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, loadMe, meLoaded, meLoading, user]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
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
          <Link
            to="/settings/telegram"
            className={`workspace-tg-badge ${user?.telegramUsername ? 'is-linked' : ''}`}
            title={user?.telegramUsername ? `Telegram: @${user.telegramUsername}` : 'Telegram не привязан'}
          >
            <span className="workspace-tg-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M21.9 4.4 18.5 20c-.3 1.2-1 1.5-2 .9l-5.4-4-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.4 9.8-8.8c.4-.4-.1-.6-.6-.2L4.7 12.1l-5.2-1.6c-1.1-.4-1.2-1.1.2-1.7L20.5 2.8c1-.3 1.7.2 1.4 1.6Z"/>
              </svg>
            </span>
            <span>{user?.telegramUsername ? 'Telegram' : 'Не привязан'}</span>
          </Link>
          <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={handleLogout}>
            Выйти
          </button>
        </>
      }
    />
  );
};
