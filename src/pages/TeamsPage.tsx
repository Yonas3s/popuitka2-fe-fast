import { useEffect, useState } from 'react';
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
import type { ApiError, Team } from '../types/models';

type CreateTeamForm = {
  name: string;
};

export const TeamsPage = () => {
  const pushToast = useUiStore((state) => state.pushToast);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteLoadingByTeam, setInviteLoadingByTeam] = useState<Record<string, boolean>>({});
  const [inviteLinksByTeam, setInviteLinksByTeam] = useState<Record<string, string>>({});

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
    } catch (reason) {
      setError(normalizeApiError(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  const onCreateTeam = handleSubmit(async (values) => {
    try {
      const created = await apiService.createTeam(values);
      setTeams((prev) => [created, ...prev]);
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

  return (
    <PageShell
      title="Команды"
      subtitle="Создавайте команды, приглашайте участников и управляйте доступом по email-инвайтам."
    >
      <div className="content-grid">
        <GlassPanel>
          <h2>Новая команда</h2>
          <form className="form-grid" onSubmit={onCreateTeam}>
            <TextInput
              label="Название команды"
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
              {isSubmitting ? 'Создаем...' : 'Создать команду'}
            </GradientButton>
          </form>
        </GlassPanel>

        <GlassPanel>
          <h2>Как это работает</h2>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Владелец отправляет инвайт на email участника.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Участник открывает ссылку из письма и подтверждает вступление.</div>
            </li>
            <li>
              <span className="icon" />
              <div>После принятия пользователь появляется в команде автоматически.</div>
            </li>
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2>Мои команды</h2>
        {loading ? <p>Загрузка...</p> : null}
        {error ? <ErrorState message={error.message} /> : null}
        {!loading && teams.length === 0 ? (
          <EmptyState title="Пока нет команд" description="Создайте первую команду в форме выше." />
        ) : null}

        <div className="cards-grid">
          {teams.map((team) => (
            <article className="card-item" key={team.id}>
              <h3>{team.name}</h3>
              <p className="muted">ID: {team.id}</p>
              {team.role ? <p className="muted">Роль: {team.role}</p> : null}

              <div className="team-invite-block">
                <TextInput
                  label="Пригласить по email"
                  inputProps={{
                    type: 'email',
                    placeholder: 'user@example.com',
                    value: inviteEmails[team.id] ?? '',
                    onChange: (event) => {
                      setInviteEmails((prev) => ({ ...prev, [team.id]: event.target.value }));
                    },
                  }}
                />

                <div className="actions-row">
                  <GradientButton
                    type="button"
                    disabled={Boolean(inviteLoadingByTeam[team.id])}
                    onClick={() => {
                      void onInvite(team.id);
                    }}
                  >
                    {inviteLoadingByTeam[team.id] ? 'Отправляем...' : 'Отправить инвайт'}
                  </GradientButton>
                  {inviteLinksByTeam[team.id] ? (
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => {
                        void copyInviteLink(team.id);
                      }}
                    >
                      Копировать ссылку
                    </button>
                  ) : null}
                </div>

                {inviteLinksByTeam[team.id] ? (
                  <a className="mono break-all ghost-link" href={inviteLinksByTeam[team.id]} target="_blank" rel="noreferrer">
                    {inviteLinksByTeam[team.id]}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </GlassPanel>
    </PageShell>
  );
};
