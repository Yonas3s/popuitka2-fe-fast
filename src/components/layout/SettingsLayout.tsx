import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { WorkspaceHeader } from './WorkspaceHeader';

type SettingsLayoutProps = {
  children: ReactNode;
};

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.66 7.66 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M21.9 4.4 18.5 20c-.3 1.2-1 1.5-2 .9l-5.4-4-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.4 9.8-8.8c.4-.4-.1-.6-.6-.2L4.7 12.1l-5.2-1.6c-1.1-.4-1.2-1.1.2-1.7L20.5 2.8c1-.3 1.7.2 1.4 1.6Z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Аккаунт',
    items: [
      { to: '/settings', label: 'Профиль', icon: <UserIcon />, end: true },
    ],
  },
  {
    title: 'Интеграции',
    items: [
      { to: '/settings/tokens', label: 'API токены', icon: <KeyIcon /> },
      { to: '/settings/github', label: 'GitHub', icon: <GitHubIcon /> },
      { to: '/settings/telegram', label: 'Telegram', icon: <TelegramIcon /> },
    ],
  },
];

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <div className="settings-layout-page">
      <WorkspaceHeader activeTab="settings" />

      <main className="settings-layout-main">
        <div className="settings-layout-grid-bg" />

        <div className="settings-layout-container">
          <aside className="settings-sidebar" aria-label="Настройки">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="settings-sidebar-group">
                <p className="settings-sidebar-title">{group.title}</p>
                <ul className="settings-sidebar-list">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `settings-sidebar-link ${isActive ? 'is-active' : ''}`
                        }
                      >
                        <span className="settings-sidebar-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>

          <section className="settings-layout-content">{children}</section>
        </div>
      </main>
    </div>
  );
};
