import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { WorkspaceFooter } from '../components/layout/WorkspaceFooter';
import type { ApiError, Project, Team, TeamActiveInvite, TeamDetails, TeamMember } from '../types/models';

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

const getProjectStatusMeta = (status?: Project['status']) => {
  if (status === 'active') {
    return {
      label: 'Активен',
      className: 'team-dash-v3-status is-active',
    };
  }

  if (status === 'completed') {
    return {
      label: 'Завершен',
      className: 'team-dash-v3-status is-completed',
    };
  }

  return {
    label: 'Поддержка',
    className: 'team-dash-v3-status is-paused',
  };
};

const getRoleLabel = (role?: string) => {
  const normalized = role?.toLowerCase();
  if (normalized === 'owner') {
    return 'Владелец';
  }
  if (normalized === 'admin') {
    return 'Админ';
  }
  return 'Участник';
};

const isAccessDenied = (error: ApiError) => error.status === 401 || error.status === 403;

export const TeamDetailsPage = () => {
  const { teamId = '' } = useParams<{ teamId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);
  const currentUser = useAuthStore((state) => state.user);

  const deniedToastKeys = useRef<Set<string>>(new Set());

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
  const [teamDetailsDenied, setTeamDetailsDenied] = useState(false);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamDeleting, setTeamDeleting] = useState(false);

  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [teamProjectsLoading, setTeamProjectsLoading] = useState(false);
  const [teamProjectsDenied, setTeamProjectsDenied] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersDenied, setTeamMembersDenied] = useState(false);

  const [teamInvites, setTeamInvites] = useState<TeamActiveInvite[]>([]);
  const [teamInvitesLoading, setTeamInvitesLoading] = useState(false);
  const [teamInvitesDenied, setTeamInvitesDenied] = useState(false);
  const [teamInvitesLoaded, setTeamInvitesLoaded] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [latestInviteLink, setLatestInviteLink] = useState('');
  const [revokeInviteLoadingById, setRevokeInviteLoadingById] = useState<Record<string, boolean>>({});

  const [membersFilter, setMembersFilter] = useState('');

  const [memberActionsOpenForId, setMemberActionsOpenForId] = useState<string | null>(null);
  const [removeMemberLoadingById, setRemoveMemberLoadingById] = useState<Record<string, boolean>>({});
  const [pendingMemberRemoval, setPendingMemberRemoval] = useState<{ teamId: string; member: TeamMember } | null>(null);
  const [removeMemberConfirmUsername, setRemoveMemberConfirmUsername] = useState('');

  const [teamError, setTeamError] = useState<ApiError | null>(null);

  const selectedTeam = useMemo(() => teams.find((team) => team.id === teamId) || null, [teamId, teams]);

  const effectiveRole = (teamDetails?.myRole || selectedTeam?.role || 'member').toLowerCase();
  const canManageTeam = effectiveRole === 'owner';
  const currentTeamName = teamDetails?.name || selectedTeam?.name || '';

  const notifyDeniedOnce = useCallback(
    (key: string, message: string) => {
      if (deniedToastKeys.current.has(key)) {
        return;
      }
      deniedToastKeys.current.add(key);
      pushToast(message, 'error');
    },
    [pushToast],
  );

  const syncTeamRole = useCallback((role?: string, nameFromDetails?: string) => {
    if (!role && !nameFromDetails) {
      return;
    }

    setTeams((prev) =>
      prev.map((item) =>
        item.id === teamId
          ? {
              ...item,
              ...(role ? { role } : {}),
              ...(nameFromDetails ? { name: nameFromDetails } : {}),
            }
          : item,
      ),
    );
  }, [teamId]);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const payload = await apiService.getTeams();
      setTeams(payload);
    } catch {
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  const loadTeamDetails = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setTeamDetailsLoading(true);
    setTeamError(null);
    try {
      const payload = await apiService.getTeamById(teamId);
      setTeamDetails(payload);
      setTeamDetailsDenied(false);
      syncTeamRole(payload.myRole, payload.name);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (isAccessDenied(normalized)) {
        setTeamDetailsDenied(true);
        notifyDeniedOnce(`details:${teamId}`, 'Нет доступа к данным команды');
      } else {
        setTeamError(normalized);
      }
    } finally {
      setTeamDetailsLoading(false);
    }
  }, [notifyDeniedOnce, syncTeamRole, teamId]);

  const loadTeamProjects = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setTeamProjectsLoading(true);
    try {
      const payload = await apiService.getTeamProjects(teamId);
      setTeamProjects(payload.projects);
      setTeamProjectsDenied(false);
      syncTeamRole(payload.myRole);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (isAccessDenied(normalized)) {
        setTeamProjectsDenied(true);
        notifyDeniedOnce(`projects:${teamId}`, 'Нет доступа к проектам этой команды');
      } else {
        pushToast(normalized.message, 'error');
      }
    } finally {
      setTeamProjectsLoading(false);
    }
  }, [notifyDeniedOnce, pushToast, syncTeamRole, teamId]);

  const loadTeamMembers = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setTeamMembersLoading(true);
    try {
      const payload = await apiService.getTeamMembers(teamId);
      setTeamMembers(payload);
      setTeamMembersDenied(false);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (isAccessDenied(normalized)) {
        setTeamMembersDenied(true);
        notifyDeniedOnce(`members:${teamId}`, 'Нет доступа к участникам команды');
      } else {
        pushToast(normalized.message, 'error');
      }
    } finally {
      setTeamMembersLoading(false);
    }
  }, [notifyDeniedOnce, pushToast, teamId]);

  const loadTeamInvites = useCallback(async () => {
    if (!teamId || !canManageTeam) {
      return;
    }

    setTeamInvitesLoading(true);
    try {
      const payload = await apiService.getTeamActiveInvites(teamId);
      setTeamInvites(payload);
      setTeamInvitesDenied(false);
      setTeamInvitesLoaded(true);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (isAccessDenied(normalized)) {
        setTeamInvitesDenied(true);
        notifyDeniedOnce(`invites:${teamId}`, 'Нет доступа к инвайтам этой команды');
      } else {
        pushToast(normalized.message, 'error');
      }
    } finally {
      setTeamInvitesLoading(false);
    }
  }, [canManageTeam, notifyDeniedOnce, pushToast, teamId]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    setTeamNameDraft(currentTeamName);
  }, [currentTeamName]);

  useEffect(() => {
    if (!teamId) {
      navigate('/teams', { replace: true });
      return;
    }

    setTeamDetails(null);
    setTeamError(null);
    setTeamDetailsDenied(false);
    setTeamProjectsDenied(false);
    setTeamMembersDenied(false);
    setTeamInvitesDenied(false);
    setTeamInvitesLoaded(false);
    setTeamInvites([]);
    setLatestInviteLink('');
    setMemberActionsOpenForId(null);
    setPendingMemberRemoval(null);
    setTeamSettingsOpen(false);

    void loadTeamDetails();
    void loadTeamProjects();
    void loadTeamMembers();
  }, [loadTeamDetails, loadTeamMembers, loadTeamProjects, navigate, teamId]);

  useEffect(() => {
    if (!canManageTeam || teamInvitesLoaded || teamInvitesLoading || teamInvitesDenied) {
      return;
    }

    void loadTeamInvites();
  }, [canManageTeam, loadTeamInvites, teamInvitesDenied, teamInvitesLoaded, teamInvitesLoading]);

  useEffect(() => {
    if (!memberActionsOpenForId) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.team-dash-v3-member-menu')) {
        setMemberActionsOpenForId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMemberActionsOpenForId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [memberActionsOpenForId]);

  const membersForView = useMemo(() => {
    const filter = membersFilter.trim().toLowerCase();
    if (!filter) {
      return teamMembers;
    }

    return teamMembers.filter((member) => {
      const haystack = `${member.username} ${member.email} ${member.role}`.toLowerCase();
      return haystack.includes(filter);
    });
  }, [membersFilter, teamMembers]);

  const filteredProjects = useMemo(() => {
    const tab = searchParams.get('tab')?.toLowerCase();
    if (tab === 'projects' || tab === 'members') {
      return teamProjects;
    }
    return teamProjects;
  }, [searchParams, teamProjects]);

  const openRemoveMemberDialog = (member: TeamMember) => {
    if (member.id === currentUser?.id) {
      pushToast('Нельзя удалить самого себя из команды владельцем', 'error');
      return;
    }

    setPendingMemberRemoval({ teamId, member });
    setRemoveMemberConfirmUsername('');
    setMemberActionsOpenForId(null);
  };

  const closeRemoveMemberDialog = () => {
    setPendingMemberRemoval(null);
    setRemoveMemberConfirmUsername('');
  };

  const onSaveTeamName = async () => {
    const nextName = teamNameDraft.trim();
    if (!nextName) {
      pushToast('Введите название команды', 'error');
      return;
    }
    if (nextName === currentTeamName) {
      pushToast('Название уже актуально', 'info');
      return;
    }

    setTeamSaving(true);
    try {
      const updated = await apiService.patchTeam(teamId, { name: nextName });
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                ...updated,
                role: team.role ?? updated.role,
              }
            : team,
        ),
      );
      setTeamDetails((prev) => (prev ? { ...prev, name: nextName } : prev));
      pushToast('Команда переименована', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setTeamSaving(false);
    }
  };

  const onDeleteTeam = () => {
    if (!teamId || teamDeleting) {
      return;
    }

    openConfirm({
      title: 'Удалить команду?',
      description:
        'Команда, участники, инвайты и командные проекты со стадиями и задачами будут удалены без восстановления.',
      onConfirm: async () => {
        setTeamDeleting(true);
        try {
          await apiService.deleteTeam(teamId);
          pushToast('Команда удалена', 'success');
          navigate('/teams');
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        } finally {
          setTeamDeleting(false);
        }
      },
    });
  };

  const confirmRemoveMember = async () => {
    if (!pendingMemberRemoval) {
      return;
    }

    const typedUsername = removeMemberConfirmUsername.trim();
    if (typedUsername !== pendingMemberRemoval.member.username) {
      pushToast('Имя пользователя введено неверно', 'error');
      return;
    }

    const memberId = pendingMemberRemoval.member.id;
    setRemoveMemberLoadingById((prev) => ({ ...prev, [memberId]: true }));
    try {
      await apiService.removeTeamMember(pendingMemberRemoval.teamId, memberId);
      setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
      setTeamDetails((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          stats: {
            ...prev.stats,
            members: Math.max(0, prev.stats.members - 1),
          },
        };
      });

      pushToast('Участник удален из команды', 'success');
      closeRemoveMemberDialog();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setRemoveMemberLoadingById((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const onInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      pushToast('Введите email участника', 'error');
      return;
    }

    setInviteSending(true);
    try {
      const inviteUrl = await apiService.inviteToTeam(teamId, { email });
      setInviteEmail('');
      setLatestInviteLink(inviteUrl);
      pushToast('Приглашение отправлено', 'success');
      await loadTeamInvites();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setInviteSending(false);
    }
  };

  const onRevokeInvite = async (inviteId: string) => {
    setRevokeInviteLoadingById((prev) => ({ ...prev, [inviteId]: true }));
    try {
      await apiService.revokeTeamInvite(teamId, inviteId);
      setTeamInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      pushToast('Инвайт отозван', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setRevokeInviteLoadingById((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  const copyLatestInvite = async () => {
    if (!latestInviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInviteLink);
      pushToast('Ссылка приглашения скопирована', 'success');
    } catch {
      pushToast('Не удалось скопировать ссылку', 'error');
    }
  };

  const pendingRemovalMember = pendingMemberRemoval?.member ?? null;
  const pendingRemovalLoading = pendingRemovalMember ? Boolean(removeMemberLoadingById[pendingRemovalMember.id]) : false;
  const pendingRemovalUsernameMatch = pendingRemovalMember
    ? removeMemberConfirmUsername.trim() === pendingRemovalMember.username
    : false;

  const projectsCount = teamDetails?.stats.projects ?? filteredProjects.length;
  const membersCount = teamDetails?.stats.members ?? teamMembers.length;

  return (
    <div className="team-dash-v3-page">
      <WorkspaceHeader activeTab="teams" />

      <main className="team-dash-v3-main">
        <aside className="team-dash-v3-sidebar">
          <div className="team-dash-v3-sidebar-title">Мои команды</div>
          <nav className="team-dash-v3-sidebar-nav" aria-label="Список команд">
            {teamsLoading ? <p className="team-dash-v3-muted">Загрузка...</p> : null}
            {!teamsLoading && teams.length === 0 ? (
              <p className="team-dash-v3-muted">Нет команд</p>
            ) : null}

            {teams.map((team) => {
              const isActive = team.id === teamId;
              return (
                <Link key={team.id} to={`/teams/${team.id}`} className={isActive ? 'is-active' : ''}>
                  <span className="team-dash-v3-team-icon">{getInitials(team.name)}</span>
                  <span>{team.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="team-dash-v3-sidebar-footer">
            <Link to="/teams">Создать команду</Link>
          </div>
        </aside>

        <section className="team-dash-v3-content">
          <div className="team-dash-v3-top">
            <div>
              <h1>{teamDetails?.name || selectedTeam?.name || 'Команда'}</h1>
              <p>
                ID: {teamId}
                <span>•</span>
                {getRoleLabel(effectiveRole)}
              </p>
            </div>

            <div className="team-dash-v3-top-actions">
              <Link className="team-dash-v3-btn ghost" to="/projects">
                Проекты
              </Link>
              {canManageTeam ? (
                <button
                  className="team-dash-v3-btn ghost"
                  type="button"
                  onClick={() => {
                    setTeamSettingsOpen((prev) => !prev);
                  }}
                >
                  Настройки
                </button>
              ) : null}
              {canManageTeam ? (
                <button
                  className="team-dash-v3-btn solid"
                  type="button"
                  onClick={() => {
                    const invitesBlock = document.getElementById('team-invites-block');
                    invitesBlock?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  Пригласить участника
                </button>
              ) : null}
            </div>
          </div>

          {canManageTeam && teamSettingsOpen ? (
            <section className="team-dash-v3-settings-panel">
              <div className="team-dash-v3-settings-field">
                <label htmlFor="team-details-name">Название команды</label>
                <input
                  id="team-details-name"
                  value={teamNameDraft}
                  onChange={(event) => {
                    setTeamNameDraft(event.target.value);
                  }}
                  placeholder="Название команды"
                />
              </div>
              <div className="team-dash-v3-settings-actions">
                <button
                  className="team-dash-v3-btn ghost"
                  type="button"
                  onClick={() => void onSaveTeamName()}
                  disabled={teamSaving || !teamNameDraft.trim()}
                >
                  {teamSaving ? 'Сохраняем...' : 'Сохранить название'}
                </button>
                <button
                  className="team-dash-v3-btn danger"
                  type="button"
                  onClick={onDeleteTeam}
                  disabled={teamDeleting}
                >
                  {teamDeleting ? 'Удаляем...' : 'Удалить команду'}
                </button>
              </div>
            </section>
          ) : null}

          {teamError ? <p className="team-dash-v3-error">{teamError.message}</p> : null}
          {teamDetailsLoading ? <p className="team-dash-v3-loading">Загружаем карточку команды...</p> : null}
          {teamDetailsDenied ? <p className="team-dash-v3-muted">Карточка команды недоступна.</p> : null}

          <div className="team-dash-v3-metrics">
            <article>
              <span>Активные проекты</span>
              <strong>{teamProjectsLoading ? '...' : projectsCount}</strong>
            </article>
            <article>
              <span>Участники команды</span>
              <strong>{teamMembersLoading ? '...' : membersCount}</strong>
            </article>
            <article>
              <span>Ожидают приглашение</span>
              <strong>{teamInvitesLoading ? '...' : teamInvites.length}</strong>
            </article>
          </div>

          <div className="team-dash-v3-grid">
            <section className="team-dash-v3-panel team-dash-v3-projects">
              <header>
                <h2>Проекты команды</h2>
                <Link to="/projects">+ Новый проект</Link>
              </header>

              {teamProjectsDenied ? <p className="team-dash-v3-muted">Нет доступа к проектам команды.</p> : null}
              {teamProjectsLoading ? <p className="team-dash-v3-muted">Загружаем проекты...</p> : null}
              {!teamProjectsLoading && !teamProjectsDenied && filteredProjects.length === 0 ? (
                <p className="team-dash-v3-muted">Проектов пока нет.</p>
              ) : null}

              <div className="team-dash-v3-project-list">
                {filteredProjects.map((project) => {
                  const status = getProjectStatusMeta(project.status);
                  return (
                    <Link key={project.id} to={`/projects/${project.id}`} className="team-dash-v3-project-item">
                      <span className="team-dash-v3-project-icon">{getInitials(project.projectName)}</span>
                      <div className="team-dash-v3-project-body">
                        <div className="team-dash-v3-project-head">
                          <h3>{project.projectName}</h3>
                          <span className={status.className}>{status.label}</span>
                        </div>
                        <p>{project.description || 'Рабочее пространство командного проекта'}</p>
                      </div>
                      <span className="team-dash-v3-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="team-dash-v3-side-panels">
              <section className="team-dash-v3-panel">
                <header>
                  <h2>Участники</h2>
                  <span>{teamMembers.length}</span>
                </header>

                {teamMembersDenied ? <p className="team-dash-v3-muted">Нет доступа к участникам команды.</p> : null}
                {!teamMembersDenied ? (
                  <div className="team-dash-v3-filter-wrap">
                    <input
                      value={membersFilter}
                      onChange={(event) => {
                        setMembersFilter(event.target.value);
                      }}
                      placeholder="Фильтр участников..."
                    />
                  </div>
                ) : null}

                <div className="team-dash-v3-members-list">
                  {membersForView.map((member) => (
                    <article key={member.id} className="team-dash-v3-member-row">
                      <div className="team-dash-v3-member-avatar">{getInitials(member.username || member.email || 'U')}</div>

                      <div className="team-dash-v3-member-body">
                        <strong>{member.username}</strong>
                        <p>{member.email || 'почта не указана'}</p>
                      </div>

                      <div className="team-dash-v3-member-right">
                        <span className="team-dash-v3-member-role">{getRoleLabel(member.role)}</span>

                        {canManageTeam && member.id !== currentUser?.id ? (
                          <div className="team-dash-v3-member-menu">
                            <button
                              type="button"
                              className="team-dash-v3-member-menu-trigger"
                              aria-haspopup="menu"
                              aria-expanded={memberActionsOpenForId === member.id}
                              onClick={() => {
                                setMemberActionsOpenForId((prev) => (prev === member.id ? null : member.id));
                              }}
                            >
                              ⋯
                            </button>

                            {memberActionsOpenForId === member.id ? (
                              <div className="team-dash-v3-member-menu-panel" role="menu" aria-label={`Действия ${member.username}`}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="danger"
                                  onClick={() => {
                                    openRemoveMemberDialog(member);
                                  }}
                                >
                                  Удалить участника
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {canManageTeam && member.id === currentUser?.id ? <span className="team-dash-v3-you">Вы</span> : null}
                      </div>
                    </article>
                  ))}

                  {!teamMembersLoading && !teamMembersDenied && membersForView.length === 0 ? (
                    <p className="team-dash-v3-muted">Участники не найдены.</p>
                  ) : null}
                </div>
              </section>

              <section className="team-dash-v3-panel" id="team-invites-block">
                <header>
                  <h2>Активные инвайты</h2>
                </header>

                {!canManageTeam ? <p className="team-dash-v3-muted">Отправлять инвайты может только владелец команды.</p> : null}

                {canManageTeam ? (
                  <div className="team-dash-v3-invite-form">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => {
                        setInviteEmail(event.target.value);
                      }}
                      placeholder="почта@пример.рф"
                    />
                    <button type="button" onClick={() => { void onInvite(); }} disabled={inviteSending}>
                      {inviteSending ? 'Отправляем...' : 'Отправить'}
                    </button>
                  </div>
                ) : null}

                {latestInviteLink ? (
                  <div className="team-dash-v3-latest-link">
                    <a href={latestInviteLink} target="_blank" rel="noreferrer">
                      {latestInviteLink}
                    </a>
                    <button type="button" onClick={() => { void copyLatestInvite(); }}>
                      Копировать
                    </button>
                  </div>
                ) : null}

                {teamInvitesDenied ? <p className="team-dash-v3-muted">Нет доступа к активным инвайтам.</p> : null}
                {teamInvitesLoading ? <p className="team-dash-v3-muted">Загружаем инвайты...</p> : null}

                <div className="team-dash-v3-invites-list">
                  {teamInvites.map((invite) => (
                    <article key={invite.id}>
                      <div>
                        <strong>{invite.email}</strong>
                        <p>
                          {invite.createdAt
                            ? `Отправлено ${new Date(invite.createdAt).toLocaleString('ru-RU')}`
                            : 'Отправлено недавно'}
                        </p>
                      </div>

                      {canManageTeam ? (
                        <button
                          type="button"
                          className="danger"
                          disabled={Boolean(revokeInviteLoadingById[invite.id])}
                          onClick={() => {
                            void onRevokeInvite(invite.id);
                          }}
                        >
                          {revokeInviteLoadingById[invite.id] ? 'Отзываем...' : 'Отозвать'}
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {!teamInvitesLoading && !teamInvitesDenied && teamInvites.length === 0 ? (
                    <p className="team-dash-v3-muted">Активных инвайтов пока нет.</p>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <WorkspaceFooter />

      {pendingRemovalMember ? (
        <div className="modal-backdrop" role="presentation">
          <section className="panel modal teams-delete-modal" role="dialog" aria-modal="true">
            <h3>Подтвердите удаление</h3>
            <p>
              Чтобы удалить участника <strong>@{pendingRemovalMember.username}</strong>, введите его имя пользователя вручную.
            </p>
            <div className="team-dash-v3-confirm-field">
              <label htmlFor="remove-member-username">Имя пользователя участника</label>
              <input
                id="remove-member-username"
                value={removeMemberConfirmUsername}
                onChange={(event) => {
                  setRemoveMemberConfirmUsername(event.target.value);
                }}
                placeholder={pendingRemovalMember.username}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <p className="muted">
              Нужно ввести: <span className="mono">@{pendingRemovalMember.username}</span>
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-link" disabled={pendingRemovalLoading} onClick={closeRemoveMemberDialog}>
                Отмена
              </button>
              <button
                type="button"
                className="team-dash-v3-danger-submit"
                disabled={!pendingRemovalUsernameMatch || pendingRemovalLoading}
                onClick={() => {
                  void confirmRemoveMember();
                }}
              >
                {pendingRemovalLoading ? 'Удаляем...' : 'Удалить участника'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
