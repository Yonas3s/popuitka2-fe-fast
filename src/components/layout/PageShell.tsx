import { useEffect, useMemo, type ReactNode } from 'react';
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
  const user = useAuthStore((state) => state.user);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, loadMe, meLoaded, meLoading, user]);

  const providerLabel = useMemo(() => {
    const provider = user?.authProvider?.toLowerCase();
    if (provider === 'github') {
      return 'GitHub';
    }
    return 'Local';
  }, [user?.authProvider]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) {
      return '';
    }

    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [user?.createdAt]);

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
                <div className="account-pill" aria-label="Текущий аккаунт">
                  <span className="account-dot" />
                  <div className="account-meta">
                    <strong>@{user?.username || 'account'}</strong>
                    <span>
                      {meLoading
                        ? 'Загружаем профиль...'
                        : user?.email || 'Профиль временно недоступен'}
                    </span>
                  </div>
                  <span className="account-provider">
                    {providerLabel}
                    {memberSince ? ` • ${memberSince}` : ''}
                  </span>
                </div>

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
