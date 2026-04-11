import { useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { useAuthStore } from '../store/auth.store';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date);
};

const providerLabel = (provider?: string): string => {
  const p = (provider || '').toLowerCase();
  if (p === 'github') return 'GitHub OAuth';
  if (p === 'local') return 'Email + пароль';
  return provider || '—';
};

export const ProfileSettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, user, meLoading, meLoaded, loadMe]);

  return (
    <SettingsLayout>
      <div className="settings-v1-toolbar">
        <div>
          <h1>Профиль</h1>
          <p>Основные данные аккаунта. Для изменений используйте CLI или API.</p>
        </div>
      </div>

      {meLoading && !user ? (
        <p className="settings-v1-loading">Загружаем профиль...</p>
      ) : null}

      {user ? (
        <section className="profile-card">
          <div className="profile-field">
            <span className="profile-field-label">Имя пользователя</span>
            <strong className="profile-field-value">{user.username || '—'}</strong>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            <strong className="profile-field-value">{user.email || '—'}</strong>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Метод входа</span>
            <strong className="profile-field-value">{providerLabel(user.authProvider)}</strong>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">ID</span>
            <code className="profile-field-code">{user.id}</code>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Аккаунт создан</span>
            <strong className="profile-field-value">{formatDate(user.createdAt)}</strong>
          </div>
        </section>
      ) : null}
    </SettingsLayout>
  );
};
