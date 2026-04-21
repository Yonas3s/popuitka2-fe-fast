import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { Skeleton } from '../components/ui/Skeleton';
import type { ApiError, Team, TeamDetails } from '../types/models';

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  const normalized = value.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').slice(0, 2);
  return normalized.toUpperCase() || 'UL';
};

const getRoleLabel = (role?: string) => {
  const normalized = role?.toLowerCase() || 'member';
  if (normalized === 'owner') {
    return 'Владелец';
  }
  if (normalized === 'admin') {
    return 'Админ';
  }
  return 'Участник';
};

const getRoleHint = (role?: string) => {
  return role?.toLowerCase() === 'owner' ? 'Владелец: вы' : 'Владелец: другой участник';
};

export const TeamsPage = () => {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<ApiError | null>(null);
  const [createName, setCreateName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [teamDetailsById, setTeamDetailsById] = useState<Record<string, TeamDetails>>({});
  const [teamDetailsLoadingById, setTeamDetailsLoadingById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const loadTeams = async () => {
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const payload = await apiService.getTeams();
        if (cancelled) {
          return;
        }
        setTeams(payload);
      } catch (reason) {
        if (cancelled) {
          return;
        }
        setTeamsError(normalizeApiError(reason));
      } finally {
        if (!cancelled) {
          setTeamsLoading(false);
        }
      }
    };

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (teams.length === 0) {
      return;
    }

    teams.forEach((team) => {
      if (teamDetailsById[team.id] || teamDetailsLoadingById[team.id]) {
        return;
      }

      setTeamDetailsLoadingById((prev) => ({ ...prev, [team.id]: true }));
      apiService
        .getTeamById(team.id)
        .then((details) => {
          setTeamDetailsById((prev) => ({ ...prev, [team.id]: details }));
          if (details.myRole) {
            setTeams((prev) =>
              prev.map((item) =>
                item.id === team.id
                  ? {
                      ...item,
                      role: details.myRole,
                    }
                  : item,
              ),
            );
          }
        })
        .catch(() => {
          // list page tolerates missing team stats silently
        })
        .finally(() => {
          setTeamDetailsLoadingById((prev) => ({ ...prev, [team.id]: false }));
        });
    });
  }, [teamDetailsById, teamDetailsLoadingById, teams]);

  const onCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const teamName = createName.trim();
    if (teamName.length < 2) {
      pushToast('Название команды должно быть не короче 2 символов', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      const created = await apiService.createTeam({ name: teamName });
      setTeams((prev) => [created, ...prev]);
      setCreateName('');
      setCreateOpen(false);
      pushToast('Команда создана', 'success');
      navigate(`/teams/${created.id}`);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="teams-v3-page">
      <WorkspaceHeader activeTab="teams" />

      <main className="teams-v3-main">
        <div className="teams-v3-grid-bg" />
        <span className="teams-v3-marker teams-v3-marker-top-left" />
        <span className="teams-v3-marker teams-v3-marker-top-right" />
        <span className="teams-v3-marker teams-v3-marker-mid" />

        <div className="teams-v3-container teams-v3-content">
          <div className="teams-v3-toolbar">
            <div>
              <h1>Мои команды</h1>
              <p>Управляйте командами, ролями и распределением проектов.</p>
            </div>
            <button
              className="ui-btn ui-btn-primary"
              type="button"
              onClick={() => {
                setCreateOpen((prev) => !prev);
              }}
            >
              <span className="ui-btn-icon" aria-hidden="true">+</span>
              Создать команду
            </button>
          </div>

          {createOpen ? (
            <section className="teams-v3-create-panel">
              <form className="teams-v3-create-form" onSubmit={onCreateTeam}>
                <label htmlFor="team-name">Название команды</label>
                <input
                  id="team-name"
                  value={createName}
                  onChange={(event) => {
                    setCreateName(event.target.value);
                  }}
                  placeholder="Основная разработка"
                />
                <div className="teams-v3-create-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary ui-btn-sm"
                    onClick={() => {
                      setCreateOpen(false);
                    }}
                    disabled={createLoading}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary ui-btn-sm" disabled={createLoading}>
                    {createLoading ? 'Создаем...' : 'Создать'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {teamsError ? <p className="teams-v3-error">{teamsError.message}</p> : null}

          {teamsLoading && teams.length === 0 ? (
            <section className="teams-v3-grid" aria-busy="true" aria-label="Загружаем команды">
              {Array.from({ length: 4 }, (_, i) => (
                <article className="teams-v3-card" key={i}>
                  <div className="teams-v3-card-head">
                    <Skeleton width={40} height={40} radius={10} />
                    <Skeleton width={18} height={18} radius={999} />
                  </div>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="90%" height={10} />
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <Skeleton width={70} height={10} />
                    <Skeleton width={70} height={10} />
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {!teamsLoading && teams.length === 0 ? (
            <section className="teams-v3-empty">
              <h2>Команд пока нет</h2>
              <p>Создай первую команду, чтобы работать с участниками и проектами.</p>
            </section>
          ) : null}

          <section className="teams-v3-grid" style={{ display: teamsLoading && teams.length === 0 ? 'none' : undefined }}>
            {teams.map((team) => {
              const details = teamDetailsById[team.id];
              const membersCount = details?.stats.members;
              const projectsCount = details?.stats.projects;
              const membersPreview = typeof membersCount === 'number' ? Math.min(membersCount, 3) : 0;
              const isStatsLoading = Boolean(teamDetailsLoadingById[team.id]);

              return (
                <article key={team.id} className="teams-v3-card">
                  <div className="teams-v3-card-head">
                    <div className="teams-v3-card-icon">{getInitials(team.name)}</div>
                    <button className="teams-v3-card-more" type="button" aria-label={`Меню команды ${team.name}`}>
                      ⋮
                    </button>
                  </div>

                  <h2>
                    <Link to={`/teams/${team.id}`}>{team.name}</Link>
                  </h2>

                  <p className="teams-v3-card-meta">
                    ID: {team.id} • {getRoleHint(team.role)}
                  </p>

                  <div className="teams-v3-stat-grid">
                    <div>
                      <span>Участники</span>
                      <strong>{isStatsLoading ? '...' : membersCount ?? '—'}</strong>
                    </div>
                    <div>
                      <span>Активные проекты</span>
                      <strong>{isStatsLoading ? '...' : projectsCount ?? '—'}</strong>
                    </div>
                  </div>

                  <div className="teams-v3-avatar-row" aria-hidden="true">
                    {Array.from({ length: membersPreview }).map((_, index) => (
                      <span key={`${team.id}-member-preview-${index}`}>{index + 1}</span>
                    ))}
                    {typeof membersCount === 'number' && membersCount > membersPreview ? (
                      <span>+{membersCount - membersPreview}</span>
                    ) : null}
                  </div>

                  <div className="teams-v3-card-actions">
                    <Link to={`/teams/${team.id}?tab=projects`}>Проекты</Link>
                    <Link to={`/teams/${team.id}?tab=members`}>Участники</Link>
                  </div>

                  <span className="teams-v3-role-chip">{getRoleLabel(team.role)}</span>
                </article>
              );
            })}

            {!teamsLoading ? (
              <button
                type="button"
                className="teams-v3-add-card"
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                <span aria-hidden="true">＋</span>
                <strong>Создать команду</strong>
                <p>Запустите новую команду и пригласите участников.</p>
              </button>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};
