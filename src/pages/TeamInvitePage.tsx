import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { WorkspaceFooter } from '../components/layout/WorkspaceFooter';
import { apiService } from '../lib/api/service';
import { withRedirectQuery } from '../lib/auth/redirect';
import { normalizeApiError } from '../lib/api/errors';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import type { ApiError, TeamInvitePreview } from '../types/models';

const formatInviteExpiresAt = (value?: string): string => {
  if (!value) {
    return 'Не ограничено';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Не ограничено';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
    <div className="team-invite-v2-page">
      <WorkspaceHeader activeTab="teams" />

      <main className="projects-v3-main team-invite-v2-main">
        <div className="projects-v3-grid-bg" />
        <span className="projects-v3-marker projects-v3-marker-top-left" />
        <span className="projects-v3-marker projects-v3-marker-top-right" />
        <span className="projects-v3-marker projects-v3-marker-bottom-left" />
        <span className="projects-v3-marker projects-v3-marker-bottom-right" />

        <div className="projects-v3-container team-invite-v2-content">
          <section className="team-invite-v2-card">
            <p className="team-invite-v2-kicker">unit-labs invite</p>
            <h1>Приглашение в команду</h1>

            {!isAuthenticated ? <p className="team-invite-v2-muted">Перенаправляем на вход...</p> : null}
            {isAuthenticated && loading ? <p className="team-invite-v2-muted">Проверяем приглашение...</p> : null}
            {isAuthenticated && !loading && error ? <p className="team-invite-v2-error">{error.message}</p> : null}

            {isAuthenticated && !loading && !error && invite ? (
              <>
                <h2>Команда «{invite.teamName}»</h2>
                <p className="team-invite-v2-description">
                  {invite.inviterName
                    ? `${invite.inviterName} приглашает тебя присоединиться к команде.`
                    : 'Тебя пригласили присоединиться к команде.'}
                </p>

                <dl className="team-invite-v2-meta-grid">
                  <div>
                    <dt>Email приглашения</dt>
                    <dd>{invite.email || '—'}</dd>
                  </div>
                  <div>
                    <dt>Действует до</dt>
                    <dd>{formatInviteExpiresAt(invite.expiresAt)}</dd>
                  </div>
                </dl>

                <div className="team-invite-v2-actions">
                  <button
                    type="button"
                    className="team-invite-v2-accept-btn"
                    disabled={accepting || accepted}
                    onClick={() => {
                      void onAccept();
                    }}
                  >
                    {accepted ? 'Приглашение принято' : accepting ? 'Подтверждаем...' : 'Принять приглашение'}
                  </button>
                  <Link className="team-invite-v2-secondary-btn" to="/signin">
                    Войти в аккаунт
                  </Link>
                  <Link className="team-invite-v2-secondary-btn" to="/teams">
                    Открыть команды
                  </Link>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>

      <WorkspaceFooter />
    </div>
  );
};
