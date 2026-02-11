import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { ErrorState } from '../components/feedback/ErrorState';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { AdminStat, ApiError } from '../types/models';

type Segment = {
  label: string;
  value: number;
  accentClass: string;
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

export const AdminPage = () => {
  const [stat, setStat] = useState<AdminStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

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
      { label: 'Active', value: stat?.activeStages ?? 0, accentClass: 'fill-active' },
      { label: 'Waiting', value: stat?.waitingStages ?? 0, accentClass: 'fill-waiting' },
      { label: 'Review', value: stat?.reviewStages ?? 0, accentClass: 'fill-review' },
      { label: 'Completed', value: stat?.completedStages ?? 0, accentClass: 'fill-completed' },
    ],
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
              <p className="admin-kpi-hint">Completed: {stat.completedStages}</p>
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
              <h2>Pipeline стадий</h2>
              <div className="admin-breakdown-list">
                {stageSegments.map((segment) => (
                  <BreakdownRow key={segment.label} item={segment} total={Math.max(stat.stages, 1)} />
                ))}
              </div>
            </GlassPanel>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
};
