import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE } from '../../lib/config/env';
import { useAuthStore } from '../../store/auth.store';

type PageShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export const PageShell = ({ children, title, subtitle }: PageShellProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  return (
    <>
      <div className="grid" />
      <main className="wrap page-shell">
        <header className="topbar fade-up">
          <Link to="/" className="brand">
            {APP_TITLE}
          </Link>

          <nav className="topnav">
            {isAuthenticated ? (
              <>
                <Link to="/projects" className="ghost-link">
                  Проекты
                </Link>
                <button
                  className="ghost-link"
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.assign('/signin');
                  }}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="ghost-link">
                  Вход
                </Link>
                <Link to="/signup" className="ghost-link">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </header>

        {(title || subtitle) && (
          <section className="page-hero fade-up delay-1">
            {title ? <h1 className="page-title">{title}</h1> : null}
            {subtitle ? <p className="lead">{subtitle}</p> : null}
          </section>
        )}

        <section className="fade-up delay-2 page-content">{children}</section>
      </main>
    </>
  );
};
