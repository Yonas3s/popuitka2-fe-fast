import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { ErrorState } from '../components/feedback/ErrorState';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { AdminActionAuthType, AdminActionLog, AdminActionSource, AdminStat, ApiError } from '../types/models';

type Segment = {
  label: string;
  value: number;
  accentClass: string;
};

const SOURCE_LABEL: Record<AdminActionSource, string> = {
  web: 'Web',
  cli: 'CLI',
  mcp: 'MCP',
  unknown: 'Unknown',
};

const SOURCE_ACCENT: Record<AdminActionSource, string> = {
  web: 'fill-active',
  cli: 'fill-gh',
  mcp: 'fill-review',
  unknown: 'fill-waiting',
};

const AUTH_LABEL: Record<AdminActionAuthType, string> = {
  jwt: 'JWT',
  pat: 'PAT',
};

const AUTH_ACCENT: Record<AdminActionAuthType, string> = {
  jwt: 'fill-local',
  pat: 'fill-admin',
};

const percent = (value: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const BreakdownRow = ({ item, total }: { item: Segment; total: number }) => {
  const width = percent(item.value, total);

  return (
    <div className="admin-breakdown-row">
      <div className="admin-breakdown-meta">
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </div>
      <div className="admin-breakdown-track">
        <span className={`admin-breakdown-fill ${item.accentClass}`} style={{ width: `${width}%` }} />
      </div>
      <span className="admin-breakdown-percent">{width}%</span>
    </div>
  );
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ActionRow = ({ action }: { action: AdminActionLog }) => {
  return (
    <article className="admin-action-row">
      <div className="admin-action-main">
        <div className="admin-action-tags">
          <span className="admin-action-tag">{SOURCE_LABEL[action.source]}</span>
          <span className="admin-action-tag">{AUTH_LABEL[action.authType]}</span>
          <span className="admin-action-method">{action.method}</span>
          <code>{action.path}</code>
        </div>
        <div className="admin-action-meta-line">
          <span>{formatDateTime(action.createdAt)}</span>
          <span>status: {action.statusCode ?? '—'}</span>
          <span>{typeof action.durationMs === 'number' ? `${action.durationMs} ms` : '—'}</span>
        </div>
      </div>

      <div className="admin-action-side">
        <strong>{action.user?.username || 'system'}</strong>
        <span>{action.user?.email || action.ip || '—'}</span>
        {action.token?.tokenPrefix ? <small>{action.token.tokenPrefix}</small> : null}
      </div>
    </article>
  );
};

export const AdminPage = () => {
  const [stat, setStat] = useState<AdminStat | null>(null);
  const [actions, setActions] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [actionsError, setActionsError] = useState<ApiError | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | AdminActionSource>('all');
  const [authFilter, setAuthFilter] = useState<'all' | AdminActionAuthType>('all');
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    apiService
      .getAdminStat()
      .then((data) => {
        if (!cancelled) {
          setStat(data);
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActionsLoading(true);
    setActionsError(null);

    apiService
      .getAdminActionLogs({
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        authType: authFilter === 'all' ? undefined : authFilter,
        limit,
      })
      .then((payload) => {
        if (!cancelled) {
          setActions(payload.data);
          setActionsLoading(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setActionsError(normalizeApiError(reason));
          setActionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authFilter, limit, sourceFilter]);

  const userSegments = useMemo<Segment[]>(
    () => [
      { label: 'Админы', value: stat?.adminUsers ?? 0, accentClass: 'fill-admin' },
      { label: 'Дев-аккаунты', value: stat?.devUsers ?? 0, accentClass: 'fill-dev' },
      { label: 'Локальные', value: stat?.localUsers ?? 0, accentClass: 'fill-local' },
      { label: 'GitHub', value: stat?.ghUsers ?? 0, accentClass: 'fill-gh' },
    ],
    [stat],
  );

  const projectSegments = useMemo<Segment[]>(
    () => [
      { label: 'Активные', value: stat?.activeProjects ?? 0, accentClass: 'fill-active' },
      { label: 'Завершенные', value: stat?.completedProjects ?? 0, accentClass: 'fill-completed' },
    ],
    [stat],
  );

  const stageSegments = useMemo<Segment[]>(
    () => [
      { label: 'Активные', value: stat?.activeStages ?? 0, accentClass: 'fill-active' },
      { label: 'Ожидание', value: stat?.waitingStages ?? 0, accentClass: 'fill-waiting' },
      { label: 'Ревью', value: stat?.reviewStages ?? 0, accentClass: 'fill-review' },
      { label: 'Завершенные', value: stat?.completedStages ?? 0, accentClass: 'fill-completed' },
    ],
    [stat],
  );

  const sourceSegments = useMemo<Segment[]>(
    () =>
      (['web', 'cli', 'mcp', 'unknown'] as const).map((source) => {
        const found = stat?.actionsBySource.find((item) => item.source === source);
        return {
          label: SOURCE_LABEL[source],
          value: found?.count ?? 0,
          accentClass: SOURCE_ACCENT[source],
        };
      }),
    [stat],
  );

  const authSegments = useMemo<Segment[]>(
    () =>
      (['jwt', 'pat'] as const).map((authType) => {
        const found = stat?.actionsByAuth.find((item) => item.authType === authType);
        return {
          label: AUTH_LABEL[authType],
          value: found?.count ?? 0,
          accentClass: AUTH_ACCENT[authType],
        };
      }),
    [stat],
  );

  return (
    <PageShell title="Админ-панель" subtitle="Операционная сводка по пользователям, проектам и стадиям.">
      {loading ? (
        <GlassPanel>
          <p className="lead">Загружаем статистику...</p>
        </GlassPanel>
      ) : null}

      {!loading && error ? (
        <ErrorState
          title={error.status === 403 ? 'Доступ только для админа' : 'Не удалось загрузить статистику'}
          message={error.message}
        />
      ) : null}

      {!loading && !error && stat ? (
        <div className="admin-layout">
          <section className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <p className="admin-kpi-label">Пользователи</p>
              <p className="admin-kpi-value">{stat.users}</p>
              <p className="admin-kpi-hint">Админов: {stat.adminUsers}</p>
            </article>

            <article className="admin-kpi-card">
              <p className="admin-kpi-label">Проекты</p>
              <p className="admin-kpi-value">{stat.projects}</p>
              <p className="admin-kpi-hint">Активных: {stat.activeProjects}</p>
            </article>

            <article className="admin-kpi-card">
              <p className="admin-kpi-label">Стадии</p>
              <p className="admin-kpi-value">{stat.stages}</p>
              <p className="admin-kpi-hint">Завершено: {stat.completedStages}</p>
            </article>

            <article className="admin-kpi-card">
              <p className="admin-kpi-label">События аудита</p>
              <p className="admin-kpi-value">{stat.actionsTotal}</p>
              <p className="admin-kpi-hint">Последние: {stat.recentActions.length}</p>
            </article>
          </section>

          <section className="admin-section-grid">
            <GlassPanel className="admin-panel">
              <h2>Состав пользователей</h2>
              <div className="admin-breakdown-list">
                {userSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.users, 1)} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="admin-panel">
              <h2>Проекты</h2>
              <div className="admin-breakdown-list">
                {projectSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.projects, 1)} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="admin-panel admin-panel-wide">
              <h2>Пайплайн стадий</h2>
              <div className="admin-breakdown-list">
                {stageSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.stages, 1)} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="admin-panel">
              <h2>Источники действий</h2>
              <div className="admin-breakdown-list">
                {sourceSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.actionsTotal, 1)} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="admin-panel">
              <h2>Тип авторизации</h2>
              <div className="admin-breakdown-list">
                {authSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.actionsTotal, 1)} />
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="admin-panel admin-panel-wide">
              <div className="admin-actions-head">
                <h2>Последние действия</h2>
                <div className="admin-actions-filters">
                  <label>
                    <span>Источник</span>
                    <select
                      value={sourceFilter}
                      onChange={(event) => {
                        setSourceFilter(event.target.value as 'all' | AdminActionSource);
                      }}
                    >
                      <option value="all">Все</option>
                      <option value="web">Web</option>
                      <option value="cli">CLI</option>
                      <option value="mcp">MCP</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>

                  <label>
                    <span>Авторизация</span>
                    <select
                      value={authFilter}
                      onChange={(event) => {
                        setAuthFilter(event.target.value as 'all' | AdminActionAuthType);
                      }}
                    >
                      <option value="all">Все</option>
                      <option value="jwt">JWT</option>
                      <option value="pat">PAT</option>
                    </select>
                  </label>

                  <label>
                    <span>Лимит</span>
                    <select
                      value={String(limit)}
                      onChange={(event) => {
                        setLimit(Number(event.target.value));
                      }}
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </label>
                </div>
              </div>

              {actionsLoading ? <p className="lead">Загружаем логи действий...</p> : null}
              {!actionsLoading && actionsError ? <p className="admin-actions-error">{actionsError.message}</p> : null}
              {!actionsLoading && !actionsError && actions.length === 0 ? (
                <p className="admin-actions-empty">По выбранным фильтрам действий нет.</p>
              ) : null}
              {!actionsLoading && !actionsError && actions.length > 0 ? (
                <div className="admin-actions-list">
                  {actions.map((action) => (
                    <ActionRow key={action.id} action={action} />
                  ))}
                </div>
              ) : null}
            </GlassPanel>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
};
