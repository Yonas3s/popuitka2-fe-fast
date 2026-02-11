import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components/ui/GlassPanel';
import { PageShell } from '../components/layout/PageShell';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';

const OAUTH_CALLBACK_FLAG = 'oauth_callback_processed';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const pushToast = useUiStore((state) => state.pushToast);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      const wasProcessed = sessionStorage.getItem(OAUTH_CALLBACK_FLAG) === '1';

      if (wasProcessed) {
        sessionStorage.removeItem(OAUTH_CALLBACK_FLAG);
        navigate('/projects', { replace: true });
        return;
      }

      pushToast('Не удалось завершить вход через GitHub', 'error');
      navigate('/signin', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    setToken(token);
    sessionStorage.setItem(OAUTH_CALLBACK_FLAG, '1');

    // Remove token from browser history/address before navigating to a private page.
    window.history.replaceState({}, document.title, '/auth/callback');
    navigate('/projects', { replace: true });
  }, [navigate, pushToast, setToken]);

  return (
    <PageShell title="GitHub OAuth" subtitle="Завершаем авторизацию.">
      <GlassPanel className="auth-panel">
        <p className="muted">Входим...</p>
      </GlassPanel>
    </PageShell>
  );
};
