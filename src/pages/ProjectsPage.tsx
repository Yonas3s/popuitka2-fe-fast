import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MenuSelect } from '../components/ui/MenuSelect';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import { apiService } from '../lib/api/service';
import type { Project, Team } from '../types/models';

type ProjectForm = {
  project_name: string;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

const pickString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const getProjectInitials = (projectName: string): string => {
  const words = projectName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (words.length === 0) {
    return 'PR';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
};

const getUserInitials = (username?: string, email?: string): string => {
  const source = username?.trim() || email?.trim() || 'UL';
  const words = source.split(/[\s._-]+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  return source.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').slice(0, 2).toUpperCase() || 'UL';
};

const getProjectVersion = (project: Project, index: number): string => {
  const raw = asRecord(project.raw);
  const fromRaw = pickString(raw, ['version', 'release_version', 'releaseVersion']);
  if (fromRaw) {
    return fromRaw.startsWith('v') ? fromRaw : `v${fromRaw}`;
  }
  return `v1.${(index % 9) + 1}.0`;
};

const getProjectUpdatedLabel = (project: Project): string => {
  const raw = asRecord(project.raw);
  const value = pickString(raw, ['updated_at', 'updatedAt', 'created_at', 'createdAt']);
  if (!value) {
    return 'Updated recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Updated recently';
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
};

const getProjectStatusMeta = (status?: Project['status']) => {
  if (status === 'active') {
    return { label: 'Active', className: 'projects-v3-status active' };
  }
  if (status === 'completed') {
    return { label: 'Completed', className: 'projects-v3-status completed' };
  }
  return { label: 'Paused', className: 'projects-v3-status paused' };
};

const PROJECT_ACCENT_CLASSES = [
  'projects-v3-icon-accent-blue',
  'projects-v3-icon-accent-purple',
  'projects-v3-icon-accent-orange',
  'projects-v3-icon-accent-teal',
];

export const ProjectsPage = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const createProject = useProjectsStore((state) => state.createProject);
  const pushToast = useUiStore((state) => state.pushToast);
  const [ownerTeams, setOwnerTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [projectTarget, setProjectTarget] = useState<string>('personal');
  const [createOpen, setCreateOpen] = useState(false);

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
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, loadMe, meLoaded, meLoading, user]);

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
      setProjectTarget('personal');
      setCreateOpen(false);
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

  const userInitials = useMemo(() => getUserInitials(user?.username, user?.email), [user?.email, user?.username]);
  const projectCountLabel = useMemo(() => {
    if (loading && projects.length === 0) {
      return 'Loading projects...';
    }
    if (projects.length === 1) {
      return '1 project';
    }
    return `${projects.length} projects`;
  }, [loading, projects.length]);

  return (
    <div className="projects-v3-page">
      <header className="projects-v3-header">
        <div className="projects-v3-container projects-v3-header-row">
          <div className="projects-v3-header-left">
            <Link className="projects-v3-brand" to="/">
              unit-labs
              <span>_</span>
            </Link>
            <nav className="projects-v3-nav">
              <Link to="/projects" className="is-active">
                Projects
              </Link>
              <Link to="/teams">Activity</Link>
              <Link to="/admin">Settings</Link>
            </nav>
          </div>
          <div className="projects-v3-header-right">
            <button className="projects-v3-icon-btn" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3a6 6 0 0 0-6 6v2.7c0 .9-.3 1.8-.9 2.5L4 16h16l-1.1-1.8a4.8 4.8 0 0 1-.9-2.5V9a6 6 0 0 0-6-6Zm0 19a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Z" />
              </svg>
            </button>
            <div className="projects-v3-avatar" aria-label="Текущий пользователь">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      <main className="projects-v3-main">
        <div className="projects-v3-grid-bg" />
        <span className="projects-v3-marker projects-v3-marker-top-left" />
        <span className="projects-v3-marker projects-v3-marker-top-right" />
        <span className="projects-v3-marker projects-v3-marker-bottom-left" />
        <span className="projects-v3-marker projects-v3-marker-bottom-right" />

        <div className="projects-v3-container projects-v3-content">
          <div className="projects-v3-toolbar">
            <div>
              <h1>Projects</h1>
              <p>{projectCountLabel}. Select a project to manage its releases.</p>
            </div>
            <button
              className="projects-v3-create-btn"
              type="button"
              onClick={() => {
                setCreateOpen((prev) => !prev);
              }}
            >
              <span>＋</span>
              Создать проект
            </button>
          </div>

          {createOpen ? (
            <section className="projects-v3-create">
              <form className="projects-v3-form" onSubmit={onSubmit}>
                <div className="projects-v3-field">
                  <label htmlFor="project-name">Название проекта</label>
                  <input
                    id="project-name"
                    placeholder="Frontend Core"
                    {...register('project_name', {
                      required: 'Введите название проекта',
                      minLength: { value: 2, message: 'Минимум 2 символа' },
                    })}
                  />
                  {errors.project_name?.message ? <small>{errors.project_name.message}</small> : null}
                </div>

                <div className="projects-v3-select">
                  <MenuSelect
                    label="Куда добавить проект"
                    value={selectedTarget}
                    options={targetOptions}
                    onChange={setProjectTarget}
                    disabled={teamsLoading && ownerTeams.length === 0}
                  />
                </div>

                {teamsLoading ? <p className="projects-v3-hint">Загружаем команды...</p> : null}
                {!teamsLoading && ownerTeams.length === 0 ? (
                  <p className="projects-v3-hint">Нет команд с ролью owner, проект будет создан как личный.</p>
                ) : null}

                <div className="projects-v3-form-actions">
                  <button
                    type="button"
                    className="projects-v3-cancel-btn"
                    onClick={() => {
                      setCreateOpen(false);
                    }}
                  >
                    Отмена
                  </button>
                  <button className="projects-v3-submit-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Создаем...' : 'Создать'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {error ? <p className="projects-v3-error">{error.message}</p> : null}
          {loading && projects.length === 0 ? <p className="projects-v3-loading">Загружаем проекты...</p> : null}

          {!loading && projects.length === 0 ? (
            <section className="projects-v3-empty">
              <h3>У вас пока нет проектов</h3>
              <p>Projects serve as containers for your releases. Create one to get started with the workflow.</p>
            </section>
          ) : null}

          <div className="projects-v3-grid">
            {projects.map((project, index) => {
              const accentClass = PROJECT_ACCENT_CLASSES[index % PROJECT_ACCENT_CLASSES.length];
              const status = getProjectStatusMeta(project.status);
              const description = project.description || 'Project workspace for staged release management.';
              return (
                <Link className="projects-v3-card" key={project.id} to={`/projects/${project.id}`}>
                  <div className="projects-v3-card-head">
                    <div className={`projects-v3-icon ${accentClass}`}>
                      <span>{getProjectInitials(project.projectName)}</span>
                    </div>
                    <span className={status.className}>{status.label}</span>
                  </div>

                  <h3>{project.projectName}</h3>
                  <p className="projects-v3-description">{description}</p>

                  <div className="projects-v3-meta">
                    <span>{getProjectVersion(project, index)}</span>
                    <span>{getProjectUpdatedLabel(project)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="projects-v3-footer">
        <div className="projects-v3-container projects-v3-footer-row">
          <div className="mono">unit-labs v1.0.4</div>
          <div>
            <Link to="/teams">Help</Link>
            <Link to="/signin">Privacy</Link>
            <Link to="/signup">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
