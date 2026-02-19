import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { MenuSelect } from '../components/ui/MenuSelect';
import { TextInput } from '../components/ui/TextInput';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import { apiService } from '../lib/api/service';
import type { Team } from '../types/models';

type ProjectForm = {
  project_name: string;
};

export const ProjectsPage = () => {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const createProject = useProjectsStore((state) => state.createProject);
  const pushToast = useUiStore((state) => state.pushToast);
  const [ownerTeams, setOwnerTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [projectTarget, setProjectTarget] = useState<string>('personal');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>();

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    let cancelled = false;
    setTeamsLoading(true);
    apiService
      .getTeams()
      .then((teams) => {
        if (cancelled) {
          return;
        }
        const onlyOwners = teams.filter((team) => team.role?.toLowerCase() === 'owner');
        setOwnerTeams(onlyOwners);
      })
      .catch(() => {
        if (!cancelled) {
          setOwnerTeams([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTeamsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTarget = projectTarget;

  const onSubmit = handleSubmit(async (values) => {
    const teamId = selectedTarget.startsWith('team:') ? selectedTarget.slice(5) : '';
    try {
      await createProject({
        project_name: values.project_name,
        ...(teamId ? { team_id: teamId } : {}),
      });
      pushToast('Проект создан', 'success');
      reset({ project_name: '' });
    } catch {
      pushToast('Не удалось создать проект', 'error');
    }
  });

  const targetOptions = useMemo(() => {
    return [
      {
        value: 'personal',
        label: 'Личный проект',
        description: 'Проект будет доступен только тебе как owner.',
      },
      ...ownerTeams.map((team) => ({
        value: `team:${team.id}`,
        label: `Команда: ${team.name}`,
        description: 'Проект закрепится за выбранной командой.',
      })),
    ];
  }, [ownerTeams]);

  const createdDate = useMemo(() => {
    if (!user?.createdAt) {
      return '—';
    }
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('ru-RU');
  }, [user?.createdAt]);

  const daysInProduct = useMemo(() => {
    if (!user?.createdAt) {
      return null;
    }
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    const diffMs = Date.now() - date.getTime();
    return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  }, [user?.createdAt]);

  const providerLabel = user?.authProvider?.toLowerCase() === 'github' ? 'GitHub' : 'Local';
  const compactId = user?.id ? `${user.id.slice(0, 6)}...${user.id.slice(-4)}` : '—';

  return (
    <PageShell title="Проекты" subtitle="Создавайте проекты и переходите к управлению стадиями.">
      <GlassPanel className="account-overview">
        <div className="account-overview-header">
          <div>
            <h2>Профиль</h2>
            <p className="muted">Сейчас используется аккаунт {user?.email || '—'}.</p>
          </div>
          <span className="account-provider-tag">{providerLabel}</span>
        </div>

        <div className="account-stats-grid">
          <article className="account-stat-card">
            <p className="stat-label">Username</p>
            <p className="stat-value">@{user?.username || 'account'}</p>
          </article>
          <article className="account-stat-card">
            <p className="stat-label">Аккаунт создан</p>
            <p className="stat-value">{createdDate}</p>
          </article>
          <article className="account-stat-card">
            <p className="stat-label">Дней в системе</p>
            <p className="stat-value">{daysInProduct ?? '—'}</p>
          </article>
          <article className="account-stat-card">
            <p className="stat-label">Ваших проектов</p>
            <p className="stat-value">{projects.length}</p>
          </article>
          <article className="account-stat-card">
            <p className="stat-label">User ID</p>
            <p className="stat-value mono">{compactId}</p>
          </article>
        </div>
      </GlassPanel>

      <div className="content-grid">
        <GlassPanel>
          <h2>Новый проект</h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <TextInput
              label="Название проекта"
              error={errors.project_name?.message}
              inputProps={{
                placeholder: 'unit-labs website',
                ...register('project_name', {
                  required: 'Введите название проекта',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                }),
              }}
            />
            <MenuSelect
              label="Куда добавить проект"
              value={selectedTarget}
              options={targetOptions}
              onChange={setProjectTarget}
              disabled={teamsLoading && ownerTeams.length === 0}
            />
            {teamsLoading ? <p className="muted">Загружаем команды...</p> : null}
            {!teamsLoading && ownerTeams.length === 0 ? (
              <p className="muted">У тебя пока нет команд с ролью owner. Проект будет создан как личный.</p>
            ) : null}
            {!teamsLoading && selectedTarget.startsWith('team:') ? (
              <p className="muted">Проект будет привязан к выбранной команде.</p>
            ) : null}
            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создаем...' : 'Создать проект'}
            </GradientButton>
          </form>
        </GlassPanel>

        <GlassPanel>
          <h2>Список проектов</h2>
          {loading ? <p>Загрузка...</p> : null}
          {error ? <ErrorState message={error.message} /> : null}
          {!loading && projects.length === 0 ? (
            <EmptyState title="Пока пусто" description="Создайте первый проект слева." />
          ) : null}

          <div className="cards-grid">
            {projects.map((project) => (
              <article key={project.id} className="card-item">
                <h3>{project.projectName}</h3>
                <p className="muted">ID: {project.id}</p>
                {project.description ? <p>{project.description}</p> : null}
                <Link className="cta" to={`/projects/${project.id}`}>
                  Открыть проект
                </Link>
              </article>
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageShell>
  );
};
