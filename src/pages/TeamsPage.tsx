import { useEffect, useMemo, useState } from 'react';
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
import type { ApiError, Team, TeamDetails, TeamMember } from '../types/models';

type CreateTeamForm = {
  name: string;
};

type TeamSection = 'overview' | 'members' | 'invites' | 'settings';

const sectionItems: { key: TeamSection; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'members', label: 'Участники' },
  { key: 'invites', label: 'Инвайты' },
  { key: 'settings', label: 'Настройки' },
];

export const TeamsPage = () => {
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
  const [teamMembersByTeamId, setTeamMembersByTeamId] = useState<Record<string, TeamMember[]>>({});
  const [teamMembersLoadingByTeamId, setTeamMembersLoadingByTeamId] = useState<Record<string, boolean>>({});

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

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === activeTeamId) || null;
  }, [activeTeamId, teams]);

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    if (teamDetailsById[selectedTeam.id] || teamDetailsLoadingById[selectedTeam.id]) {
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
        pushToast(normalized.message, 'error');
      })
      .finally(() => {
        setTeamDetailsLoadingById((prev) => ({ ...prev, [selectedTeam.id]: false }));
      });
  }, [pushToast, selectedTeam, teamDetailsById, teamDetailsLoadingById]);

  useEffect(() => {
    if (!selectedTeam || activeSection !== 'members') {
      return;
    }

    if (teamMembersByTeamId[selectedTeam.id] || teamMembersLoadingByTeamId[selectedTeam.id]) {
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
        pushToast(normalized.message, 'error');
      })
      .finally(() => {
        setTeamMembersLoadingByTeamId((prev) => ({ ...prev, [selectedTeam.id]: false }));
      });
  }, [activeSection, pushToast, selectedTeam, teamMembersByTeamId, teamMembersLoadingByTeamId]);

  const selectedTeamDetails = selectedTeam ? teamDetailsById[selectedTeam.id] : undefined;
  const selectedTeamMembers = selectedTeam ? teamMembersByTeamId[selectedTeam.id] || [] : [];
  const selectedTeamDetailsLoading = selectedTeam ? Boolean(teamDetailsLoadingById[selectedTeam.id]) : false;
  const selectedTeamMembersLoading = selectedTeam ? Boolean(teamMembersLoadingByTeamId[selectedTeam.id]) : false;
  const effectiveRole = (selectedTeamDetails?.myRole || selectedTeam?.role || 'member').toLowerCase();
  const canManageTeam = effectiveRole === 'owner';

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
                        <span className="account-provider-tag">{member.role}</span>
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
    </PageShell>
  );
};
