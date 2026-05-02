import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { WorkspaceFooter } from '../components/layout/WorkspaceFooter';
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
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<ApiError | null>(null);
  const [createName, setCreateName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [teamActionsOpenForId, setTeamActionsOpenForId] = useState<string | null>(null);
  const [renameTeamId, setRenameTeamId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

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
    if (!createOpen && !renameTeamId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCreateOpen(false);
        setRenameTeamId(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [createOpen, renameTeamId]);

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

  const onStartRenameTeam = (team: Team) => {
    setTeamActionsOpenForId(null);
    setRenameTeamId(team.id);
    setRenameName(team.name);
  };

  const onRenameTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const teamName = renameName.trim();
    if (!renameTeamId) {
      return;
    }
    if (teamName.length < 2) {
      pushToast('Название команды должно быть не короче 2 символов', 'error');
      return;
    }

    setRenameLoading(true);
    try {
      const updated = await apiService.patchTeam(renameTeamId, { name: teamName });
      setTeams((prev) =>
        prev.map((team) =>
          team.id === renameTeamId
            ? {
                ...team,
                ...updated,
                role: team.role ?? updated.role,
              }
            : team,
        ),
      );
      setTeamDetailsById((prev) => {
        const current = prev[renameTeamId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [renameTeamId]: {
            ...current,
            name: teamName,
          },
        };
      });
      setRenameTeamId(null);
      setRenameName('');
      pushToast('Команда переименована', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setRenameLoading(false);
    }
  };

  const onDeleteTeam = (team: Team) => {
    setTeamActionsOpenForId(null);
    openConfirm({
      title: 'Удалить команду?',
      description:
        'Команда, участники, инвайты и командные проекты со стадиями и задачами будут удалены без восстановления.',
      onConfirm: async () => {
        setDeletingTeamId(team.id);
        try {
          await apiService.deleteTeam(team.id);
          setTeams((prev) => prev.filter((item) => item.id !== team.id));
          setTeamDetailsById((prev) => {
            const next = { ...prev };
            delete next[team.id];
            return next;
          });
          pushToast('Команда удалена', 'success');
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        } finally {
          setDeletingTeamId(null);
        }
      },
    });
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
                setCreateOpen(true);
              }}
            >
              <span className="ui-btn-icon" aria-hidden="true">+</span>
              Создать команду
            </button>
          </div>

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
              const effectiveRole = team.role || details?.myRole;
              const canManageTeam = effectiveRole?.toLowerCase() === 'owner';

              return (
                <article key={team.id} className="teams-v3-card">
                  <div className="teams-v3-card-head">
                    <div className="teams-v3-card-icon">{getInitials(team.name)}</div>
                    <div className="teams-v3-card-head-actions">
                      <span className="teams-v3-role-chip">{getRoleLabel(effectiveRole)}</span>
                      {canManageTeam ? (
                        <div className="teams-v3-card-menu">
                          <button
                            className="teams-v3-card-more"
                            type="button"
                            aria-label={`Меню команды ${team.name}`}
                            aria-expanded={teamActionsOpenForId === team.id}
                            onClick={() => {
                              setTeamActionsOpenForId((current) => (current === team.id ? null : team.id));
                            }}
                          >
                            ⋮
                          </button>
                          {teamActionsOpenForId === team.id ? (
                            <div className="teams-v3-card-menu-panel">
                              <button
                                type="button"
                                onClick={() => {
                                  onStartRenameTeam(team);
                                }}
                              >
                                Переименовать
                              </button>
                              <button
                                type="button"
                                className="teams-v3-menu-danger"
                                disabled={deletingTeamId === team.id}
                                onClick={() => {
                                  onDeleteTeam(team);
                                }}
                              >
                                {deletingTeamId === team.id ? 'Удаляем...' : 'Удалить'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
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

      {createOpen ? (
        <div
          className="teams-v3-modal-backdrop"
          role="presentation"
          onClick={() => {
            setCreateOpen(false);
          }}
        >
          <section
            className="teams-v3-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-modal-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="teams-v3-modal-head">
              <h2 id="create-team-modal-title">Создать команду</h2>
              <button
                type="button"
                className="teams-v3-modal-close"
                aria-label="Закрыть окно создания команды"
                onClick={() => {
                  setCreateOpen(false);
                }}
              >
                ×
              </button>
            </header>

            <form className="teams-v3-create-form" onSubmit={onCreateTeam}>
              <label htmlFor="team-name">Название команды</label>
              <input
                id="team-name"
                autoFocus
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
        </div>
      ) : null}

      {renameTeamId ? (
        <div
          className="teams-v3-modal-backdrop"
          role="presentation"
          onClick={() => {
            setRenameTeamId(null);
          }}
        >
          <section
            className="teams-v3-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-team-modal-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="teams-v3-modal-head">
              <h2 id="rename-team-modal-title">Переименовать команду</h2>
              <button
                type="button"
                className="teams-v3-modal-close"
                aria-label="Закрыть окно переименования команды"
                onClick={() => {
                  setRenameTeamId(null);
                }}
              >
                ×
              </button>
            </header>

            <form className="teams-v3-create-form" onSubmit={onRenameTeam}>
              <label htmlFor="rename-team-name">Название команды</label>
              <input
                id="rename-team-name"
                autoFocus
                value={renameName}
                onChange={(event) => {
                  setRenameName(event.target.value);
                }}
                placeholder="Основная разработка"
              />
              <div className="teams-v3-create-actions">
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary ui-btn-sm"
                  onClick={() => {
                    setRenameTeamId(null);
                  }}
                  disabled={renameLoading}
                >
                  Отмена
                </button>
                <button type="submit" className="ui-btn ui-btn-primary ui-btn-sm" disabled={renameLoading}>
                  {renameLoading ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <WorkspaceFooter />
    </div>
  );
};
