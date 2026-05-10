import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useProjectsStore } from '../store/projects.store';
import { useStageStore } from '../store/stage.store';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { parseSafeExternalUrl } from '../lib/security/safe-url';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { WorkspaceFooter } from '../components/layout/WorkspaceFooter';
import { GroupedTaskList } from '../components/tasks/GroupedTaskList';
import { BoardView } from '../components/tasks/BoardView';
import { TaskDetailsDrawer } from '../components/tasks/TaskDetailsDrawer';
import { ViewSettingsPanel, type ViewMode, type VisibleColumns } from '../components/tasks/ViewSettingsPanel';
import { Skeleton } from '../components/ui/Skeleton';
import { DirectionColorPicker } from '../components/directions/DirectionColorPicker';
import { SectionRail, type SectionRailItem } from '../components/navigation/SectionRail';
import type { DirectionTag, TaskPriority, TaskStatus, TaskType, TeamMember } from '../types/models';

type EditState = {
  [taskId: string]: string;
};

const statusToTab = (status?: string): 'draft' | 'progress' | 'review' | 'done' => {
  if (status === 'completed') {
    return 'done';
  }
  if (status === 'review') {
    return 'review';
  }
  if (status === 'active') {
    return 'progress';
  }
  return 'draft';
};

const stageStatusSteps = [
  { key: 'draft', label: 'Черновик', hint: 'План' },
  { key: 'progress', label: 'В работе', hint: 'Сборка' },
  { key: 'review', label: 'Ревью', hint: 'Проверка' },
  { key: 'done', label: 'Готово', hint: 'Релиз' },
] as const;

const taskTypeLabels: Record<TaskType, string> = {
  task: 'Задача',
  bug: 'Баг',
  feature: 'Фича',
  improvement: 'Улучшение',
  chore: 'Техдолг',
};

const formatIssueKey = (value?: string) => (value ? value.toUpperCase() : null);

