import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { FRONTEND_BASE_URL } from '../lib/config/env';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import type { ApiError, DirectionTag, Stage, Task, TaskType, TeamMember } from '../types/models';

type StageForm = {
  stage_name: string;
  description: string;
};

const taskTypeLabels: Record<TaskType, string> = {
  task: 'Задача',
  bug: 'Баг',
  feature: 'Фича',
  improvement: 'Улучшение',
  chore: 'Техдолг',
};

export const ProjectDetailsPage = () => {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const project = useProjectsStore((state) => state.currentProject);
  const stages = useProjectsStore((state) => state.stages);
  const shareLink = useProjectsStore((state) => state.shareLink);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProject = useProjectsStore((state) => state.fetchProject);
  const fetchStages = useProjectsStore((state) => state.fetchStages);
  const createStage = useProjectsStore((state) => state.createStage);
  const createShareLink = useProjectsStore((state) => state.createShareLink);
  const pushToast = useUiStore((state) => state.pushToast);
  const [createOpen, setCreateOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [flatTasks, setFlatTasks] = useState<Task[]>([]);
  const [flatLoading, setFlatLoading] = useState(false);
  const [flatError, setFlatError] = useState<ApiError | null>(null);
  const [flatTaskDraft, setFlatTaskDraft] = useState('');
  const [flatTaskEdits, setFlatTaskEdits] = useState<Record<string, string>>({});
  const [assignableMembers, setAssignableMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [directions, setDirections] = useState<DirectionTag[]>([]);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [flatTypeFilter, setFlatTypeFilter] = useState<'all' | TaskType>('all');
  const [flatDirectionFilter, setFlatDirectionFilter] = useState<'all' | string>('all');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageForm>();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void fetchProject(projectId);
  }, [fetchProject, projectId]);

  useEffect(() => {
    if (!projectId || !project) {
      return;
    }

    if (project.workflowType === 'stages') {
      void fetchStages(projectId);
    }
  }, [fetchStages, project, projectId]);

  const resolvedShare = useMemo(() => {
    if (shareLink) {
      return shareLink;
    }

    return project?.shareLink || '';
  }, [project?.shareLink, shareLink]);

  const sharePath = useMemo(() => {
    if (!resolvedShare) {
      return '';
    }

    if (resolvedShare.startsWith('/p/')) {
      return resolvedShare;
    }

    try {
      const parsed = new URL(resolvedShare);
      if (parsed.pathname.startsWith('/p/')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return '';
    }

    return '';
  }, [resolvedShare]);

  const frontendShareUrl = useMemo(() => {
    if (!sharePath) {
      return resolvedShare;
    }

    const base = FRONTEND_BASE_URL || window.location.origin;

    try {
      return new URL(sharePath, base).toString();
    } catch {
      return `${base}${sharePath}`;
    }
  }, [resolvedShare, sharePath]);

  const workflowType = project?.workflowType || 'stages';
  const isFlatWorkflow = workflowType === 'flat';

  const loadFlatTasks = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setFlatLoading(true);
    setFlatError(null);
    try {
      const tasks = await apiService.getProjectTasks(projectId);
      setFlatTasks(tasks);
    } catch (reason) {
      setFlatError(normalizeApiError(reason));
    } finally {
      setFlatLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !project || project.workflowType !== 'flat') {
      return;
    }

    setCreateOpen(false);
    void loadFlatTasks();
  }, [loadFlatTasks, project, projectId]);

  useEffect(() => {
    if (!project?.teamId) {
      setAssignableMembers([]);
      return;
    }

    let cancelled = false;
    setMembersLoading(true);

    void apiService
      .getTeamMembers(project.teamId)
      .then((members) => {
        if (!cancelled) {
          setAssignableMembers(members);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssignableMembers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project?.teamId]);

  useEffect(() => {
    if (!projectId) {
      setDirections([]);
      return;
    }

    let cancelled = false;
    setDirectionsLoading(true);

    void apiService
      .getDirections(projectId)
      .then((items) => {
        if (!cancelled) {
          setDirections(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDirections([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDirectionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onSubmit = handleSubmit(async (values) => {
    if (isFlatWorkflow) {
      pushToast('В режиме flat создание стадий недоступно.', 'info');
      return;
    }

    try {
      await createStage(projectId, values);
      pushToast('Этап добавлен', 'success');
      reset({ stage_name: '', description: '' });
      setCreateOpen(false);
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  });

  const onShare = async () => {
    try {
      await createShareLink(projectId);
      pushToast('Ссылка релиза создана', 'success');
    } catch {
      pushToast('Не удалось выполнить действие', 'error');
    }
  };

  const onCopy = async () => {
    if (!frontendShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(frontendShareUrl);
      pushToast('Ссылка скопирована', 'success');
    } catch {
      pushToast('Не удалось скопировать ссылку', 'error');
    }
  };

  const onCreateFlatTask = async () => {
    const title = flatTaskDraft.trim();
    if (!title) {
      pushToast('Введите название задачи', 'info');
      return;
    }

    try {
      await apiService.createProjectTask(projectId, { title });
      setFlatTaskDraft('');
      pushToast('Задача добавлена', 'success');
      await loadFlatTasks();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onToggleFlatTask = async (taskId: string) => {
    const previous = flatTasks;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    setFlatTasks(optimistic);

    try {
      await apiService.toggleProjectTask(projectId, taskId);
      await loadFlatTasks();
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onSaveFlatTaskTitle = async (taskId: string) => {
    const current = flatTasks.find((task) => task.id === taskId);
    if (!current) {
      return;
    }

    const title = (flatTaskEdits[taskId] ?? current.title).trim();
    if (!title) {
      pushToast('Название задачи не может быть пустым', 'info');
      setFlatTaskEdits((prev) => ({ ...prev, [taskId]: current.title }));
      return;
    }

    const previous = flatTasks;
    const optimistic = previous.map((task) => (task.id === taskId ? { ...task, title } : task));
    setFlatTasks(optimistic);

    try {
      await apiService.editProjectTaskTitle(projectId, taskId, { title });
      await loadFlatTasks();
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onDeleteFlatTask = async (taskId: string) => {
    try {
      await apiService.deleteProjectTask(projectId, taskId);
      pushToast('Задача удалена', 'success');
      await loadFlatTasks();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onAssignFlatTask = async (taskId: string, assigneeUserId: string | null) => {
    const previous = flatTasks;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, assigneeUserId: assigneeUserId || undefined } : task,
    );
    setFlatTasks(optimistic);

    try {
      await apiService.assignProjectTask(projectId, taskId, {
        user_id: assigneeUserId,
      });
      pushToast(assigneeUserId ? 'Исполнитель назначен' : 'Назначение снято', 'success');
      await loadFlatTasks();
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onChangeFlatTaskType = async (taskId: string, taskType: TaskType) => {
    const previous = flatTasks;
    const optimistic = previous.map((task) => (task.id === taskId ? { ...task, taskType } : task));
    setFlatTasks(optimistic);

    try {
      await apiService.patchProjectTaskMeta(projectId, taskId, {
        task_type: taskType,
      });
      pushToast('Тип задачи обновлен', 'success');
      await loadFlatTasks();
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const onToggleFlatDirection = async (taskId: string, directionId: string) => {
    const current = flatTasks.find((task) => task.id === taskId);
    if (!current) {
      return;
    }

    const nextDirectionIds = current.directionIds.includes(directionId)
      ? current.directionIds.filter((id) => id !== directionId)
      : [...current.directionIds, directionId];
    const previous = flatTasks;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, directionIds: nextDirectionIds } : task,
    );
    setFlatTasks(optimistic);

    try {
      await apiService.patchProjectTaskMeta(projectId, taskId, {
        direction_ids: nextDirectionIds,
      });
      pushToast('Направления обновлены', 'success');
      await loadFlatTasks();
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  const filteredFlatTasks = useMemo(
    () =>
      flatTasks.filter((task) => {
        if (flatTypeFilter !== 'all' && task.taskType !== flatTypeFilter) {
          return false;
        }
        if (flatDirectionFilter !== 'all' && !task.directionIds.includes(flatDirectionFilter)) {
          return false;
        }
        return true;
      }),
    [flatDirectionFilter, flatTasks, flatTypeFilter],
  );

  const userInitials = useMemo(() => {
    const source = user?.username || user?.email || 'UL';
    const words = source.split(/[\s._-]+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [user?.email, user?.username]);

  const stageStatus = (status?: Stage['status']) => {
    if (status === 'completed') {
      return { label: 'Готово', className: 'project-v4-stage-status done' };
    }
    if (status === 'active') {
      return { label: 'В работе', className: 'project-v4-stage-status active' };
    }
    if (status === 'review') {
      return { label: 'Ревью', className: 'project-v4-stage-status review' };
    }
    return { label: 'Ожидание', className: 'project-v4-stage-status pending' };
  };

  const projectStatusMeta = useMemo(() => {
    if (project?.status === 'completed') {
      return { label: 'ЗАВЕРШЕН', className: 'project-v4-project-status completed' };
    }
    return { label: 'АКТИВЕН', className: 'project-v4-project-status active' };
  }, [project?.status]);

  const getStageUpdatedLabel = (stage: Stage) => {
    const raw = stage.raw as Record<string, unknown>;
    const dateValue =
      (typeof raw.updatedAt === 'string' && raw.updatedAt) ||
      (typeof raw.updated_at === 'string' && raw.updated_at) ||
      (typeof raw.createdAt === 'string' && raw.createdAt) ||
      (typeof raw.created_at === 'string' && raw.created_at) ||
      '';

    if (!dateValue) {
      return '--';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
    if (diffMinutes < 60) {
      return `${diffMinutes} мин назад`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} ч назад`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
  };

  const getProgress = (status?: Stage['status']) => {
    if (status === 'completed') {
      return 100;
    }
    if (status === 'review') {
      return 88;
    }
    if (status === 'active') {
      return 72;
    }
    return 0;
  };

  return (
    <div className="project-v4-page">
      <WorkspaceHeader activeTab="projects" />

      <main className="project-v4-main">
        <div className="project-v4-grid-bg" />
        <div className="project-v4-container project-v4-content">
          <div className="project-v4-head">
            <div>
              <div className="project-v4-title-row">
                <h1>{project?.projectName || 'Проект'}</h1>
                <span className={projectStatusMeta.className}>{projectStatusMeta.label}</span>
              </div>
              <p>
                {project?.description ||
                  (isFlatWorkflow
                    ? 'Сквозной список задач проекта без стадий.'
                    : 'Поэтапная поставка и прозрачный процесс согласования для клиента.')}
              </p>
            </div>

            <div className="project-v4-actions">
              <button
                className="project-v4-secondary-btn"
                type="button"
                onClick={() => {
                  setToolsOpen((prev) => !prev);
                }}
              >
                Настройки
              </button>
              <button className="project-v4-primary-btn" type="button" onClick={onShare}>
                Запустить релиз
              </button>
            </div>
          </div>

          {toolsOpen ? (
            <section className="project-v4-tools">
              <div className="project-v4-tools-row">
                <button className="project-v4-secondary-btn" type="button" onClick={onShare}>
                  Сгенерировать клиентскую ссылку
                </button>
                <button
                  className="project-v4-secondary-btn"
                  type="button"
                  onClick={onCopy}
                  disabled={!frontendShareUrl}
                >
                  Копировать
                </button>
                <Link
                  className={`project-v4-secondary-btn ${!sharePath ? 'is-disabled' : ''}`}
                  to={sharePath || '#'}
                >
                  Открыть страницу клиента
                </Link>
              </div>
              <p className="project-v4-tools-link">
                {frontendShareUrl ? frontendShareUrl : 'Ссылка пока не создана'}
              </p>
            </section>
          ) : null}

          {!isFlatWorkflow && createOpen ? (
            <section className="project-v4-create-stage">
              <form className="project-v4-create-form" onSubmit={onSubmit}>
                <div>
                  <label htmlFor="stage-name">Название этапа</label>
                  <input
                    id="stage-name"
                    placeholder="Разработка"
                    {...register('stage_name', { required: 'Введите название стадии' })}
                  />
                  {errors.stage_name?.message ? <small>{errors.stage_name.message}</small> : null}
                </div>
                <div>
                  <label htmlFor="stage-description">Описание</label>
                  <input id="stage-description" placeholder="Реализация спринта" {...register('description')} />
                </div>
                <div className="project-v4-create-actions">
                  <button
                    type="button"
                    className="project-v4-secondary-btn"
                    onClick={() => {
                      setCreateOpen(false);
                    }}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="project-v4-primary-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохраняем...' : 'Создать этап'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {!isFlatWorkflow ? (
            <section className="project-v4-stages">
              <div className="project-v4-stages-head">
                <div>Порядок</div>
                <div>Название этапа</div>
                <div>Статус</div>
                <div>Обновление</div>
                <div>Действие</div>
              </div>

              {loading ? <p className="project-v4-message">Загрузка стадий...</p> : null}
              {error ? <p className="project-v4-message error">{error.message}</p> : null}
              {!loading && !error && stages.length === 0 ? (
                <p className="project-v4-message">Стадий пока нет. Добавьте первый этап проекта.</p>
              ) : null}

              {stages.map((stage, index) => {
                const status = stageStatus(stage.status);
                const progress = getProgress(stage.status);
                const stageHref = `/projects/${projectId}/stages/${stage.id}`;
                return (
                  <article
                    key={stage.id}
                    className={`project-v4-stage-row ${stage.status === 'active' ? 'is-active' : ''} ${
                      stage.status === 'completed' ? 'is-completed' : ''
                    } ${stage.status === 'waiting' ? 'is-waiting' : ''} ${stage.status === 'review' ? 'is-review' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть этап ${stage.stageName}`}
                    onClick={() => {
                      navigate(stageHref);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(stageHref);
                      }
                    }}
                  >
                    <div className="project-v4-stage-grid">
                      <div className="project-v4-order">
                        <span className="project-v4-order-number">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div>
                        <h3>{stage.stageName}</h3>
                        <p>{stage.description || 'Без описания'}</p>
                      </div>
                      <div>
                        <span className={status.className}>{status.label}</span>
                      </div>
                      <div className="project-v4-updated">
                        <span className="project-v4-mini-avatar">{userInitials}</span>
                        <span>{getStageUpdatedLabel(stage)}</span>
                      </div>
                      <div className="project-v4-action">
                        <span>⋯</span>
                      </div>
                    </div>

                    {stage.status === 'active' ? (
                      <div className="project-v4-progress">
                        <div className="project-v4-progress-top">
                          <span>Прогресс спринта</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="project-v4-progress-track">
                          <div className="project-v4-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}

              <button
                className="project-v4-add-stage"
                type="button"
                onClick={() => {
                  setCreateOpen((prev) => !prev);
                }}
              >
                + Добавить этап
              </button>
            </section>
          ) : (
            <section className="project-v4-flat">
              <div className="project-v4-flat-head">
                <h2>Сквозные задачи</h2>
                <span className="project-v4-flat-chip">Режим: flat</span>
              </div>

              <div className="project-v4-flat-filters">
                <label>
                  <span>Тип</span>
                  <select
                    value={flatTypeFilter}
                    onChange={(event) => {
                      setFlatTypeFilter(event.target.value as 'all' | TaskType);
                    }}
                  >
                    <option value="all">Все типы</option>
                    <option value="task">Задача</option>
                    <option value="bug">Баг</option>
                    <option value="feature">Фича</option>
                    <option value="improvement">Улучшение</option>
                    <option value="chore">Техдолг</option>
                  </select>
                </label>
                <label>
                  <span>Направление</span>
                  <select
                    value={flatDirectionFilter}
                    disabled={directionsLoading || directions.length === 0}
                    onChange={(event) => {
                      setFlatDirectionFilter(event.target.value as 'all' | string);
                    }}
                  >
                    <option value="all">Все направления</option>
                    {directions.map((direction) => (
                      <option key={direction.id} value={direction.id}>
                        {direction.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {flatLoading ? <p className="project-v4-message">Загрузка задач...</p> : null}
              {flatError ? <p className="project-v4-message error">{flatError.message}</p> : null}
              {!flatLoading && !flatError && flatTasks.length === 0 ? (
                <p className="project-v4-message">Задач пока нет. Добавьте первую задачу проекта.</p>
              ) : null}

              <div className="project-v4-flat-list">
                {filteredFlatTasks.map((task) => {
                  const value = flatTaskEdits[task.id] ?? task.title;
                  return (
                    <article key={task.id} className={`project-v4-flat-item ${task.done ? 'is-done' : ''}`}>
                      <label className="project-v4-flat-check">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {
                            void onToggleFlatTask(task.id);
                          }}
                        />
                      </label>

                      <div className="project-v4-flat-main">
                        <input
                          className="project-v4-flat-input"
                          value={value}
                          onChange={(event) => {
                            setFlatTaskEdits((prev) => ({ ...prev, [task.id]: event.target.value }));
                          }}
                          onBlur={() => {
                            void onSaveFlatTaskTitle(task.id);
                          }}
                        />
                        <div className="project-v4-flat-meta">
                          <label className="project-v4-flat-type">
                            <span>Тип</span>
                            <select
                              value={task.taskType}
                              onChange={(event) => {
                                void onChangeFlatTaskType(task.id, event.target.value as TaskType);
                              }}
                            >
                              <option value="task">Задача</option>
                              <option value="bug">Баг</option>
                              <option value="feature">Фича</option>
                              <option value="improvement">Улучшение</option>
                              <option value="chore">Техдолг</option>
                            </select>
                          </label>
                          <span className={`project-v4-flat-type-pill ${task.taskType}`}>
                            {taskTypeLabels[task.taskType]}
                          </span>
                          <span className="project-v4-flat-assignee-id">
                            assignee_user_id: {task.assigneeUserId || '—'}
                          </span>
                          {project?.teamId ? (
                            <label className="project-v4-flat-assign">
                              <span>Исполнитель</span>
                              <select
                                value={task.assigneeUserId ?? ''}
                                disabled={membersLoading}
                                onChange={(event) => {
                                  void onAssignFlatTask(task.id, event.target.value || null);
                                }}
                              >
                                <option value="">Без исполнителя</option>
                                {assignableMembers.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    @{member.username} ({member.email})
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <span className="project-v4-flat-assign-note">Личный проект</span>
                          )}
                        </div>

                        {directions.length > 0 ? (
                          <div className="project-v4-flat-directions">
                            {directions.map((direction) => {
                              const active = task.directionIds.includes(direction.id);
                              return (
                                <button
                                  key={direction.id}
                                  type="button"
                                  className={active ? 'active' : ''}
                                  onClick={() => {
                                    void onToggleFlatDirection(task.id, direction.id);
                                  }}
                                >
                                  {direction.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>

                      <div className="project-v4-flat-actions">
                        <button
                          type="button"
                          onClick={() => {
                            void onSaveFlatTaskTitle(task.id);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void onDeleteFlatTask(task.id);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {!flatLoading && !flatError && flatTasks.length > 0 && filteredFlatTasks.length === 0 ? (
                <p className="project-v4-message">По выбранным фильтрам задач нет.</p>
              ) : null}

              <div className="project-v4-flat-create">
                <input
                  value={flatTaskDraft}
                  placeholder="Новая задача проекта"
                  onChange={(event) => {
                    setFlatTaskDraft(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void onCreateFlatTask();
                    }
                  }}
                />
                <button type="button" className="project-v4-primary-btn" onClick={() => void onCreateFlatTask()}>
                  Добавить задачу
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="project-v4-footer">
        <div className="project-v4-container project-v4-footer-row">
          <div>
            unit-labs<span>_</span> <small>© 2023</small>
          </div>
          <div>
            <Link to="/projects">Документация</Link>
            <Link to="/teams">Поддержка</Link>
            <Link to="/admin">Статус API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
