import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useProjectsStore } from '../../store/projects.store';
import { useStageStore } from '../../store/stage.store';
import { WorkspaceReleaseNotesModal } from '../feedback/WorkspaceReleaseNotesModal';

type WorkspaceTab = 'teams' | 'projects' | 'settings';

type WorkspaceHeaderProps = {
  activeTab: WorkspaceTab;
};

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'unit-labs.workspace-sidebar-collapsed';

const AppIcon = ({ name }: { name: 'teams' | 'projects' | 'settings' | 'agent' | 'help' | 'tasks' }) => {
  switch (name) {
    case 'tasks':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h12M7 12h12M7 17h12" />
          <path d="m3.5 7 .8.8 1.7-2M3.5 12l.8.8 1.7-2M3.5 17l.8.8 1.7-2" />
        </svg>
      );
    case 'teams':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
          <circle cx="12" cy="9" r="3" />
          <path d="M4 18c.3-1.8 1.5-3 3-3.5M20 18c-.3-1.8-1.5-3-3-3.5" />
        </svg>
      );
    case 'projects':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
          <path d="M7 4v16M17 4v16" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h7M15 7h5M4 12h12M19 12h1M4 17h4M12 17h8" />
          <path d="M13 5v4M17 10v4M10 15v4" />
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
    case 'help':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9.2a2.4 2.4 0 1 1 3.5 2.1c-.8.5-1.3 1-1.3 2.2" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
};

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg className="workspace-app-collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
    {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
  </svg>
);