export const StageDetailsPage = () => {
  const { projectId = '', stageId = '', stageSection = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const project = useProjectsStore((state) => state.currentProject);
  const fetchProject = useProjectsStore((state) => state.fetchProject);

  const currentStage = useStageStore((state) => state.currentStage);
  const tasks = useStageStore((state) => state.tasks);
  const loading = useStageStore((state) => state.loading);
  const error = useStageStore((state) => state.error);
  const fetchStage = useStageStore((state) => state.fetchStage);
  const patchStage = useStageStore((state) => state.patchStage);
  const requestReview = useStageStore((state) => state.requestReview);
  const fetchTasks = useStageStore((state) => state.fetchTasks);
  const createTask = useStageStore((state) => state.createTask);
  const toggleTask = useStageStore((state) => state.toggleTask);
  const editTaskTitle = useStageStore((state) => state.editTaskTitle);
  const assignTask = useStageStore((state) => state.assignTask);
  const patchTaskMeta = useStageStore((state) => state.patchTaskMeta);
  const deleteTask = useStageStore((state) => state.deleteTask);

  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [editValues, setEditValues] = useState<EditState>({});
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [stageNameDraft, setStageNameDraft] = useState('');
  const [contextDraft, setContextDraft] = useState('');
  const [workLinkDraft, setWorkLinkDraft] = useState('');
  const [savingContext, setSavingContext] = useState(false);
  const [deletingStage, setDeletingStage] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  const [stageSectionsOpen, setStageSectionsOpen] = useState(false);
  const [assignableMembers, setAssignableMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Task details drawer — URL-synced via ?task=<id>
  const openedTaskId = searchParams.get('task');
  const openedTask = openedTaskId ? tasks.find((t) => t.id === openedTaskId) ?? null : null;

  const openTaskDrawer = (taskId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('task', taskId);
    setSearchParams(next, { replace: false });
  };

  const closeTaskDrawer = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('task');
    setSearchParams(next, { replace: false });
  };

  // View settings
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<VisibleColumns>({
    id: true, status: true, assignee: true,
    priority: true, labels: true, created: true,
  });
  const [grouping, setGrouping] = useState<'status' | 'priority' | 'none'>('status');
  const [ordering, setOrdering] = useState<'priority' | 'created' | 'manual'>('priority');
  const [showEmptyGroups, setShowEmptyGroups] = useState(true);
  const [membersAccessDenied, setMembersAccessDenied] = useState(false);
  const [directions, setDirections] = useState<DirectionTag[]>([]);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | TaskType>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | string>('all');
  /** Multi-select priority filter. Empty set = no filter (show all). */
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [newDirectionName, setNewDirectionName] = useState('');
  const [activeTaskDetailsId, setActiveTaskDetailsId] = useState<string | null>(null);
  const [taskDescriptionEdits, setTaskDescriptionEdits] = useState<Record<string, string>>({});
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const consumedDeeplinkRef = useRef<string | null>(null);
  const quickTaskInputRef = useRef<HTMLInputElement | null>(null);
  const activeStageFilterCount = Number(taskTypeFilter !== 'all') + Number(directionFilter !== 'all');
  const activeViewFilterCount = activeStageFilterCount + priorityFilter.length;

  useEffect(() => {
    if (!projectId || !stageId) {
      return;
    }

    void fetchProject(projectId);
    void fetchStage(projectId, stageId);
    void fetchTasks(projectId, stageId);
  }, [fetchProject, fetchStage, fetchTasks, projectId, stageId]);

  // Single gate for all initial fetches on this page. Show skeleton until
  // project + stage + tasks + members + directions are all ready, so the
  // UI doesn't pop in piece-by-piece.
  const initialLoading =
    loading ||
    membersLoading ||
    directionsLoading ||
    !currentStage ||
    !project;

  useEffect(() => {
    setStageNameDraft(currentStage?.stageName ?? '');
    setContextDraft(currentStage?.description ?? '');
    setWorkLinkDraft(currentStage?.workLink ?? '');
  }, [currentStage?.description, currentStage?.stageName, currentStage?.workLink]);

  // Deeplink: ?task=POPU-86 opens, scrolls to and highlights the matching task.
  useEffect(() => {
    const rawKey = searchParams.get('task');
    if (!rawKey) {
      return;
    }
    if (tasks.length === 0) {
      return;
    }
    if (consumedDeeplinkRef.current === rawKey) {
      return;
    }

    const normalized = rawKey.toLowerCase();
    const target = tasks.find((task) => (task.issueKey || '').toLowerCase() === normalized);
    if (!target) {
      return;
    }

    consumedDeeplinkRef.current = rawKey;
    setActiveTaskDetailsId(target.id);
    setTaskDescriptionEdits((prev) =>
      prev[target.id] !== undefined
        ? prev
        : { ...prev, [target.id]: target.description ?? '' },
    );
    setHighlightedTaskId(target.id);

    // Delay scroll slightly so the inline editor can mount before measuring.
    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(`task-${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    const clearTimer = window.setTimeout(() => {
      setHighlightedTaskId((current) => (current === target.id ? null : current));
    }, 2400);

    // Drop the query param so reloading the page doesn't re-trigger.
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams, { replace: true });

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [searchParams, setSearchParams, tasks]);

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

  const stageTab = statusToTab(currentStage?.status);
  const stageStatusIndex = Math.max(
    0,
    stageStatusSteps.findIndex((step) => step.key === stageTab),
  );
  const stageStatusCurrent = stageStatusSteps[stageStatusIndex] ?? stageStatusSteps[0];

  const stageVersion = useMemo(() => {
    const raw = (currentStage?.raw ?? {}) as Record<string, unknown>;
    const value =
      (typeof raw.version === 'string' && raw.version) ||
      (typeof raw.release_version === 'string' && raw.release_version) ||
      (typeof raw.releaseVersion === 'string' && raw.releaseVersion) ||
      '';
    if (!value) {
      return 'v1.0.0';
    }
    return value.startsWith('v') ? value : `v${value}`;
  }, [currentStage?.raw]);

  const stageRawId = useMemo(() => {
    const raw = (currentStage?.raw ?? {}) as Record<string, unknown>;
    return (
      (typeof raw._id === 'string' && raw._id) ||
      (typeof raw.id === 'string' && raw.id) ||
      stageId ||
      'stage'
    );
  }, [currentStage?.raw, stageId]);

  const stageCreatedLabel = useMemo(() => {
    const raw = (currentStage?.raw ?? {}) as Record<string, unknown>;
    const value =
      (typeof raw.createdAt === 'string' && raw.createdAt) ||
      (typeof raw.created_at === 'string' && raw.created_at) ||
      '';
    if (!value) {
      return 'недавно';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'недавно';
    }
    const diffHours = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60)));
    if (diffHours < 24) {
      return `${diffHours} ч назад`;
    }
    return `${Math.floor(diffHours / 24)} дн назад`;
  }, [currentStage?.raw]);

  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const getTaskDoneTimestamp = (task: (typeof tasks)[number]) => {
    const raw = task.raw as Record<string, unknown>;
    const value =
      (typeof raw.done_at === 'string' && raw.done_at) ||
      (typeof raw.doneAt === 'string' && raw.doneAt) ||
      (typeof raw.updatedAt === 'string' && raw.updatedAt) ||
      (typeof raw.updated_at === 'string' && raw.updated_at) ||
      '';
    if (!value) {
      return 0;
    }
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  };
  const filteredTasks = useMemo(
    () =>
      tasks
        .map((task, index) => ({ task, index, doneAtTs: getTaskDoneTimestamp(task) }))
        .filter(({ task }) => {
          if (taskTypeFilter !== 'all' && task.taskType !== taskTypeFilter) {
            return false;
          }
          if (directionFilter !== 'all' && !task.directionIds.includes(directionFilter)) {
            return false;
          }
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
    [directionFilter, taskTypeFilter, priorityFilter, tasks],
  );
  const directionNameById = useMemo(
    () => Object.fromEntries(directions.map((direction) => [direction.id, direction.name])),
    [directions],
  );
  const memberNameById = useMemo(
    () => Object.fromEntries(assignableMembers.map((member) => [member.id, `@${member.username}`])),
    [assignableMembers],
  );
  const memberTelegramById = useMemo(
    () =>
      Object.fromEntries(
        assignableMembers
          .filter((m) => m.telegramUsername)
          .map((m) => [m.id, m.telegramUsername as string]),
      ),
    [assignableMembers],
  );

  const ensureStageRoute = () => {
    if (!projectId || !stageId) {
      pushToast('Неверный путь стадии', 'error');
      return false;
    }
    return true;
  };

  const onSaveContext = async () => {
    if (!ensureStageRoute()) {
      return;
    }

    const nextStageName = stageNameDraft.trim();
    if (!nextStageName) {
      pushToast('Введите название этапа', 'error');
      return;
    }

    const nextWorkLink = workLinkDraft.trim();
    const safeWorkLink = nextWorkLink ? parseSafeExternalUrl(nextWorkLink) : null;
    const normalizedWorkLink = safeWorkLink?.toString() ?? '';
    if (nextWorkLink && !safeWorkLink) {
      pushToast('Введите HTTPS-ссылку результата', 'error');
      return;
    }

    setSavingContext(true);
    try {
      await patchStage(projectId, stageId, {
        stage_name: nextStageName,
        description: contextDraft.trim(),
        work_link: normalizedWorkLink,
      });
      setWorkLinkDraft(normalizedWorkLink);
      pushToast('Этап обновлен', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setSavingContext(false);
    }
  };

  const onDeleteStage = () => {
    if (!ensureStageRoute() || deletingStage) {
      return;
    }

    openConfirm({
      title: 'Удалить этап?',
      description: 'Этап и все его задачи будут удалены без восстановления.',
      onConfirm: async () => {
        setDeletingStage(true);
        try {
          await apiService.deleteStage(projectId, stageId);
          pushToast('Этап удален', 'success');
          navigate(`/projects/${projectId}`);
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        } finally {
          setDeletingStage(false);
        }
      },
    });
  };

  const onPreviewBuild = () => {
    if (!workLinkDraft.trim()) {
      pushToast('Укажите ссылку для предпросмотра', 'info');
      return;
    }

    const safeWorkLink = parseSafeExternalUrl(workLinkDraft);
    if (!safeWorkLink) {
      pushToast('Неверная ссылка предпросмотра', 'error');
      return;
    }

    window.open(safeWorkLink.toString(), '_blank', 'noopener,noreferrer');
  };

  const submitReviewRequest = async () => {
    if (!ensureStageRoute()) {
      return;
    }

    if (currentStage?.status === 'completed') {
      pushToast('Стадия уже завершена', 'info');
      return;
    }

    setRequestingReview(true);
    try {
      await requestReview(projectId, stageId);
      await fetchStage(projectId, stageId);
      pushToast('Запрос на ревью отправлен', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setRequestingReview(false);
    }
  };

  const onRequestReview = () => {
    if (!ensureStageRoute()) {
      return;
    }

    if (currentStage?.status === 'completed') {
      pushToast('Стадия уже завершена', 'info');
      return;
    }

    openConfirm({
      title: 'Запросить ревью?',
      description: `Этап "${currentStage?.stageName || 'Этап'}" перейдет на проверку. Исполнители увидят, что работа готова к ревью.`,
      onConfirm: () => {
        void submitReviewRequest();
      },
    });
  };

  const onCreateTask = async () => {
    if (!ensureStageRoute()) {
      return;
    }

    const title = newTaskTitle.trim();
    if (!title) {
      return;
    }

    try {
      await createTask(projectId, stageId, { title });
      setNewTaskTitle('');
      pushToast('Задача добавлена', 'success');
      quickTaskInputRef.current?.focus();
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onToggleTask = async (taskId: string) => {
    if (!ensureStageRoute()) {
      return;
    }
    try {
      await toggleTask(projectId, stageId, taskId);
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onSaveTaskTitle = async (taskId: string) => {
    if (!ensureStageRoute()) {
      return;
    }

    const original = tasks.find((task) => task.id === taskId)?.title ?? '';
    const nextTitle = (editValues[taskId] ?? original).trim();
    if (!nextTitle || nextTitle === original) {
      return;
    }

    try {
      await editTaskTitle(projectId, stageId, taskId, { title: nextTitle });
      pushToast('Задача обновлена', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onSaveTaskDescription = async (taskId: string) => {
    if (!ensureStageRoute()) {
      return;
    }

    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const original = task.description ?? '';
    const nextDescription = (taskDescriptionEdits[taskId] ?? original).trim();
    if (nextDescription === original) {
      return;
    }

    try {
      await patchTaskMeta(projectId, stageId, taskId, {
        description: nextDescription,
      });
      setTaskDescriptionEdits((prev) => ({
        ...prev,
        [taskId]: nextDescription,
      }));
      pushToast('Описание задачи обновлено', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onDeleteTask = (taskId: string) => {
    if (!ensureStageRoute()) {
      return;
    }
    openConfirm({
      title: 'Удалить задачу?',
      description: 'Операция необратима.',
      onConfirm: async () => {
        try {
          await deleteTask(projectId, stageId, taskId);
          pushToast('Задача удалена', 'success');
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        }
      },
    });
  };

  const onChangeTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!ensureStageRoute()) return;
    const previous = tasks;
    // Optimistic: instantly move the task to the new status
    const optimistic = previous.map((t) =>
      t.id === taskId ? { ...t, status, done: status === 'done' } : t,
    );
    useStageStore.setState({ tasks: optimistic });
    try {
      await apiService.changeTaskStatus(projectId, stageId, taskId, status);
    } catch (reason) {
      useStageStore.setState({ tasks: previous });
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onAssignTask = async (taskId: string, assigneeUserId: string | null) => {
    if (!ensureStageRoute()) {
      return;
    }

    try {
      await assignTask(projectId, stageId, taskId, {
        user_id: assigneeUserId,
      });
      pushToast(assigneeUserId ? 'Исполнитель назначен' : 'Назначение снято', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onTaskTypeChange = async (taskId: string, taskType: TaskType) => {
    if (!ensureStageRoute()) {
      return;
    }

    try {
      await patchTaskMeta(projectId, stageId, taskId, {
        task_type: taskType,
      });
      pushToast('Тип задачи обновлен', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onTaskPriorityChange = async (taskId: string, priority: TaskPriority) => {
    if (!ensureStageRoute()) {
      return;
    }

    // Optimistic update — instantly reflect in list/board/drawer.
    const previous = tasks;
    useStageStore.setState({
      tasks: previous.map((t) => (t.id === taskId ? { ...t, priority } : t)),
    });

    try {
      await patchTaskMeta(projectId, stageId, taskId, { priority });
    } catch (reason) {
      useStageStore.setState({ tasks: previous });
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onToggleDirection = async (taskId: string, directionId: string) => {
    if (!ensureStageRoute()) {
      return;
    }

    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const nextDirectionIds = task.directionIds.includes(directionId)
      ? task.directionIds.filter((id) => id !== directionId)
      : [...task.directionIds, directionId];

    try {
      await patchTaskMeta(projectId, stageId, taskId, {
        direction_ids: nextDirectionIds,
      });
      pushToast('Направления обновлены', 'success');
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onAddDirection = async () => {
    if (!projectId) {
      return;
    }

    const name = newDirectionName.trim();
    if (!name) {
      pushToast('Введите название направления', 'info');
      return;
    }

    try {
      const created = await apiService.addDirection(projectId, { name });
      setDirections((prev) => {
        if (prev.some((direction) => direction.id === created.id)) {
          return prev;
        }
        return [...prev, created];
      });
      setNewDirectionName('');
      pushToast('Направление добавлено', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);

      // Backend may return 500 for duplicate/create race cases.
      if (normalized.status === 409 || normalized.status === 500) {
        try {
          const refreshed = await apiService.getDirections(projectId);
          setDirections(refreshed);

          const existing = refreshed.find(
            (direction) => direction.name.trim().toLowerCase() === name.toLowerCase(),
          );

          if (existing) {
            setNewDirectionName('');
            pushToast('Направление уже существует', 'info');
            return;
          }
        } catch {
          // no-op, show original backend error below
        }
      }

      if (normalized.status === 403) {
        pushToast('Нет доступа к направлениям проекта', 'error');
        return;
      }

      pushToast(normalized.message, 'error');
    }
  };

  const onChangeDirectionColor = async (directionId: string, paletteKey: string) => {
    if (!projectId) {
      return;
    }

    const previous = directions;
    setDirections((prev) =>
      prev.map((direction) => (direction.id === directionId ? { ...direction, color: paletteKey } : direction)),
    );

    try {
      const updated = await apiService.updateDirection(projectId, directionId, {
        color: paletteKey,
      });
      setDirections((prev) => prev.map((direction) => (direction.id === directionId ? updated : direction)));
    } catch (reason) {
      setDirections(previous);
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const stageStatusPill = useMemo(() => {
    if (currentStage?.status === 'completed') {
      return { label: 'Готово', className: 'stage-v5-pill done' };
    }
    if (currentStage?.status === 'review') {
      return { label: 'Ревью', className: 'stage-v5-pill review' };
    }
    if (currentStage?.status === 'active') {
      return { label: 'В работе', className: 'stage-v5-pill progress' };
    }
    return { label: 'Черновик', className: 'stage-v5-pill draft' };
  }, [currentStage?.status]);

  const canGoStage = Boolean(projectId && stageId);
  const stageSectionItems = useMemo<SectionRailItem[]>(
    () => [
      {
        id: 'tasks',
        label: 'Задачи',
        helper: 'Список и доска этапа',
        icon: 'tasks',
        action: 'page',
      },
      {
        id: 'settings',
        label: 'Настройки',
        helper: 'Контекст и активность',
        icon: 'settings',
        action: 'page',
      },
    ],
    [],
  );
  const activeStageSection = stageSectionItems.some((item) => item.id === stageSection) ? stageSection : 'tasks';

  const onSelectStageSection = useCallback(
    (item: SectionRailItem) => {
      setStageSectionsOpen(false);
      navigate(`/projects/${projectId}/stages/${stageId}/${item.id}`);
    },
    [navigate, projectId, stageId],
  );

  return (
    <div className="stage-v5-page">
      <WorkspaceHeader activeTab="projects" />

      <main className="stage-v5-main">
        <div className="stage-v5-shell project-v4-content">
          <SectionRail
            activeId={activeStageSection}
            ariaLabel="Разделы этапа"
            items={stageSectionItems}
            mobileOpen={stageSectionsOpen}
            sheetTitle="Разделы этапа"
            sheetSubtitle="Задачи отдельно, контекст и активность отдельно"
            onCloseMobile={() => setStageSectionsOpen(false)}
            onSelect={onSelectStageSection}
          />

          <div className="project-v4-content-stack">
        <section className="stage-v5-hero">
          <div className="stage-v5-hero-left">
            <div className="stage-v5-title-row">
              <span className="stage-v5-live-dot" />
              <h1>{currentStage?.stageName || 'Этап'}</h1>
              <span className="stage-v5-version">{stageVersion}</span>
            </div>
            <div className="stage-v5-meta">
              <span className="mono">ID: {stageRawId}</span>
              <span>Создано {stageCreatedLabel}</span>
              <span>Владелец: @{user?.username || 'владелец'}</span>
            </div>
          </div>

          <div className="stage-v5-hero-right">
            <button className="stage-v5-secondary-btn stage-v5-section-mobile-btn" type="button" onClick={() => setStageSectionsOpen(true)}>
              Разделы
            </button>
            <div className={`stage-v5-status-tabs stage-v5-status-tabs--${stageTab}`} aria-label="Статус этапа">
              <span className="stage-v5-status-orbit" aria-hidden="true" />
              <div className="stage-v5-status-current">
                <span>Статус этапа</span>
                <strong>{stageStatusCurrent.label}</strong>
              </div>
              <div className="stage-v5-status-path" role="list" aria-label="Прогресс этапа">
                <span className="stage-v5-status-rail" aria-hidden="true">
                  <span />
                </span>
                {stageStatusSteps.map((step, index) => (
                  <span
                    key={step.key}
                    className={[
                      'stage-v5-status-step',
                      stageTab === step.key ? 'active' : '',
                      index < stageStatusIndex ? 'complete' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="listitem"
                  >
                    <span className="stage-v5-status-step-mark" aria-hidden="true">
                      {index < stageStatusIndex ? '✓' : index + 1}
                    </span>
                    <span className="stage-v5-status-step-copy">
                      <span>{step.label}</span>
                      <small>{step.hint}</small>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <button className="stage-v5-secondary-btn" type="button" onClick={onPreviewBuild}>
              Предпросмотр
            </button>
            <button
              className="stage-v5-primary-btn"
              type="button"
              disabled={requestingReview || !canGoStage}
              onClick={onRequestReview}
            >
              {requestingReview ? 'Отправляем...' : 'Запросить ревью'}
            </button>
          </div>
        </section>

        <section className="stage-v5-layout">
          <div className="stage-v5-main-column">
            {activeStageSection === 'tasks' ? (
              <>
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
                    <button
                      className={`vsp-trigger ${activeViewFilterCount > 0 ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => setViewPanelOpen((p) => !p)}
                      title="Настройки отображения и фильтры"
                      aria-label="Настройки отображения и фильтры"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h4M10 4h4M2 8h8M12 8h2M2 12h2M6 12h8" strokeLinecap="round"/><circle cx="8" cy="4" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
                      {activeViewFilterCount > 0 ? <span className="vsp-trigger-badge">{activeViewFilterCount}</span> : null}
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
                      taskTypeFilter={taskTypeFilter}
                      onTaskTypeFilterChange={setTaskTypeFilter}
                      directionFilter={directionFilter}
                      onDirectionFilterChange={setDirectionFilter}
                      directions={directions}
                      directionsLoading={directionsLoading}
                      visibleCount={filteredTasks.length}
                    />
                  </div>
                </div>
              </header>

              {initialLoading ? (
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
              {error ? <p className="stage-v5-message error">{error.message}</p> : null}

              {!initialLoading && !error && viewMode === 'board' ? (
                <BoardView
                  tasks={filteredTasks}
                  members={assignableMembers}
                  directions={directions}
                  onStatusChange={(taskId, status) => void onChangeTaskStatus(taskId, status)}
                  onTaskTypeChange={(taskId, taskType) => void onTaskTypeChange(taskId, taskType)}
                  onAssigneeChange={(taskId, assigneeUserId) => void onAssignTask(taskId, assigneeUserId)}
                  onDirectionsChange={(taskId, directionIds) => {
                    const current = tasks.find((t) => t.id === taskId)?.directionIds ?? [];
                    const added = directionIds.filter((id) => !current.includes(id));
                    const removed = current.filter((id) => !directionIds.includes(id));
                    [...added, ...removed].forEach((id) => void onToggleDirection(taskId, id));
                  }}
                  onPriorityChange={(taskId, priority) => void onTaskPriorityChange(taskId, priority)}
                  onOpenTask={openTaskDrawer}
                  onCreateTask={(title) => {
                    void apiService
                      .createTask(projectId, stageId, { title })
                      .then(() => {
                        pushToast('Задача добавлена', 'success');
                        return fetchTasks(projectId, stageId);
                      })
                      .catch((reason) => {
                        pushToast(normalizeApiError(reason).message, 'error');
                      });
                  }}
                />
              ) : null}

              {!initialLoading && !error && viewMode === 'list' ? (
                <GroupedTaskList
                  tasks={filteredTasks}
                  members={assignableMembers}
                  directions={directions}
                  showEmptyGroups={showEmptyGroups}
                  visibleColumns={visibleCols}
                  onStatusChange={(taskId, status) => void onChangeTaskStatus(taskId, status)}
                  onTaskTypeChange={(taskId, taskType) => void onTaskTypeChange(taskId, taskType)}
                  onAssigneeChange={(taskId, assigneeUserId) => void onAssignTask(taskId, assigneeUserId)}
                  onDirectionsChange={(taskId, directionIds) => {
                    const current = tasks.find((t) => t.id === taskId)?.directionIds ?? [];
                    const added = directionIds.filter((id) => !current.includes(id));
                    const removed = current.filter((id) => !directionIds.includes(id));
                    [...added, ...removed].forEach((id) => void onToggleDirection(taskId, id));
                  }}
                  onPriorityChange={(taskId, priority) => void onTaskPriorityChange(taskId, priority)}
                  onOpenTask={openTaskDrawer}
                  onDelete={(taskId) => onDeleteTask(taskId)}
                  onTitleSave={(taskId, title) => {
                    void apiService
                      .editTaskTitle(projectId, stageId, taskId, { title })
                      .then(() => {
                        pushToast('Название обновлено', 'success');
                        return fetchTasks(projectId, stageId);
                      })
                      .catch((reason) => {
                        pushToast(normalizeApiError(reason).message, 'error');
                      });
                  }}
                  onCreateTask={(title) => {
                    void apiService
                      .createTask(projectId, stageId, { title })
                      .then(() => {
                        pushToast('Задача добавлена', 'success');
                        return fetchTasks(projectId, stageId);
                      })
                      .catch((reason) => {
                        pushToast(normalizeApiError(reason).message, 'error');
                      });
                  }}
                />
              ) : null}

              {/* Legacy task list removed — now using GroupedTaskList */}
              {false && <div className="stage-v5-task-list">
                {filteredTasks.map((task) => {
                  const value = editValues[task.id] ?? task.title;
                  const isHighlighted = highlightedTaskId === task.id;
                  return (
                    <div
                      className={`stage-v5-task-row ${task.done ? 'done' : ''}${isHighlighted ? ' deeplink-highlight' : ''}`}
                      key={task.id}
                      id={`task-${task.id}`}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {
                            void onToggleTask(task.id);
                          }}
                        />
                      </label>
                      <div className="stage-v5-task-main">
                        {task.issueKey ? <span className="stage-v5-task-issue-key">{formatIssueKey(task.issueKey)}</span> : null}
                        <input
                          value={value}
                          onChange={(event) => {
                            setEditValues((prev) => ({ ...prev, [task.id]: event.target.value }));
                          }}
                          onBlur={() => {
                            void onSaveTaskTitle(task.id);
                          }}
                        />
                        <div className="stage-v5-task-meta">
                          <span className={`stage-v5-task-type-pill ${task.taskType}`}>
                            {taskTypeLabels[task.taskType]}
                          </span>
                          {task.directionIds.length > 0 ? (
                            task.directionIds.map((directionId) => (
                              <span key={directionId} className="stage-v5-task-direction-pill">
                                {directionNameById[directionId] || directionId.slice(0, 6)}
                              </span>
                            ))
                          ) : (
                            <span className="stage-v5-task-assign-note">Без направления</span>
                          )}
                          <span className="stage-v5-task-assignee-pill">
                            {task.assigneeUserId ? memberNameById[task.assigneeUserId] || task.assigneeUserId : 'Без исполнителя'}
                            {task.assigneeUserId && memberTelegramById[task.assigneeUserId] ? (
                              <a
                                className="tg-assignee-link"
                                href={`https://t.me/${memberTelegramById[task.assigneeUserId]}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Telegram: @${memberTelegramById[task.assigneeUserId]}`}
                              >
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                                  <path d="M21.9 4.4 18.5 20c-.3 1.2-1 1.5-2 .9l-5.4-4-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.4 9.8-8.8c.4-.4-.1-.6-.6-.2L4.7 12.1l-5.2-1.6c-1.1-.4-1.2-1.1.2-1.7L20.5 2.8c1-.3 1.7.2 1.4 1.6Z"/>
                                </svg>
                              </a>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="stage-v5-task-meta-toggle"
                            onClick={() => {
                              setTaskDescriptionEdits((prev) =>
                                prev[task.id] !== undefined
                                  ? prev
                                  : {
                                      ...prev,
                                      [task.id]: task.description ?? '',
                                    },
                              );
                              setActiveTaskDetailsId((prev) => (prev === task.id ? null : task.id));
                            }}
                          >
                            Детали
                          </button>
                        </div>

                        {activeTaskDetailsId === task.id ? (
                          <div className="stage-v5-task-editor">
                            <label className="stage-v5-task-description">
                              <span>Описание</span>
                              <textarea
                                rows={3}
                                value={taskDescriptionEdits[task.id] ?? task.description ?? ''}
                                placeholder="Добавьте описание задачи"
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setTaskDescriptionEdits((prev) => ({
                                    ...prev,
                                    [task.id]: nextValue,
                                  }));
                                }}
                              />
                            </label>

                            <label className="stage-v5-task-type">
                              <span>Тип</span>
                              <select
                                value={task.taskType}
                                onChange={(event) => {
                                  void onTaskTypeChange(task.id, event.target.value as TaskType);
                                }}
                              >
                                <option value="task">Задача</option>
                                <option value="bug">Баг</option>
                                <option value="feature">Фича</option>
                                <option value="improvement">Улучшение</option>
                                <option value="chore">Техдолг</option>
                              </select>
                            </label>

                            {project?.teamId && !membersAccessDenied ? (
                              <label className="stage-v5-task-assign">
                                <span>Исполнитель</span>
                                <select
                                  value={task.assigneeUserId ?? ''}
                                  disabled={membersLoading}
                                  onChange={(event) => {
                                    void onAssignTask(task.id, event.target.value || null);
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
                            ) : project?.teamId ? (
                              <span className="stage-v5-task-assign-note">Исполнители недоступны (нет доступа к команде)</span>
                            ) : (
                              <span className="stage-v5-task-assign-note">Личный проект</span>
                            )}

                            <div className="stage-v5-task-directions">
                              {directions.length > 0 ? (
                                directions.map((direction) => {
                                  const active = task.directionIds.includes(direction.id);
                                  return (
                                    <button
                                      key={direction.id}
                                      type="button"
                                      className={active ? 'active' : ''}
                                      onClick={() => {
                                        void onToggleDirection(task.id, direction.id);
                                      }}
                                    >
                                      {direction.name}
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="stage-v5-task-assign-note">
                                  Нет направлений. Добавьте их в настройках этапа.
                                </span>
                              )}
                            </div>

                            <div className="stage-v5-task-editor-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  void onSaveTaskDescription(task.id);
                                }}
                              >
                                Сохранить описание
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="stage-v5-task-actions">
                        <button
                          type="button"
                          onClick={() => {
                            void onSaveTaskTitle(task.id);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTask(task.id);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!initialLoading && !error && tasks.length > 0 && filteredTasks.length === 0 ? (
                  <p className="stage-v5-message">По выбранным фильтрам задач нет.</p>
                ) : null}

                <div className="stage-v5-task-input-row">
                  <input
                    ref={quickTaskInputRef}
                    placeholder="+ Добавить новую задачу..."
                    value={newTaskTitle}
                    onChange={(event) => {
                      setNewTaskTitle(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void onCreateTask();
                      }
                    }}
                  />
                </div>
              </div>}
            </article>
              </>
            ) : null}

            {activeStageSection === 'settings' ? (
              <>
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
                      <DirectionColorPicker
                        key={direction.id}
                        directionId={direction.id}
                        name={direction.name}
                        color={direction.color}
                        onPickColor={(key) => onChangeDirectionColor(direction.id, key)}
                      />
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
                        void onAddDirection();
                      }
                    }}
                  />
                  <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => void onAddDirection()}>
                    + Направление
                  </button>
                </div>
              </div>
            </article>

            <article className="stage-v5-card">
              <header className="stage-v5-card-head">
                <h3>Контекст</h3>
                <div className="stage-v5-card-head-links">
                  <button
                    type="button"
                    className="stage-v5-delete-link"
                    onClick={onDeleteStage}
                    disabled={deletingStage}
                  >
                    {deletingStage ? 'Удаляем...' : 'Удалить'}
                  </button>
                  <button type="button" onClick={() => void onSaveContext()} disabled={savingContext}>
                    {savingContext ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                </div>
              </header>

              <div className="stage-v5-context-body">
                <label>Название этапа</label>
                <input
                  value={stageNameDraft}
                  onChange={(event) => {
                    setStageNameDraft(event.target.value);
                  }}
                  placeholder="MVP"
                />

                <label>Описание</label>
                <textarea
                  value={contextDraft}
                  onChange={(event) => {
                    setContextDraft(event.target.value);
                  }}
                  rows={6}
                />

                <label>Ссылка на результат / предпросмотр</label>
                <input
                  value={workLinkDraft}
                  onChange={(event) => {
                    setWorkLinkDraft(event.target.value);
                  }}
                  placeholder="https://..."
                />
              </div>
            </article>

            <article className="stage-v5-card">
              <header className="stage-v5-card-head">
                <h3>Системная активность</h3>
                <div className="stage-v5-card-head-links">
                  <button type="button">Фильтр</button>
                  <button type="button">Экспорт</button>
                </div>
              </header>

              <div className="stage-v5-log-list">
                <div className="stage-v5-log-row">
                  <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  <p>
                    <strong>@{user?.username || 'владелец'}</strong> обновил статус на{' '}
                    <span className={stageStatusPill.className}>{stageStatusPill.label.toUpperCase()}</span>
                  </p>
                </div>
                <div className="stage-v5-log-row">
                  <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  <p>
                    Системная проверка: <strong>выполнение задач {progress}%</strong>.
                  </p>
                </div>
                <div className="stage-v5-log-row">
                  <span>Ранее</span>
                  <p>
                    Этап загружен из <strong>{project?.projectName || 'проекта'}</strong>.
                  </p>
                </div>
              </div>
            </article>
              </>
            ) : null}
          </div>

        </section>
          </div>
        </div>
      </main>

      <WorkspaceFooter />

      {openedTask && (
        <TaskDetailsDrawer
          task={openedTask}
          members={assignableMembers}
          directions={directions}
          onClose={closeTaskDrawer}
          onTitleSave={(taskId, title) => {
            void editTaskTitle(projectId, stageId, taskId, { title })
              .catch((reason) => pushToast(normalizeApiError(reason).message, 'error'));
          }}
          onDescriptionSave={(taskId, description) => {
            void patchTaskMeta(projectId, stageId, taskId, { description })
              .catch((reason) => pushToast(normalizeApiError(reason).message, 'error'));
          }}
          onStatusChange={(taskId, status) => void onChangeTaskStatus(taskId, status)}
          onTypeChange={(taskId, taskType) => void onTaskTypeChange(taskId, taskType)}
          onAssigneeChange={(taskId, assigneeUserId) => void onAssignTask(taskId, assigneeUserId)}
          onDirectionsChange={(taskId, directionIds) => {
            const current = tasks.find((t) => t.id === taskId)?.directionIds ?? [];
            const added = directionIds.filter((id) => !current.includes(id));
            const removed = current.filter((id) => !directionIds.includes(id));
            [...added, ...removed].forEach((id) => void onToggleDirection(taskId, id));
          }}
          onPriorityChange={(taskId, priority) => void onTaskPriorityChange(taskId, priority)}
          onDelete={(taskId) => { closeTaskDrawer(); onDeleteTask(taskId); }}
        />
      )}
    </div>
  );
};
