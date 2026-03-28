import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components/ui/GlassPanel';
import { PageShell } from '../components/layout/PageShell';
import {
  OAUTH_CALLBACK_REDIRECT_KEY,
  OAUTH_POST_LOGIN_REDIRECT_KEY,
  sanitizeRedirectPath,
} from '../lib/auth/redirect';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';

const OAUTH_CALLBACK_FLAG = 'oauth_callback_processed';
const DEFAULT_POST_LOGIN_PATH = '/projects';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const pushToast = useUiStore((state) => state.pushToast);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectFromOAuthStart = sanitizeRedirectPath(sessionStorage.getItem(OAUTH_POST_LOGIN_REDIRECT_KEY));
    const redirectFromCallbackState = sanitizeRedirectPath(sessionStorage.getItem(OAUTH_CALLBACK_REDIRECT_KEY));
    const redirectTarget = redirectFromOAuthStart || redirectFromCallbackState || DEFAULT_POST_LOGIN_PATH;

    if (!token) {
      const wasProcessed = sessionStorage.getItem(OAUTH_CALLBACK_FLAG) === '1';

      if (wasProcessed) {
        sessionStorage.removeItem(OAUTH_CALLBACK_FLAG);
        sessionStorage.removeItem(OAUTH_CALLBACK_REDIRECT_KEY);
        sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
        navigate(redirectTarget, { replace: true });
        return;
      }

      pushToast('Не удалось завершить вход через GitHub', 'error');
      sessionStorage.removeItem(OAUTH_CALLBACK_REDIRECT_KEY);
      sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
      navigate('/signin', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    setToken(token);
    sessionStorage.setItem(OAUTH_CALLBACK_FLAG, '1');
    sessionStorage.setItem(OAUTH_CALLBACK_REDIRECT_KEY, redirectTarget);
    sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);

    // Убираем токен из истории и адресной строки до перехода в приватный раздел.
    window.history.replaceState({}, document.title, '/auth/callback');
    navigate(redirectTarget, { replace: true });
  }, [navigate, pushToast, setToken]);

  return (
    <PageShell title="Вход через GitHub" subtitle="Завершаем вход.">
      <GlassPanel className="auth-panel">
        <p className="muted">Входим...</p>
      </GlassPanel>
    </PageShell>
  );
};
