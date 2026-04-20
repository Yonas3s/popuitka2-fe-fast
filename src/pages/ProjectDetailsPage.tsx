import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { FRONTEND_BASE_URL } from '../lib/config/env';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { ProjectReposPanel } from '../components/github/ProjectReposPanel';
import { WebhookEventsPanel } from '../components/github/WebhookEventsPanel';
import { ProjectTelegramPanel } from '../components/telegram/ProjectTelegramPanel';
import { GroupedTaskList } from '../components/tasks/GroupedTaskList';
import { BoardView } from '../components/tasks/BoardView';
import { TaskDetailsDrawer } from '../components/tasks/TaskDetailsDrawer';
import { ViewSettingsPanel, type ViewMode, type VisibleColumns } from '../components/tasks/ViewSettingsPanel';
import { Skeleton } from '../components/ui/Skeleton';
import type {
  ApiError,
  DirectionTag,
  Stage,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  TeamMember,
} from '../types/models';

type StageForm = {
  stage_name: string;
  description: string;
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
  const [activeFlatTaskId, setActiveFlatTaskId] = useState<string | null>(null);
  const consumedFlatDeeplinkRef = useRef<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignableMembers, setAssignableMembers] = useState<TeamMember[]>([]);
  const [, setMembersLoading] = useState(false);
  const [, setMembersAccessDenied] = useState(false);
  const [directions, setDirections] = useState<DirectionTag[]>([]);
  const [, setDirectionsLoading] = useState(false);

  // Stage-style view state for flat mode.
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [grouping, setGrouping] = useState<'status' | 'priority' | 'none'>('status');
  const [ordering, setOrdering] = useState<'priority' | 'created' | 'manual'>('manual');
  const [showEmptyGroups, setShowEmptyGroups] = useState(true);
  const [visibleCols, setVisibleCols] = useState<VisibleColumns>({
    id: true, status: true, assignee: true, priority: true, labels: true, created: true,
  });
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [newDirectionName, setNewDirectionName] = useState('');

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

  // Deeplink: ?task=POPU-86 on a flat project opens the task drawer.
  useEffect(() => {
    const rawKey = searchParams.get('task');
    if (!rawKey) return;
    if (flatTasks.length === 0) return;
    if (consumedFlatDeeplinkRef.current === rawKey) return;

    const normalized = rawKey.toLowerCase();
    const target = flatTasks.find((task) => (task.issueKey || '').toLowerCase() === normalized);
    if (!target) return;

    consumedFlatDeeplinkRef.current = rawKey;
    setActiveFlatTaskId(target.id);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams, { replace: true });
  }, [flatTasks, searchParams, setSearchParams]);

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
      setMembersAccessDenied(false);
      return;
    }

    let cancelled = false;
    setMembersLoading(true);

    void apiService
      .getTeamMembers(project.teamId)
      .then((members) => {
        if (!cancelled) {
          setAssignableMembers(members);
          setMembersAccessDenied(false);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setAssignableMembers([]);
          setMembersAccessDenied(normalizeApiError(reason).status === 403);
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

  const onDeleteFlatTask = async (taskId: string) => {
    const previous = flatTasks;
    setFlatTasks(previous.filter((task) => task.id !== taskId));
    try {
      await apiService.deleteProjectTask(projectId, taskId);
      pushToast('Задача удалена', 'success');
    } catch (reason) {
      setFlatTasks(previous);
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
    } catch (reason) {
      setFlatTasks(previous);
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    }
  };

  // --- Stage-style handlers bridging GroupedTaskList/BoardView/Drawer ---

  const onChangeFlatTaskStatus = async (taskId: string, status: TaskStatus) => {
    const previous = flatTasks;
    setFlatTasks(previous.map((t) => (t.id === taskId ? { ...t, status, done: status === 'done' } : t)));
    try {
      await apiService.changeProjectTaskStatus(projectId, taskId, status);
    } catch (reason) {
      setFlatTasks(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onFlatTaskPriorityChange = async (taskId: string, priority: TaskPriority) => {
    const previous = flatTasks;
    const current = previous.find((t) => t.id === taskId);
    setFlatTasks(previous.map((t) => (t.id === taskId ? { ...t, priority } : t)));
    try {
      // Include task_type so backend's /meta validator (which requires at least
      // one of task_type / direction_ids / repository_id) accepts the payload.
      await apiService.patchProjectTaskMeta(projectId, taskId, {
        task_type: current?.taskType,
        priority,
      });
    } catch (reason) {
      setFlatTasks(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onFlatDirectionsChange = async (taskId: string, directionIds: string[]) => {
    const previous = flatTasks;
    const current = previous.find((t) => t.id === taskId);
    setFlatTasks(previous.map((t) => (t.id === taskId ? { ...t, directionIds } : t)));
    try {
      await apiService.patchProjectTaskMeta(projectId, taskId, {
        task_type: current?.taskType,
        direction_ids: directionIds,
      });
    } catch (reason) {
      setFlatTasks(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onFlatCreateTaskFromList = async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await apiService.createProjectTask(projectId, { title: trimmed });
      pushToast('Задача добавлена', 'success');
      await loadFlatTasks();
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onFlatTitleSaveFromList = async (taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const previous = flatTasks;
    setFlatTasks(previous.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t)));
    try {
      await apiService.editProjectTaskTitle(projectId, taskId, { title: trimmed });
    } catch (reason) {
      setFlatTasks(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onFlatDescriptionSaveFromDrawer = async (taskId: string, description: string) => {
    const previous = flatTasks;
    const current = previous.find((t) => t.id === taskId);
    setFlatTasks(previous.map((t) => (t.id === taskId ? { ...t, description } : t)));
    try {
      await apiService.patchProjectTaskMeta(projectId, taskId, {
        task_type: current?.taskType,
        description,
      });
    } catch (reason) {
      setFlatTasks(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onAddFlatDirection = async () => {
    if (!projectId) return;
    const name = newDirectionName.trim();
    if (!name) {
      pushToast('Введите название направления', 'info');
      return;
    }
    try {
      const created = await apiService.addDirection(projectId, { name });
      setDirections((prev) => (prev.some((d) => d.id === created.id) ? prev : [...prev, created]));
      setNewDirectionName('');
      pushToast('Направление добавлено', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (normalized.status === 409 || normalized.status === 500) {
        try {
          const refreshed = await apiService.getDirections(projectId);
          setDirections(refreshed);
          if (refreshed.some((d) => d.name.trim().toLowerCase() === name.toLowerCase())) {
            setNewDirectionName('');
            pushToast('Направление уже существует', 'info');
            return;
          }
        } catch {
          // fall through
        }
      }
      pushToast(normalized.message, 'error');
    }
  };

  const openFlatTaskDrawer = (taskId: string) => setActiveFlatTaskId(taskId);
  const closeFlatTaskDrawer = () => setActiveFlatTaskId(null);

  const filteredFlatTasks = useMemo(
    () =>
      flatTasks
        .map((task, index) => {
          const raw = task.raw as Record<string, unknown>;
          const doneAtValue =
            (typeof raw.done_at === 'string' && raw.done_at) ||
            (typeof raw.doneAt === 'string' && raw.doneAt) ||
            (typeof raw.updatedAt === 'string' && raw.updatedAt) ||
            (typeof raw.updated_at === 'string' && raw.updated_at) ||
            '';
          const doneAtTs = doneAtValue ? new Date(doneAtValue).getTime() : 0;
          return {
            task,
            index,
            doneAtTs: Number.isFinite(doneAtTs) ? doneAtTs : 0,
          };
        })
        .filter(({ task }) => {
          if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (a.task.done !== b.task.done) {
            return Number(a.task.done) - Number(b.task.done);
          }
          if (!a.task.done) {
            return a.index - b.index;
          }
          const doneOrder = b.doneAtTs - a.doneAtTs;
          return doneOrder !== 0 ? doneOrder : a.index - b.index;
        })
        .map(({ task }) => task),
    [flatTasks, priorityFilter],
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
              <Link
                className="project-v4-secondary-btn"
                to={`/projects/${projectId}/agent`}
              >
                Агент
              </Link>
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
            <section className="stage-v5-layout">
              <div className="stage-v5-main-column">
                <article className="stage-v5-card">
                  <header className="stage-v5-card-head">
                    <h3>Направления</h3>
                  </header>
                  <div className="flat-directions-body">
                    {directions.length === 0 ? (
                      <span className="flat-directions-empty">Пока нет направлений</span>
                    ) : (
                      <div className="flat-directions-chips">
                        {directions.map((direction) => (
                          <span key={direction.id} className="flat-directions-chip">
                            {direction.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flat-directions-add">
                      <input
                        value={newDirectionName}
                        placeholder="Добавить направление"
                        onChange={(event) => setNewDirectionName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void onAddFlatDirection();
                          }
                        }}
                      />
                      <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => void onAddFlatDirection()}>
                        + Направление
                      </button>
                    </div>
                  </div>
                </article>

                <article className="stage-v5-card">
                  <header className="stage-v5-card-head">
                    <h3>Задачи</h3>
                    <div className="stage-v5-card-head-links" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div className="vsp-pill-toggle">
                        <button
                          className={`vsp-pill-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5h10M2 7h10M2 10.5h10" strokeLinecap="round"/></svg>
                          List
                        </button>
                        <button
                          className={`vsp-pill-btn ${viewMode === 'board' ? 'active' : ''}`}
                          onClick={() => setViewMode('board')}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="3.5" height="10" rx="1"/><rect x="5.25" y="2" width="3.5" height="7" rx="1"/><rect x="9.5" y="2" width="3.5" height="10" rx="1"/></svg>
                          Board
                        </button>
                      </div>
                      <div className="vsp-trigger-wrap">
                        <button className="vsp-trigger" onClick={() => setViewPanelOpen((p) => !p)} title="Настройки отображения">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h4M10 4h4M2 8h8M12 8h2M2 12h2M6 12h8" strokeLinecap="round"/><circle cx="8" cy="4" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                        </button>
                        <ViewSettingsPanel
                          open={viewPanelOpen}
                          onClose={() => setViewPanelOpen(false)}
                          grouping={grouping}
                          onGroupingChange={setGrouping}
                          ordering={ordering}
                          onOrderingChange={setOrdering}
                          showEmptyGroups={showEmptyGroups}
                          onShowEmptyGroupsChange={setShowEmptyGroups}
                          visibleColumns={visibleCols}
                          onVisibleColumnsChange={setVisibleCols}
                          priorityFilter={priorityFilter}
                          onPriorityFilterChange={setPriorityFilter}
                        />
                      </div>
                    </div>
                  </header>

                  {flatLoading && flatTasks.length === 0 ? (
                    <div className="gtl-skel-group" aria-busy="true" aria-label="Загрузка задач">
                      {Array.from({ length: 2 }, (_, g) => (
                        <div key={g}>
                          <div className="gtl-skel-head">
                            <Skeleton width={10} height={10} radius={999} />
                            <Skeleton width={90} height={12} />
                            <Skeleton width={24} height={12} />
                          </div>
                          {Array.from({ length: 4 }, (_, i) => (
                            <div className="gtl-skel-row" key={i}>
                              <Skeleton width={14} height={14} radius={4} />
                              <Skeleton width={`${50 + ((i * 13) % 35)}%`} height={12} />
                              <Skeleton width={60} height={12} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {flatError ? <p className="stage-v5-message error">{flatError.message}</p> : null}

                  {!flatLoading && !flatError && viewMode === 'board' ? (
                    <BoardView
                      tasks={filteredFlatTasks}
                      members={assignableMembers}
                      directions={directions}
                      onStatusChange={(taskId, status) => void onChangeFlatTaskStatus(taskId, status)}
                      onTaskTypeChange={(taskId, taskType) => void onChangeFlatTaskType(taskId, taskType)}
                      onAssigneeChange={(taskId, assigneeUserId) => void onAssignFlatTask(taskId, assigneeUserId)}
                      onDirectionsChange={(taskId, directionIds) => void onFlatDirectionsChange(taskId, directionIds)}
                      onPriorityChange={(taskId, priority) => void onFlatTaskPriorityChange(taskId, priority)}
                      onOpenTask={openFlatTaskDrawer}
                      onCreateTask={(title) => void onFlatCreateTaskFromList(title)}
                    />
                  ) : null}

                  {!flatLoading && !flatError && viewMode === 'list' ? (
                    <GroupedTaskList
                      tasks={filteredFlatTasks}
                      members={assignableMembers}
                      directions={directions}
                      showEmptyGroups={showEmptyGroups}
                      visibleColumns={visibleCols}
                      onStatusChange={(taskId, status) => void onChangeFlatTaskStatus(taskId, status)}
                      onTaskTypeChange={(taskId, taskType) => void onChangeFlatTaskType(taskId, taskType)}
                      onAssigneeChange={(taskId, assigneeUserId) => void onAssignFlatTask(taskId, assigneeUserId)}
                      onDirectionsChange={(taskId, directionIds) => void onFlatDirectionsChange(taskId, directionIds)}
                      onPriorityChange={(taskId, priority) => void onFlatTaskPriorityChange(taskId, priority)}
                      onOpenTask={openFlatTaskDrawer}
                      onDelete={(taskId) => void onDeleteFlatTask(taskId)}
                      onTitleSave={(taskId, title) => void onFlatTitleSaveFromList(taskId, title)}
                      onCreateTask={(title) => void onFlatCreateTaskFromList(title)}
                    />
                  ) : null}

                  {!flatLoading && !flatError && flatTasks.length > 0 && filteredFlatTasks.length === 0 ? (
                    <p className="stage-v5-message">По выбранным фильтрам задач нет.</p>
                  ) : null}
                </article>
              </div>
            </section>
          )}


          <ProjectReposPanel projectId={projectId} />
          <ProjectTelegramPanel projectId={projectId} />
          <WebhookEventsPanel projectId={projectId} />
        </div>
      </main>

      {isFlatWorkflow && activeFlatTaskId ? (() => {
        const openedTask = flatTasks.find((t) => t.id === activeFlatTaskId);
        if (!openedTask) return null;
        return (
          <TaskDetailsDrawer
            task={openedTask}
            members={assignableMembers}
            directions={directions}
            onClose={closeFlatTaskDrawer}
            onTitleSave={(taskId, title) => void onFlatTitleSaveFromList(taskId, title)}
            onDescriptionSave={(taskId, description) => void onFlatDescriptionSaveFromDrawer(taskId, description)}
            onStatusChange={(taskId, status) => void onChangeFlatTaskStatus(taskId, status)}
            onTypeChange={(taskId, taskType) => void onChangeFlatTaskType(taskId, taskType)}
            onAssigneeChange={(taskId, assigneeUserId) => void onAssignFlatTask(taskId, assigneeUserId)}
            onDirectionsChange={(taskId, directionIds) => void onFlatDirectionsChange(taskId, directionIds)}
            onPriorityChange={(taskId, priority) => void onFlatTaskPriorityChange(taskId, priority)}
            onDelete={(taskId) => {
              void onDeleteFlatTask(taskId);
              closeFlatTaskDrawer();
            }}
          />
        );
      })() : null}

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
