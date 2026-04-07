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
          <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={handleLogout}>
            Выйти
          </button>
        </>
      }
    />
  );
};
