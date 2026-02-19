import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import type { ApiError, Project, Team, TeamActiveInvite, TeamDetails, TeamMember } from '../types/models';

type CreateTeamForm = {
  name: string;
};

type TeamSection = 'overview' | 'projects' | 'members' | 'invites' | 'settings';

const sectionItems: { key: TeamSection; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'projects', label: 'Проекты' },
  { key: 'members', label: 'Участники' },
  { key: 'invites', label: 'Инвайты' },
  { key: 'settings', label: 'Настройки' },
];

export const TeamsPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const pushToast = useUiStore((state) => state.pushToast);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string>('');
  const [activeSection, setActiveSection] = useState<TeamSection>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteLoadingByTeam, setInviteLoadingByTeam] = useState<Record<string, boolean>>({});
  const [inviteLinksByTeam, setInviteLinksByTeam] = useState<Record<string, string>>({});
  const [teamDetailsById, setTeamDetailsById] = useState<Record<string, TeamDetails>>({});
  const [teamDetailsLoadingById, setTeamDetailsLoadingById] = useState<Record<string, boolean>>({});
  const [teamDetailsDeniedById, setTeamDetailsDeniedById] = useState<Record<string, boolean>>({});
  const [teamProjectsByTeamId, setTeamProjectsByTeamId] = useState<Record<string, Project[]>>({});
  const [teamProjectsLoadingByTeamId, setTeamProjectsLoadingByTeamId] = useState<Record<string, boolean>>({});
  const [teamProjectsDeniedByTeamId, setTeamProjectsDeniedByTeamId] = useState<Record<string, boolean>>({});
  const [teamMembersByTeamId, setTeamMembersByTeamId] = useState<Record<string, TeamMember[]>>({});
  const [teamMembersLoadingByTeamId, setTeamMembersLoadingByTeamId] = useState<Record<string, boolean>>({});
  const [teamMembersDeniedByTeamId, setTeamMembersDeniedByTeamId] = useState<Record<string, boolean>>({});
  const [removeMemberLoadingById, setRemoveMemberLoadingById] = useState<Record<string, boolean>>({});
  const [revokeInviteLoadingById, setRevokeInviteLoadingById] = useState<Record<string, boolean>>({});
  const [memberActionsOpenForId, setMemberActionsOpenForId] = useState<string | null>(null);
  const [pendingMemberRemoval, setPendingMemberRemoval] = useState<{ teamId: string; member: TeamMember } | null>(null);
  const [removeMemberConfirmUsername, setRemoveMemberConfirmUsername] = useState('');
  const [teamActiveInvitesByTeamId, setTeamActiveInvitesByTeamId] = useState<Record<string, TeamActiveInvite[]>>({});
  const [teamActiveInvitesLoadingByTeamId, setTeamActiveInvitesLoadingByTeamId] = useState<Record<string, boolean>>({});
  const [teamActiveInvitesDeniedByTeamId, setTeamActiveInvitesDeniedByTeamId] = useState<Record<string, boolean>>({});

  const isAccessDenied = (apiError: ApiError) => apiError.status === 401 || apiError.status === 403;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamForm>();

  const loadTeams = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getTeams();
      setTeams(response);
      if (response.length > 0) {
        setActiveTeamId((prev) => prev || response[0].id);
      }
    } catch (reason) {
      setError(normalizeApiError(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  useEffect(() => {
    if (teams.length === 0) {
      setActiveTeamId('');
      return;
    }

    const exists = teams.some((team) => team.id === activeTeamId);
    if (!exists) {
      setActiveTeamId(teams[0].id);
    }
  }, [activeTeamId, teams]);

  const onCreateTeam = handleSubmit(async (values) => {
    try {
      const created = await apiService.createTeam(values);
      setTeams((prev) => [created, ...prev]);
      setActiveTeamId(created.id);
      setActiveSection('overview');
      reset();
      pushToast('Команда создана', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  });

  const loadActiveInvites = useCallback(
    async (teamId: string) => {
      if (teamActiveInvitesDeniedByTeamId[teamId]) {
        return;
      }

      setTeamActiveInvitesLoadingByTeamId((prev) => ({ ...prev, [teamId]: true }));
      try {
        const invites = await apiService.getTeamActiveInvites(teamId);
        setTeamActiveInvitesByTeamId((prev) => ({ ...prev, [teamId]: invites }));
      } catch (reason) {
        const normalized = normalizeApiError(reason);

        if (isAccessDenied(normalized)) {
          let shouldNotify = false;
          setTeamActiveInvitesDeniedByTeamId((prev) => {
            if (prev[teamId]) {
              return prev;
            }

            shouldNotify = true;
            return { ...prev, [teamId]: true };
          });

          if (shouldNotify) {
            pushToast('Нет доступа к инвайтам этой команды', 'error');
          }
          return;
        }

        pushToast(normalized.message, 'error');
      } finally {
        setTeamActiveInvitesLoadingByTeamId((prev) => ({ ...prev, [teamId]: false }));
      }
    },
    [pushToast, teamActiveInvitesDeniedByTeamId],
  );

  const loadTeamProjects = useCallback(
    async (teamId: string) => {
      if (teamProjectsDeniedByTeamId[teamId]) {
        return;
      }

      setTeamProjectsLoadingByTeamId((prev) => ({ ...prev, [teamId]: true }));
      try {
        const payload = await apiService.getTeamProjects(teamId);
        setTeamProjectsByTeamId((prev) => ({ ...prev, [teamId]: payload.projects }));

        if (payload.myRole) {
          setTeams((prev) =>
            prev.map((team) =>
              team.id === teamId
                ? {
                    ...team,
                    role: payload.myRole,
                  }
                : team,
            ),
          );
        }
      } catch (reason) {
        const normalized = normalizeApiError(reason);

        if (isAccessDenied(normalized)) {
          let shouldNotify = false;
          setTeamProjectsDeniedByTeamId((prev) => {
            if (prev[teamId]) {
              return prev;
            }

            shouldNotify = true;
            return { ...prev, [teamId]: true };
          });

          if (shouldNotify) {
            pushToast('Нет доступа к проектам этой команды', 'error');
          }
          return;
        }

        pushToast(normalized.message, 'error');
      } finally {
        setTeamProjectsLoadingByTeamId((prev) => ({ ...prev, [teamId]: false }));
      }
    },
    [pushToast, teamProjectsDeniedByTeamId],
  );

  const onInvite = async (teamId: string) => {
    const email = inviteEmails[teamId]?.trim() ?? '';
    if (!email) {
      pushToast('Введите email участника', 'error');
      return;
    }

    setInviteLoadingByTeam((prev) => ({ ...prev, [teamId]: true }));
    try {
      const inviteUrl = await apiService.inviteToTeam(teamId, { email });
      if (inviteUrl) {
        setInviteLinksByTeam((prev) => ({ ...prev, [teamId]: inviteUrl }));
      }
      setInviteEmails((prev) => ({ ...prev, [teamId]: '' }));
      await loadActiveInvites(teamId);
      pushToast('Приглашение отправлено', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setInviteLoadingByTeam((prev) => ({ ...prev, [teamId]: false }));
    }
  };

  const copyInviteLink = async (teamId: string) => {
    const value = inviteLinksByTeam[teamId];
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      pushToast('Ссылка приглашения скопирована', 'success');
    } catch {
      pushToast('Не удалось скопировать ссылку', 'error');
    }
  };

  const onRevokeInvite = async (teamId: string, inviteId: string) => {
    setRevokeInviteLoadingById((prev) => ({ ...prev, [inviteId]: true }));
    try {
      await apiService.revokeTeamInvite(teamId, inviteId);
      setTeamActiveInvitesByTeamId((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((invite) => invite.id !== inviteId),
      }));
      pushToast('Инвайт отозван', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setRevokeInviteLoadingById((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  useEffect(() => {
    if (!memberActionsOpenForId) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.teams-member-menu')) {
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

  const openRemoveMemberDialog = (teamId: string, member: TeamMember) => {
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

  const confirmRemoveMember = async () => {
    if (!pendingMemberRemoval) {
      return;
    }

    const { teamId, member } = pendingMemberRemoval;
    const typedUsername = removeMemberConfirmUsername.trim();

    if (typedUsername !== member.username) {
      pushToast('Username введен неверно', 'error');
      return;
    }

    setRemoveMemberLoadingById((prev) => ({ ...prev, [member.id]: true }));
    try {
      await apiService.removeTeamMember(teamId, member.id);
      setTeamMembersByTeamId((prev) => ({
        ...prev,
        [teamId]: (prev[teamId] || []).filter((item) => item.id !== member.id),
      }));
      setTeamDetailsById((prev) => {
        const current = prev[teamId];
        if (!current) {
          return prev;
        }

        return {
          ...prev,
          [teamId]: {
            ...current,
            stats: {
              ...current.stats,
              members: Math.max(0, current.stats.members - 1),
            },
          },
        };
      });
      pushToast('Участник удален из команды', 'success');
      closeRemoveMemberDialog();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setRemoveMemberLoadingById((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === activeTeamId) || null;
  }, [activeTeamId, teams]);

  const selectedTeamDetails = selectedTeam ? teamDetailsById[selectedTeam.id] : undefined;
  const effectiveRole = (selectedTeamDetails?.myRole || selectedTeam?.role || 'member').toLowerCase();
  const canManageTeam = effectiveRole === 'owner';

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    if (
      teamDetailsById[selectedTeam.id]
      || teamDetailsLoadingById[selectedTeam.id]
      || teamDetailsDeniedById[selectedTeam.id]
    ) {
      return;
    }

    setTeamDetailsLoadingById((prev) => ({ ...prev, [selectedTeam.id]: true }));
    apiService
      .getTeamById(selectedTeam.id)
      .then((details) => {
        setTeamDetailsById((prev) => ({ ...prev, [selectedTeam.id]: details }));
        if (details.myRole) {
          setTeams((prev) =>
            prev.map((team) =>
              team.id === selectedTeam.id
                ? {
                    ...team,
                    role: details.myRole,
                  }
                : team,
            ),
          );
        }
      })
      .catch((reason) => {
        const normalized = normalizeApiError(reason);

        if (isAccessDenied(normalized)) {
          let shouldNotify = false;
          setTeamDetailsDeniedById((prev) => {
            if (prev[selectedTeam.id]) {
              return prev;
            }

            shouldNotify = true;
            return { ...prev, [selectedTeam.id]: true };
          });

          if (shouldNotify) {
            pushToast('Нет доступа к данным команды', 'error');
          }
          return;
        }

        pushToast(normalized.message, 'error');
      })
      .finally(() => {
        setTeamDetailsLoadingById((prev) => ({ ...prev, [selectedTeam.id]: false }));
      });
  }, [pushToast, selectedTeam, teamDetailsById, teamDetailsDeniedById, teamDetailsLoadingById]);

  useEffect(() => {
    if (!selectedTeam || activeSection !== 'members') {
      return;
    }

    if (
      teamMembersByTeamId[selectedTeam.id]
      || teamMembersLoadingByTeamId[selectedTeam.id]
      || teamMembersDeniedByTeamId[selectedTeam.id]
    ) {
      return;
    }

    setTeamMembersLoadingByTeamId((prev) => ({ ...prev, [selectedTeam.id]: true }));
    apiService
      .getTeamMembers(selectedTeam.id)
      .then((members) => {
        setTeamMembersByTeamId((prev) => ({ ...prev, [selectedTeam.id]: members }));
      })
      .catch((reason) => {
        const normalized = normalizeApiError(reason);

        if (isAccessDenied(normalized)) {
          let shouldNotify = false;
          setTeamMembersDeniedByTeamId((prev) => {
            if (prev[selectedTeam.id]) {
              return prev;
            }

            shouldNotify = true;
            return { ...prev, [selectedTeam.id]: true };
          });

          if (shouldNotify) {
            pushToast('Нет доступа к участникам команды', 'error');
          }
          return;
        }

        pushToast(normalized.message, 'error');
      })
      .finally(() => {
        setTeamMembersLoadingByTeamId((prev) => ({ ...prev, [selectedTeam.id]: false }));
      });
  }, [
    activeSection,
    pushToast,
    selectedTeam,
    teamMembersByTeamId,
    teamMembersDeniedByTeamId,
    teamMembersLoadingByTeamId,
  ]);

  useEffect(() => {
    if (!selectedTeam || activeSection !== 'projects') {
      return;
    }

    if (
      teamProjectsByTeamId[selectedTeam.id]
      || teamProjectsLoadingByTeamId[selectedTeam.id]
      || teamProjectsDeniedByTeamId[selectedTeam.id]
    ) {
      return;
    }

    void loadTeamProjects(selectedTeam.id);
  }, [
    activeSection,
    loadTeamProjects,
    selectedTeam,
    teamProjectsByTeamId,
    teamProjectsDeniedByTeamId,
    teamProjectsLoadingByTeamId,
  ]);

  useEffect(() => {
    if (!selectedTeam || activeSection !== 'invites' || !canManageTeam) {
      return;
    }

    if (
      teamActiveInvitesByTeamId[selectedTeam.id]
      || teamActiveInvitesLoadingByTeamId[selectedTeam.id]
      || teamActiveInvitesDeniedByTeamId[selectedTeam.id]
    ) {
      return;
    }

    void loadActiveInvites(selectedTeam.id);
  }, [
    activeSection,
    canManageTeam,
    loadActiveInvites,
    selectedTeam,
    teamActiveInvitesByTeamId,
    teamActiveInvitesDeniedByTeamId,
    teamActiveInvitesLoadingByTeamId,
  ]);

  const selectedTeamMembers = selectedTeam ? teamMembersByTeamId[selectedTeam.id] || [] : [];
  const selectedTeamActiveInvites = selectedTeam ? teamActiveInvitesByTeamId[selectedTeam.id] || [] : [];
  const selectedTeamProjects = selectedTeam ? teamProjectsByTeamId[selectedTeam.id] || [] : [];
  const selectedTeamDetailsLoading = selectedTeam ? Boolean(teamDetailsLoadingById[selectedTeam.id]) : false;
  const selectedTeamProjectsLoading = selectedTeam ? Boolean(teamProjectsLoadingByTeamId[selectedTeam.id]) : false;
  const selectedTeamMembersLoading = selectedTeam ? Boolean(teamMembersLoadingByTeamId[selectedTeam.id]) : false;
  const selectedTeamActiveInvitesLoading = selectedTeam ? Boolean(teamActiveInvitesLoadingByTeamId[selectedTeam.id]) : false;
  const pendingRemovalMember = pendingMemberRemoval?.member ?? null;
  const pendingRemovalLoading = pendingRemovalMember ? Boolean(removeMemberLoadingById[pendingRemovalMember.id]) : false;
  const pendingRemovalUsernameMatch = pendingRemovalMember
    ? removeMemberConfirmUsername.trim() === pendingRemovalMember.username
    : false;

  const teamSubtitle = selectedTeam
    ? canManageTeam
      ? 'Ты владелец команды. Доступны инвайты и настройки.'
      : 'Ты участник команды. Доступно чтение и просмотр.'
    : 'Выбери команду в меню слева.';

  return (
    <PageShell
      title="Команды"
      subtitle="Управляй командами через боковое меню: структура под будущие участники и настройки."
    >
      <div className="teams-layout">
        <GlassPanel className="teams-sidebar">
          <div className="teams-sidebar-header">
            <h2>Новая команда</h2>
            <p className="muted">Создай команду и управляй ей через меню ниже.</p>
          </div>

          <form className="form-grid" onSubmit={onCreateTeam}>
            <TextInput
              label="Название"
              error={errors.name?.message}
              inputProps={{
                placeholder: 'unit-labs',
                ...register('name', {
                  required: 'Введите название команды',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                }),
              }}
            />
            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создаем...' : 'Создать'}
            </GradientButton>
          </form>

          <div className="teams-sidebar-block">
            <p className="teams-sidebar-label">Ваши команды</p>
            {loading ? <p className="muted">Загрузка...</p> : null}
            {!loading && teams.length === 0 ? (
              <p className="muted">Пока нет команд. Создай первую выше.</p>
            ) : null}
            <div className="teams-list">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`teams-list-item ${activeTeamId === team.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTeamId(team.id);
                    setActiveSection('overview');
                  }}
                >
                  <span className="teams-list-name">{team.name}</span>
                  <span className="teams-list-meta">{team.role || 'member'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="teams-sidebar-block">
            <p className="teams-sidebar-label">Разделы</p>
            <div className="teams-sections">
              {sectionItems.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  className={`teams-section-item ${activeSection === section.key ? 'active' : ''}`}
                  disabled={!selectedTeam}
                  onClick={() => {
                    setActiveSection(section.key);
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>

        <div className="teams-workspace">
          {error ? <ErrorState message={error.message} /> : null}
          {!loading && teams.length === 0 ? (
            <GlassPanel>
              <EmptyState title="Пока нет команд" description="Создайте первую команду в боковом меню." />
            </GlassPanel>
          ) : null}

          {selectedTeam ? (
            <>
              <GlassPanel className="teams-workspace-head">
                <div>
                  <h2>{selectedTeam.name}</h2>
                  <p className="muted">{teamSubtitle}</p>
                </div>
                <div className="teams-workspace-meta">
                  <span className="account-provider-tag">{effectiveRole}</span>
                  <span className="muted mono">{selectedTeam.id}</span>
                </div>
              </GlassPanel>

              {activeSection === 'overview' ? (
                <GlassPanel className="teams-section-panel">
                  <h3>Обзор команды</h3>
                  {selectedTeamDetailsLoading ? <p className="muted">Загружаем карточку команды...</p> : null}
                  {selectedTeamDetails ? (
                    <div className="teams-overview-grid">
                      <article className="account-stat-card">
                        <p className="stat-label">Название</p>
                        <p className="stat-value">{selectedTeamDetails.name}</p>
                      </article>
                      <article className="account-stat-card">
                        <p className="stat-label">Участники</p>
                        <p className="stat-value">{selectedTeamDetails.stats.members}</p>
                      </article>
                      <article className="account-stat-card">
                        <p className="stat-label">Проекты</p>
                        <p className="stat-value">{selectedTeamDetails.stats.projects}</p>
                      </article>
                      <article className="account-stat-card">
                        <p className="stat-label">Owner ID</p>
                        <p className="stat-value mono">{selectedTeamDetails.ownerId || '—'}</p>
                      </article>
                    </div>
                  ) : (
                    <p className="muted">Карточка команды пока недоступна.</p>
                  )}
                </GlassPanel>
              ) : null}

              {activeSection === 'projects' ? (
                <GlassPanel className="teams-section-panel">
                  <div className="teams-invites-header">
                    <h3>Проекты команды</h3>
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => {
                        if (!selectedTeam) {
                          return;
                        }

                        void loadTeamProjects(selectedTeam.id);
                      }}
                    >
                      Обновить
                    </button>
                  </div>
                  <p className="muted">Все проекты, созданные внутри текущей команды.</p>
                  {selectedTeamProjectsLoading ? <p className="muted">Загружаем проекты команды...</p> : null}
                  {!selectedTeamProjectsLoading && selectedTeamProjects.length === 0 ? (
                    <EmptyState title="Проектов пока нет" description="Создайте первый проект и привяжите его к этой команде." />
                  ) : null}
                  <div className="cards-grid">
                    {selectedTeamProjects.map((project) => (
                      <article key={project.id} className="card-item">
                        <h3>{project.projectName}</h3>
                        <p className="muted mono">{project.id}</p>
                        {project.status ? (
                          <p className="status-row">
                            <span className={`status-badge ${project.status === 'completed' ? 'status-completed' : 'status-active'}`}>
                              {project.status}
                            </span>
                          </p>
                        ) : null}
                        {canManageTeam ? (
                          <a className="ghost-link" href={`/projects/${project.id}`}>
                            Открыть проект
                          </a>
                        ) : (
                          <span className="muted">Открытие доступно owner</span>
                        )}
                      </article>
                    ))}
                  </div>
                </GlassPanel>
              ) : null}

              {activeSection === 'members' ? (
                <GlassPanel className="teams-section-panel">
                  <h3>Участники</h3>
                  <p className="muted">Текущая роль в выбранной команде: {effectiveRole}.</p>
                  {selectedTeamMembersLoading ? <p className="muted">Загружаем участников...</p> : null}
                  {!selectedTeamMembersLoading && selectedTeamMembers.length === 0 ? (
                    <EmptyState title="Участники не найдены" description="В этой команде пока нет участников." />
                  ) : null}
                  <div className="teams-members-list">
                    {selectedTeamMembers.map((member) => (
                      <article key={member.id} className="teams-member-row">
                        <div>
                          <strong>@{member.username}</strong>
                          <p className="muted">{member.email || 'email не указан'}</p>
                        </div>
                        <div className="teams-member-actions">
                          <span className="account-provider-tag">{member.role}</span>
                          {canManageTeam ? (
                            member.id === currentUser?.id ? (
                              <span className="muted">Это вы</span>
                            ) : (
                              <div className="teams-member-menu">
                                <button
                                  type="button"
                                  className="teams-member-menu-trigger"
                                  aria-label={`Действия для @${member.username}`}
                                  aria-haspopup="menu"
                                  aria-expanded={memberActionsOpenForId === member.id}
                                  disabled={Boolean(removeMemberLoadingById[member.id])}
                                  onClick={() => {
                                    setMemberActionsOpenForId((prev) => (prev === member.id ? null : member.id));
                                  }}
                                >
                                  <span aria-hidden="true">...</span>
                                </button>

                                {memberActionsOpenForId === member.id ? (
                                  <div className="teams-member-menu-panel" role="menu" aria-label={`Меню @${member.username}`}>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      className="teams-member-menu-item danger"
                                      onClick={() => {
                                        openRemoveMemberDialog(selectedTeam.id, member);
                                      }}
                                    >
                                      Удалить участника
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </GlassPanel>
              ) : null}

              {activeSection === 'invites' ? (
                <GlassPanel className="teams-section-panel">
                  <h3>Инвайты</h3>
                  {!canManageTeam ? (
                    <p className="muted">Отправлять инвайты может только владелец команды.</p>
                  ) : (
                    <div className="team-invite-block">
                      <TextInput
                        label="Пригласить по email"
                        inputProps={{
                          type: 'email',
                          placeholder: 'user@example.com',
                          value: inviteEmails[selectedTeam.id] ?? '',
                          onChange: (event) => {
                            setInviteEmails((prev) => ({ ...prev, [selectedTeam.id]: event.target.value }));
                          },
                        }}
                      />

                      <div className="actions-row">
                        <GradientButton
                          type="button"
                          disabled={Boolean(inviteLoadingByTeam[selectedTeam.id])}
                          onClick={() => {
                            void onInvite(selectedTeam.id);
                          }}
                        >
                          {inviteLoadingByTeam[selectedTeam.id] ? 'Отправляем...' : 'Отправить инвайт'}
                        </GradientButton>
                        {inviteLinksByTeam[selectedTeam.id] ? (
                          <button
                            type="button"
                            className="ghost-link"
                            onClick={() => {
                              void copyInviteLink(selectedTeam.id);
                            }}
                          >
                            Копировать ссылку
                          </button>
                        ) : null}
                      </div>

                      {inviteLinksByTeam[selectedTeam.id] ? (
                        <a
                          className="mono break-all ghost-link"
                          href={inviteLinksByTeam[selectedTeam.id]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {inviteLinksByTeam[selectedTeam.id]}
                        </a>
                      ) : null}

                      <div className="teams-invites-header">
                        <strong>Активные инвайты</strong>
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => {
                            void loadActiveInvites(selectedTeam.id);
                          }}
                        >
                          Обновить
                        </button>
                      </div>
                      {selectedTeamActiveInvitesLoading ? <p className="muted">Загружаем активные инвайты...</p> : null}
                      {!selectedTeamActiveInvitesLoading && selectedTeamActiveInvites.length === 0 ? (
                        <p className="muted">Активных инвайтов пока нет.</p>
                      ) : null}
                      <div className="teams-invites-list">
                        {selectedTeamActiveInvites.map((invite) => (
                          <article key={invite.id} className="teams-invite-row">
                            <div>
                              <strong>{invite.email}</strong>
                              <p className="muted">
                                Создан:{' '}
                                {invite.createdAt
                                  ? new Date(invite.createdAt).toLocaleString('ru-RU')
                                  : '—'}
                              </p>
                            </div>
                            <div className="teams-invite-meta">
                              <span className="account-provider-tag">active</span>
                              <span className="muted">
                                До:{' '}
                                {invite.expiresAt
                                  ? new Date(invite.expiresAt).toLocaleString('ru-RU')
                                  : '—'}
                              </span>
                              {invite.invitedBy ? <span className="muted mono">{invite.invitedBy}</span> : null}
                              <button
                                type="button"
                                className="ghost-link danger"
                                disabled={Boolean(revokeInviteLoadingById[invite.id])}
                                onClick={() => {
                                  void onRevokeInvite(selectedTeam.id, invite.id);
                                }}
                              >
                                {revokeInviteLoadingById[invite.id] ? 'Отзываем...' : 'Отозвать'}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassPanel>
              ) : null}

              {activeSection === 'settings' ? (
                <GlassPanel className="teams-section-panel">
                  <h3>Настройки</h3>
                  {!canManageTeam ? (
                    <p className="muted">Настройки команды доступны только владельцу.</p>
                  ) : (
                    <div className="teams-settings-list">
                      <div className="teams-setting-row">
                        <div>
                          <strong>Переименование команды</strong>
                          <p className="muted">Скоро: быстрое редактирование названия команды.</p>
                        </div>
                        <button type="button" className="ghost-link" disabled>
                          Скоро
                        </button>
                      </div>
                      <div className="teams-setting-row">
                        <div>
                          <strong>Управление ролями</strong>
                          <p className="muted">Скоро: смена роли участников и передача владения.</p>
                        </div>
                        <button type="button" className="ghost-link" disabled>
                          Скоро
                        </button>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {pendingRemovalMember ? (
        <div className="modal-backdrop" role="presentation">
          <section className="panel modal teams-delete-modal" role="dialog" aria-modal="true">
            <h3>Подтвердите удаление</h3>
            <p>
              Чтобы удалить участника <strong>@{pendingRemovalMember.username}</strong>, введите его username вручную.
            </p>
            <TextInput
              label="Username участника"
              inputProps={{
                value: removeMemberConfirmUsername,
                onChange: (event) => {
                  setRemoveMemberConfirmUsername(event.target.value);
                },
                placeholder: pendingRemovalMember.username,
                autoComplete: 'off',
                autoCapitalize: 'off',
                autoCorrect: 'off',
                spellCheck: false,
              }}
            />
            <p className="muted">
              Нужно ввести: <span className="mono">@{pendingRemovalMember.username}</span>
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-link"
                disabled={pendingRemovalLoading}
                onClick={closeRemoveMemberDialog}
              >
                Отмена
              </button>
              <GradientButton
                type="button"
                disabled={!pendingRemovalUsernameMatch || pendingRemovalLoading}
                onClick={() => {
                  void confirmRemoveMember();
                }}
              >
                {pendingRemovalLoading ? 'Удаляем...' : 'Удалить участника'}
              </GradientButton>
            </div>
          </section>
        </div>
      ) : null}
    </PageShell>
  );
};
