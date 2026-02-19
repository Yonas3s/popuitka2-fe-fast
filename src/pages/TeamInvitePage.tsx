import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { ErrorState } from '../components/feedback/ErrorState';
import { apiService } from '../lib/api/service';
import { withRedirectQuery } from '../lib/auth/redirect';
import { normalizeApiError } from '../lib/api/errors';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import type { ApiError, TeamInvitePreview } from '../types/models';

export const TeamInvitePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams<{ token?: string }>();
  const pushToast = useUiStore((state) => state.pushToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const returnPath = `${location.pathname}${location.search}`;
  const token = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryToken = queryParams.get('token')?.trim() || '';
    const pathToken = routeParams.token?.trim() || '';
    return queryToken || pathToken;
  }, [location.search, routeParams.token]);

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [invite, setInvite] = useState<TeamInvitePreview | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    navigate(withRedirectQuery('/signin', returnPath), { replace: true });
  }, [isAuthenticated, navigate, returnPath]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!token) {
      setLoading(false);
      setError({ message: 'Токен приглашения не найден в ссылке' });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiService
      .getTeamInvite(token)
      .then((response) => {
        if (!cancelled) {
          setInvite(response);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(normalizeApiError(reason));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const onAccept = async () => {
    if (!token) {
      return;
    }

    setAccepting(true);
    try {
      await apiService.acceptTeamInvite(token);
      setAccepted(true);
      pushToast('Приглашение принято', 'success');
      navigate('/teams', { replace: true });
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      setError(normalized);
      pushToast(normalized.message, 'error');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <PageShell title="Приглашение в команду" subtitle="Подтвердите вступление в команду по ссылке из письма.">
      {!isAuthenticated ? (
        <GlassPanel className="auth-panel">
          <p className="lead">Перенаправляем на вход...</p>
        </GlassPanel>
      ) : null}

      {isAuthenticated && loading ? (
        <GlassPanel className="auth-panel">
          <p className="lead">Проверяем приглашение...</p>
        </GlassPanel>
      ) : null}

      {isAuthenticated && !loading && error ? (
        <ErrorState title="Приглашение недоступно" message={error.message} />
      ) : null}

      {isAuthenticated && !loading && !error && invite ? (
        <GlassPanel className="auth-panel team-invite-panel">
          <p className="team-invite-kicker">unit-labs team</p>
          <h2>Тебя пригласили в команду «{invite.teamName}»</h2>
          <p className="muted">
            {invite.inviterName ? `${invite.inviterName} отправил(а) тебе приглашение.` : 'Тебе отправили приглашение в команду.'}
          </p>
          {invite.email ? <p className="muted">Email приглашения: {invite.email}</p> : null}
          {invite.expiresAt ? (
            <p className="muted">
              Действует до:{' '}
              {new Date(invite.expiresAt).toLocaleString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          ) : null}

          <div className="actions-row">
            <GradientButton type="button" disabled={accepting || accepted} onClick={() => void onAccept()}>
              {accepted ? 'Приглашение принято' : accepting ? 'Подтверждаем...' : 'Принять приглашение'}
            </GradientButton>
            <Link className="ghost-link" to="/signin">
              Войти в аккаунт
            </Link>
            <Link className="ghost-link" to="/teams">
              Открыть команды
            </Link>
          </div>
        </GlassPanel>
      ) : null}
    </PageShell>
  );
};
