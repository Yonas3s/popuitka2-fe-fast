import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MenuSelect } from '../components/ui/MenuSelect';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { apiService } from '../lib/api/service';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import type { Project, Team, WorkflowType } from '../types/models';

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
    return 'Обновлено недавно';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Обновлено недавно';
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) {
    return `Обновлено ${diffMinutes} мин назад`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Обновлено ${diffHours} ч назад`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Обновлено ${diffDays} дн назад`;
};

const getProjectStatusMeta = (status?: Project['status']) => {
  if (status === 'active') {
    return { label: 'Активен', className: 'projects-v3-status active' };
  }
  if (status === 'completed') {
    return { label: 'Завершен', className: 'projects-v3-status completed' };
  }
  return { label: 'На паузе', className: 'projects-v3-status paused' };
};

const PROJECT_ACCENT_CLASSES = [
  'projects-v3-icon-accent-blue',
  'projects-v3-icon-accent-purple',
  'projects-v3-icon-accent-orange',
  'projects-v3-icon-accent-teal',
];

export const ProjectsPage = () => {
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const createProject = useProjectsStore((state) => state.createProject);
  const pushToast = useUiStore((state) => state.pushToast);
  const [ownerTeams, setOwnerTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [projectTarget, setProjectTarget] = useState<string>('personal');
  const [workflowType, setWorkflowType] = useState<WorkflowType>('stages');
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

  useEffect(() => {
    if (!createOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCreateOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [createOpen]);

  const selectedTarget = projectTarget;

  const onSubmit = handleSubmit(async (values) => {
    const teamId = selectedTarget.startsWith('team:') ? selectedTarget.slice(5) : '';
    try {
      await createProject({
        project_name: values.project_name,
        ...(teamId ? { team_id: teamId } : {}),
        workflow_type: workflowType,
      });
      pushToast('Проект создан', 'success');
      reset({ project_name: '' });
      setProjectTarget('personal');
      setWorkflowType('stages');
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
        description: 'Проект будет доступен только тебе как владельцу.',
      },
      ...ownerTeams.map((team) => ({
        value: `team:${team.id}`,
        label: `Команда: ${team.name}`,
        description: 'Проект закрепится за выбранной командой.',
      })),
    ];
  }, [ownerTeams]);

  const workflowOptions = useMemo(
    () => [
      {
        value: 'stages',
        label: 'Этапы (stages)',
        description: 'Классический режим со стадиями и задачами внутри стадии.',
      },
      {
        value: 'flat',
        label: 'Сквозной список (flat)',
        description: 'Один общий список задач проекта без стадий.',
      },
    ],
    [],
  );

  const projectCountLabel = useMemo(() => {
    if (loading && projects.length === 0) {
      return 'Загружаем проекты...';
    }
    if (projects.length === 1) {
      return '1 проект';
    }
    return `${projects.length} проектов`;
  }, [loading, projects.length]);

  return (
    <div className="projects-v3-page">
      <WorkspaceHeader activeTab="projects" />

      <main className="projects-v3-main">
        <div className="projects-v3-grid-bg" />
        <span className="projects-v3-marker projects-v3-marker-top-left" />
        <span className="projects-v3-marker projects-v3-marker-top-right" />
        <span className="projects-v3-marker projects-v3-marker-bottom-left" />
        <span className="projects-v3-marker projects-v3-marker-bottom-right" />

        <div className="projects-v3-container projects-v3-content">
          <div className="projects-v3-toolbar">
            <div>
              <h1>Проекты</h1>
              <p>{projectCountLabel}. Выберите проект для управления релизами.</p>
            </div>
            <button
              className="ui-btn ui-btn-primary"
              type="button"
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              <span className="ui-btn-icon" aria-hidden="true">+</span>
              Создать проект
            </button>
          </div>

          {error ? <p className="projects-v3-error">{error.message}</p> : null}
          {loading && projects.length === 0 ? <p className="projects-v3-loading">Загружаем проекты...</p> : null}

          {!loading && projects.length === 0 ? (
            <section className="projects-v3-empty">
              <h3>У вас пока нет проектов</h3>
              <p>Проекты служат контейнерами для релизов. Создайте первый проект, чтобы начать работу.</p>
            </section>
          ) : null}

          <div className="projects-v3-grid">
            {projects.map((project, index) => {
              const accentClass = PROJECT_ACCENT_CLASSES[index % PROJECT_ACCENT_CLASSES.length];
              const status = getProjectStatusMeta(project.status);
              const description = project.description || 'Рабочее пространство проекта для поэтапного управления релизом.';
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

      {createOpen ? (
        <div
          className="projects-v3-modal-backdrop"
          role="presentation"
          onClick={() => {
            setCreateOpen(false);
          }}
        >
          <section
            className="projects-v3-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-modal-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="projects-v3-modal-head">
              <h2 id="create-project-modal-title">Создать проект</h2>
              <button
                type="button"
                className="projects-v3-modal-close"
                aria-label="Закрыть окно создания проекта"
                onClick={() => {
                  setCreateOpen(false);
                }}
              >
                ×
              </button>
            </header>

            <section className="projects-v3-create">
              <form className="projects-v3-form" onSubmit={onSubmit}>
                <div className="projects-v3-field">
                  <label htmlFor="project-name">Название проекта</label>
                  <input
                    id="project-name"
                    autoFocus
                    placeholder="Новый проект"
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
                  <p className="projects-v3-hint">Нет команд с ролью «владелец», проект будет создан как личный.</p>
                ) : null}

                <div className="projects-v3-select">
                  <MenuSelect
                    label="Режим проекта"
                    value={workflowType}
                    options={workflowOptions}
                    onChange={(value) => {
                      setWorkflowType(value === 'flat' ? 'flat' : 'stages');
                    }}
                  />
                </div>

                <div className="projects-v3-form-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary ui-btn-sm"
                    onClick={() => {
                      setCreateOpen(false);
                    }}
                  >
                    Отмена
                  </button>
                  <button className="ui-btn ui-btn-primary ui-btn-sm" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Создаем...' : 'Создать'}
                  </button>
                </div>
              </form>
            </section>
          </section>
        </div>
      ) : null}

      <footer className="projects-v3-footer">
        <div className="projects-v3-container projects-v3-footer-row">
          <div className="mono">unit-labs v1.0.4</div>
          <div>
            <Link to="/teams">Помощь</Link>
            <Link to="/signin">Конфиденциальность</Link>
            <Link to="/signup">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