export const WorkspaceHeader = ({ activeTab }: WorkspaceHeaderProps) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const logout = useAuthStore((state) => state.logout);
  const currentProject = useProjectsStore((state) => state.currentProject);
  const currentStage = useStageStore((state) => state.currentStage);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  });

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

  useEffect(() => {
    document.documentElement.classList.toggle('workspace-sidebar-collapsed', isSidebarCollapsed);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));

    return () => {
      document.documentElement.classList.remove('workspace-sidebar-collapsed');
    };
  }, [isSidebarCollapsed]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/signin');
  };

  const emailToggleClassName = `header-email-toggle${isEmailRevealed ? '' : ' is-blurred'}`;
  const inProject = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
  const inTeam = location.pathname.startsWith('/teams/') && location.pathname !== '/teams';
  const projectIdFromPath = inProject ? location.pathname.split('/')[2] : '';
  const stageIdFromPath = inProject && location.pathname.includes('/stages/') ? location.pathname.split('/')[4] : '';
  const agentHref = projectIdFromPath ? `/projects/${projectIdFromPath}/agent` : '/projects';
  const projectRootHref = projectIdFromPath ? `/projects/${projectIdFromPath}` : '/projects';
  const projectSettingsHref = projectIdFromPath ? `/projects/${projectIdFromPath}/settings` : '/projects';
  const stageTasksHref = stageIdFromPath ? `/projects/${projectIdFromPath}/stages/${stageIdFromPath}/tasks` : '';
  const stageSettingsHref = stageIdFromPath ? `/projects/${projectIdFromPath}/stages/${stageIdFromPath}/settings` : '';
  const isAgentRoute = location.pathname.includes('/agent');
  const isProjectSettingsRoute = location.pathname === projectSettingsHref;
  const isStageRoute = Boolean(stageIdFromPath);
  const isStageSettingsRoute = Boolean(stageSettingsHref && location.pathname === stageSettingsHref);
  const resolvedProjectName =
    currentProject?.id === projectIdFromPath ? currentProject.projectName : 'Проект';
  const resolvedStageName =
    currentStage?.id === stageIdFromPath ? currentStage.stageName : 'Этап';
  const crumbRoot = (() => {
    if (isStageRoute) return resolvedProjectName;
    if (inProject) return 'Проекты';
    if (inTeam) return 'Команды';
    if (activeTab === 'settings') return 'Аккаунт';
    if (activeTab === 'teams') return 'Workspace';
    return 'Workspace';
  })();
  const crumbCurrent = (() => {
    if (isStageRoute) return resolvedStageName;
    if (isAgentRoute) return 'Агент';
    if (isProjectSettingsRoute) return 'Настройки проекта';
    if (inProject) return resolvedProjectName;
    if (location.pathname.startsWith('/settings/github')) return 'GitHub';
    if (location.pathname.startsWith('/settings/telegram')) return 'Telegram';
    if (location.pathname.startsWith('/settings/tokens')) return 'API tokens';
    if (activeTab === 'teams') return inTeam ? 'Команда' : 'Команды';
    if (activeTab === 'settings') return 'Настройки';
    return 'Проекты';
  })();

  return (
    <>
      <aside
        className={`workspace-app-sidebar${mobileOpen ? ' is-open' : ''}${isSidebarCollapsed ? ' is-collapsed' : ''}`}
        aria-label="Навигация workspace"
      >
        <div className="workspace-app-brand-row">
          <Link className="workspace-app-brand" to="/projects" aria-label="Unit Labs">
            <span className="workspace-app-brand-text">unit-labs</span>
            <span className="workspace-app-brand-cursor" aria-hidden="true">_</span>
          </Link>
          <button
            type="button"
            className="workspace-app-icon-btn workspace-app-sidebar-close"
            aria-label="Закрыть меню"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="workspace-app-nav-group">
          <p>Workspace</p>
          <nav className="workspace-app-nav" aria-label="Основная навигация">
            <Link className={`workspace-app-nav-item ${activeTab === 'projects' ? 'is-active' : ''}`} to="/projects">
              <AppIcon name="projects" />
              <span>Проекты</span>
            </Link>
            <Link className={`workspace-app-nav-item ${activeTab === 'teams' ? 'is-active' : ''}`} to="/teams">
              <AppIcon name="teams" />
              <span>Команды</span>
            </Link>
            <Link className={`workspace-app-nav-item ${activeTab === 'settings' ? 'is-active' : ''}`} to="/settings">
              <AppIcon name="settings" />
              <span>Настройки</span>
            </Link>
          </nav>
        </div>

        {inProject || inTeam ? (
          <div className="workspace-app-nav-group">
            <p>Контекст</p>
            <nav className="workspace-app-nav" aria-label="Контекст">
              {inProject ? (
                <>
                  {isStageRoute ? (
                    <>
                      <Link className={`workspace-app-nav-item ${!isStageSettingsRoute ? 'is-active' : ''}`} to={stageTasksHref}>
                        <AppIcon name="tasks" />
                        <span>Задачи этапа</span>
                      </Link>
                      <Link className={`workspace-app-nav-item ${isStageSettingsRoute ? 'is-active' : ''}`} to={stageSettingsHref}>
                        <AppIcon name="settings" />
                        <span>Настройки этапа</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        className={`workspace-app-nav-item ${!isProjectSettingsRoute && !isAgentRoute ? 'is-active' : ''}`}
                        to={projectRootHref}
                      >
                        <AppIcon name="tasks" />
                        <span>Этапы / задачи</span>
                      </Link>
                      <Link className={`workspace-app-nav-item ${isProjectSettingsRoute ? 'is-active' : ''}`} to={projectSettingsHref}>
                        <AppIcon name="settings" />
                        <span>Настройки проекта</span>
                      </Link>
                      <Link className={`workspace-app-nav-item ${isAgentRoute ? 'is-active' : ''}`} to={agentHref}>
                        <AppIcon name="agent" />
                        <span>Агент проекта</span>
                      </Link>
                    </>
                  )}
                </>
              ) : null}
              {inTeam ? (
                <Link className="workspace-app-nav-item is-active" to={location.pathname}>
                  <AppIcon name="teams" />
                  <span>Текущая команда</span>
                </Link>
              ) : null}
            </nav>
          </div>
        ) : null}

        <div className="workspace-app-sidebar-footer">
          <Link className="workspace-app-nav-item" to="/about">
            <AppIcon name="help" />
            <span>Помощь</span>
          </Link>
          <button
            type="button"
            className="workspace-app-nav-item workspace-app-collapse-btn"
            aria-label={isSidebarCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
            aria-pressed={isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          >
            <CollapseIcon collapsed={isSidebarCollapsed} />
            <span>{isSidebarCollapsed ? 'Развернуть' : 'Свернуть'}</span>
          </button>
        </div>
      </aside>

      {mobileOpen ? <div className="workspace-app-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" /> : null}

      <header className="workspace-app-topbar">
        <button
          type="button"
          className="workspace-app-icon-btn workspace-app-menu-btn"
          aria-label="Открыть меню"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          ☰
        </button>

        <div className="workspace-app-crumbs" aria-label="Текущий раздел">
          <span>{crumbRoot}</span>
          <span>/</span>
          <strong>{crumbCurrent}</strong>
        </div>

        <div className="workspace-app-topbar-actions">
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
          <button type="button" className="workspace-app-avatar" onClick={handleLogout} aria-label="Выйти">
            {(user?.username || 'U').slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <WorkspaceReleaseNotesModal />
    </>
  );
};
