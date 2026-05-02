import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { extractTasks } from '../lib/api/schemas';
import type { PublicSharePayload, Stage, Task, TaskStatus } from '../types/models';
import { useUiStore } from '../store/ui.store';
import { SEO } from '../components/seo/SEO';
import { ExternalLinkPreviewCard } from '../components/links/ExternalLinkPreviewCard';
import { TASK_TYPE_CFG } from '../components/tasks/TaskMetaMenu';
import { PublicTaskDrawer } from '../components/tasks/PublicTaskDrawer';
import { SupportMailLink } from '../components/support/SupportMailLink';

type LoadStatus = 'idle' | 'loading' | 'error';
type StageStatus = NonNullable<Stage['status']> | 'unknown';

const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  active: 'в работе',
  waiting: 'ожидает старта',
  review: 'на проверке',
  completed: 'готово',
  unknown: '—',
};

const TASK_STATUS_TONE: Record<TaskStatus, 'pending' | 'active' | 'review' | 'done'> = {
  backlog: 'pending',
  todo: 'pending',
  in_progress: 'active',
  review: 'review',
  done: 'done',
};

const STAGE_PRIORITY: Record<StageStatus, number> = {
  review: 0,
  active: 1,
  waiting: 2,
  completed: 3,
  unknown: 4,
};

const fmtIssueKey = (value?: string) => (value ? value.toUpperCase() : '');

const sortStages = (stages: Stage[]): Stage[] =>
  [...stages].sort((a, b) => {
    const aS: StageStatus = a.status ?? 'unknown';
    const bS: StageStatus = b.status ?? 'unknown';
    return STAGE_PRIORITY[aS] - STAGE_PRIORITY[bS];
  });

// Group tasks by status, in a meaningful client-facing order:
// in_progress → review → todo/backlog → done
const TASK_GROUP_ORDER: TaskStatus[] = ['in_progress', 'review', 'todo', 'backlog', 'done'];
const TASK_GROUP_TITLE: Record<TaskStatus, string> = {
  in_progress: 'В работе',
  review: 'На проверке',
  todo: 'В очереди',
  backlog: 'Запланировано',
  done: 'Готово',
};

type TaskGroup = { key: TaskStatus; items: Task[] };

const groupTasks = (tasks: Task[]): TaskGroup[] => {
  const buckets = new Map<TaskStatus, Task[]>();
  for (const t of tasks) {
    const status = t.status ?? (t.done ? 'done' : 'todo');
    if (!buckets.has(status)) buckets.set(status, []);
    buckets.get(status)!.push(t);
  }
  return TASK_GROUP_ORDER
    .filter((s) => buckets.has(s))
    .map((s) => ({ key: s, items: buckets.get(s)! }));
};

const dedupeTasks = (tasks: Task[]): Task[] => {
  const map = new Map<string, Task>();
  tasks.forEach((task) => {
    map.set(task.id, task);
  });
  return Array.from(map.values());
};

const extractStageTasks = (stage: Stage): Task[] => {
  const nestedTasks = extractTasks(stage.raw);
  return nestedTasks.map((task) => ({
    ...task,
    stageId: task.stageId || stage.id,
  }));
};

const bucketStageTasks = (stages: Stage[], tasks: Task[]) => {
  const stageIds = new Set(stages.map((stage) => stage.id));
  const byStageId = new Map<string, Task[]>();
  const unmatched: Task[] = [];

  stages.forEach((stage) => {
    byStageId.set(stage.id, []);
  });

  tasks.forEach((task) => {
    if (task.stageId && stageIds.has(task.stageId)) {
      byStageId.set(task.stageId, [...(byStageId.get(task.stageId) || []), task]);
      return;
    }
    unmatched.push(task);
  });

  stages.forEach((stage) => {
    const merged = dedupeTasks([
      ...(byStageId.get(stage.id) || []),
      ...extractStageTasks(stage),
    ]);
    byStageId.set(stage.id, merged);
  });

  const assignedIds = new Set(
    Array.from(byStageId.values())
      .flat()
      .map((task) => task.id),
  );

  return {
    byStageId,
    unmatched: unmatched.filter((task) => !assignedIds.has(task.id)),
  };
};

const summarizeTaskGroups = (tasks: Task[]) =>
  groupTasks(tasks).map((group) => ({
    key: group.key,
    count: group.items.length,
  }));

const collectVisibleTasks = (data: PublicSharePayload): Task[] => {
  if (data.workflowType === 'flat' || data.stages.length === 0) {
    return dedupeTasks(data.tasks);
  }

  const sorted = sortStages(data.stages);
  const { byStageId, unmatched } = bucketStageTasks(sorted, data.tasks);

  return dedupeTasks([
    ...sorted.flatMap((stage) => byStageId.get(stage.id) || []),
    ...unmatched,
  ]);
};

const formatTaskCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} задача`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} задачи`;
  }
  return `${count} задач`;
};

const overallStatus = (data: PublicSharePayload): StageStatus => {
  if (data.approved) return 'completed';
  if (data.workflowType === 'flat' || data.stages.length === 0) {
    if (data.tasks.length === 0) return 'waiting';
    if (data.tasks.every((t) => t.done || t.status === 'done')) return 'completed';
    if (data.tasks.some((t) => t.status === 'review')) return 'review';
    if (data.tasks.some((t) => t.status === 'in_progress')) return 'active';
    return 'waiting';
  }
  if (data.stages.some((s) => s.status === 'review')) return 'review';
  if (data.stages.some((s) => s.status === 'active')) return 'active';
  if (data.stages.length > 0 && data.stages.every((s) => s.status === 'completed')) return 'completed';
  return 'waiting';
};

export const PublicClientPage = () => {
  const { shareToken = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [payload, setPayload] = useState<PublicSharePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pushToast = useUiStore((state) => state.pushToast);

  const loadPublicData = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await apiService.getPublicProject(shareToken);
      setPayload(response);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(normalizeApiError(error).message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!shareToken) {
      setStatus('error');
      setErrorMessage('Ссылка некорректная — обратитесь к менеджеру проекта.');
      return;
    }
    void loadPublicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const onApprove = async () => {
    try {
      await apiService.approvePublicProject(shareToken);
      pushToast('Спасибо! Этап подтверждён.', 'success');
      await loadPublicData();
    } catch (error) {
      pushToast(normalizeApiError(error).message, 'error');
    }
  };

  const projectName = payload?.project?.projectName || 'Проект';
  const progressUnitLabel =
    payload && (payload.workflowType === 'flat' || payload.stages.length === 0)
      ? 'задач'
      : 'этапов';

  const progress = useMemo(() => {
    if (!payload) return { done: 0, total: 0, percent: 0 };
    if (payload.workflowType === 'flat' || payload.stages.length === 0) {
      const total = payload.tasks.length;
      const done = payload.tasks.filter((t) => t.done || t.status === 'done').length;
      return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
    }
    const total = payload.stages.length;
    const done = payload.stages.filter((s) => s.status === 'completed').length;
    return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [payload]);

  const visibleTasks = useMemo(() => (payload ? collectVisibleTasks(payload) : []), [payload]);
  const openedTaskId = searchParams.get('task');
  const openedTask = openedTaskId ? visibleTasks.find((task) => task.id === openedTaskId) ?? null : null;

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

  useEffect(() => {
    if (!payload || !openedTaskId || openedTask) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete('task');
    setSearchParams(next, { replace: true });
  }, [openedTask, openedTaskId, payload, searchParams, setSearchParams]);

  return (
    <>
      <div className="pcp-page">
        <SEO
          title={payload ? `${projectName} — статус проекта` : 'Статус проекта'}
          description="Публичный обзор проекта для заказчика: прогресс по задачам и этапам."
          canonicalPath={`/p/${shareToken}`}
          noindex
        />

        <header className="pcp-header">
          <div className="pcp-container pcp-header-row">
            <div className="pcp-brand">
              unit-labs<span>_</span>
            </div>
            <div className="pcp-by">
              обзор для заказчика
            </div>
          </div>
        </header>

        <main className="pcp-main">
          <div className="pcp-container">
            {status === 'loading' && (
              <div className="pcp-card pcp-loading">Загружаем проект…</div>
            )}

            {status === 'error' && (
              <div className="pcp-card pcp-error">
                <h2>Не удалось открыть проект</h2>
                <p>{errorMessage || 'Ссылка могла быть отозвана. Запросите новую у менеджера.'}</p>
              </div>
            )}

            {status === 'idle' && payload && (
              <>
                <section className="pcp-hero">
                  <p className="pcp-eyebrow">Проект</p>
                  <h1 className="pcp-title">{projectName}</h1>
                  <div className="pcp-hero-meta">
                    <span className={`pcp-pill pcp-pill--${overallStatus(payload)}`}>
                      <span className="pcp-pill-dot" />
                      {STAGE_STATUS_LABEL[overallStatus(payload)]}
                    </span>
                    {progress.total > 0 && (
                      <span className="pcp-progress-label">
                        {progress.done} из {progress.total} {progressUnitLabel} готово
                      </span>
                    )}
                    {payload.workflowType === 'stages' && payload.tasks.length > 0 && (
                      <span className="pcp-progress-label">
                        {formatTaskCount(payload.tasks.length)} в контуре
                      </span>
                    )}
                  </div>
                  {progress.total > 0 && (
                    <div className="pcp-progress-bar" aria-label={`Готово ${progress.percent}%`}>
                      <div className="pcp-progress-fill" style={{ width: `${progress.percent}%` }} />
                      <span className="pcp-progress-percent">{progress.percent}%</span>
                    </div>
                  )}
                </section>

                {payload.workflowType === 'flat' ? (
                  <FlatTasksSection
                    tasks={payload.tasks}
                    workLink={payload.project?.workLink}
                    approved={Boolean(payload.approved)}
                    onApprove={onApprove}
                    onOpenTask={openTaskDrawer}
                    activeTaskId={openedTaskId}
                  />
                ) : (
                  <StagesSection
                    stages={payload.stages}
                    tasks={payload.tasks}
                    approved={Boolean(payload.approved)}
                    onApprove={onApprove}
                    onOpenTask={openTaskDrawer}
                    activeTaskId={openedTaskId}
                  />
                )}
              </>
            )}
          </div>
        </main>

        <footer className="pcp-footer">
          <div className="pcp-container pcp-footer-row">
            <div className="pcp-footer-meta">
              <span>Сделано в unit-labs</span>
              <SupportMailLink>Помощь</SupportMailLink>
            </div>
            <span className="pcp-footer-hint">
              Эта страница — публичный обзор без редактирования. Команда видит ваши действия в реальном времени.
            </span>
          </div>
        </footer>
      </div>

      {openedTask && <PublicTaskDrawer task={openedTask} onClose={closeTaskDrawer} />}
    </>
  );
};

const TaskGroupsList = ({
  groups,
  compact = false,
  onOpenTask,
  activeTaskId,
}: {
  groups: TaskGroup[];
  compact?: boolean;
  onOpenTask: (taskId: string) => void;
  activeTaskId?: string | null;
}) => {
  return (
    <>
      {groups.map((group) => (
        <details key={group.key} className={`pcp-group ${compact ? 'pcp-group--compact' : ''}`}>
          <summary className="pcp-group-title pcp-group-summary">
            <span className={`pcp-group-dot pcp-group-dot--${TASK_STATUS_TONE[group.key]}`} />
            <span className="pcp-group-label">{TASK_GROUP_TITLE[group.key]}</span>
            <span className="pcp-group-count">{group.items.length}</span>
            <span className="pcp-group-toggle" aria-hidden="true">
              <svg className="pcp-group-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6.25 8 10l4-3.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <ul className="pcp-tasks">
            {group.items.map((t) => {
              const tp = TASK_TYPE_CFG[t.taskType] || TASK_TYPE_CFG.task;
              const issueKey = fmtIssueKey(t.issueKey);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`pcp-task pcp-task-button pcp-task--${TASK_STATUS_TONE[group.key]} ${compact ? 'pcp-task--compact' : ''} ${activeTaskId === t.id ? 'pcp-task--active' : ''}`}
                    onClick={() => onOpenTask(t.id)}
                  >
                    <div className="pcp-task-main">
                      {issueKey && <span className="pcp-task-key">{issueKey}</span>}
                      <span className="pcp-task-title">{t.title}</span>
                    </div>
                    <div className="pcp-task-side">
                      <span className="pcp-task-type" style={{ '--tc': tp.color } as CSSProperties}>
                        <span className="pcp-task-type-dot" />
                        {tp.label}
                      </span>
                    </div>
                    <span className="pcp-task-open" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4.5 10 8l-4 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </>
  );
};

const DetachedTasksBlock = ({
  title,
  description,
  tasks,
  onOpenTask,
  activeTaskId,
}: {
  title: string;
  description: string;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  activeTaskId?: string | null;
}) => {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);

  return (
    <section className="pcp-stage-extra">
      <div className="pcp-stage-extra-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <TaskGroupsList groups={groups} compact onOpenTask={onOpenTask} activeTaskId={activeTaskId} />
    </section>
  );
};

/* ── Sections ──────────────────────────────────────────── */

const FlatTasksSection = ({
  tasks,
  workLink,
  approved,
  onApprove,
  onOpenTask,
  activeTaskId,
}: {
  tasks: Task[];
  workLink?: string;
  approved: boolean;
  onApprove: () => void;
  onOpenTask: (taskId: string) => void;
  activeTaskId?: string | null;
}) => {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const hasReview = tasks.some((t) => t.status === 'review');

  if (tasks.length === 0 && !workLink) {
    return (
      <section className="pcp-empty">
        <h2>Задач пока нет</h2>
        <p>Менеджер проекта добавит их в ближайшее время.</p>
      </section>
    );
  }

  return (
    <section className="pcp-section">
      {workLink ? (
        <div className="pcp-flat-result">
          <div className="pcp-flat-result-head">
            <span>Результат</span>
            <p>Ссылка, которую команда добавила для клиентского просмотра.</p>
          </div>
          <ExternalLinkPreviewCard url={workLink} />
        </div>
      ) : null}

      {hasReview && !approved && (
        <div className="pcp-callout">
          <div>
            <h3>Несколько задач ждут вашего подтверждения</h3>
            <p>Если всё устраивает — нажмите «Принять работу».</p>
          </div>
          <button type="button" className="pcp-cta" onClick={onApprove}>
            Принять работу
          </button>
        </div>
      )}

      {approved && (
        <div className="pcp-callout pcp-callout--approved">
          <div>
            <h3>Работа подтверждена</h3>
            <p>Спасибо! Команда видит ваше согласование.</p>
          </div>
        </div>
      )}

      {tasks.length > 0 ? (
        <TaskGroupsList groups={groups} onOpenTask={onOpenTask} activeTaskId={activeTaskId} />
      ) : (
        <section className="pcp-empty">
          <h2>Задач пока нет</h2>
          <p>Менеджер проекта добавит их в ближайшее время.</p>
        </section>
      )}
    </section>
  );
};

const StagesSection = ({
  stages,
  tasks,
  approved,
  onApprove,
  onOpenTask,
  activeTaskId,
}: {
  stages: Stage[];
  tasks: Task[];
  approved: boolean;
  onApprove: () => void;
  onOpenTask: (taskId: string) => void;
  activeTaskId?: string | null;
}) => {
  const sorted = useMemo(() => sortStages(stages), [stages]);
  const { byStageId, unmatched } = useMemo(
    () => bucketStageTasks(sorted, tasks),
    [sorted, tasks],
  );

  if (sorted.length === 0 && tasks.length === 0) {
    return (
      <section className="pcp-empty">
        <h2>Этапы пока не созданы</h2>
        <p>Менеджер проекта добавит их в ближайшее время.</p>
      </section>
    );
  }

  return (
    <section className="pcp-section">
      {sorted.length === 0 && tasks.length > 0 ? (
        <DetachedTasksBlock
          title="Задачи проекта"
          description="Этапы ещё не опубликованы, но задачи уже доступны в клиентском контуре."
          tasks={tasks}
          onOpenTask={onOpenTask}
          activeTaskId={activeTaskId}
        />
      ) : null}

      <ul className="pcp-stages">
        {sorted.map((stage) => {
          const stageStatus: StageStatus = stage.status ?? 'unknown';
          const showApprove = stage.status === 'review' && !approved;
          const stageTasks = byStageId.get(stage.id) || [];
          const taskSummary = summarizeTaskGroups(stageTasks);
          const groupedStageTasks = groupTasks(stageTasks);
          return (
            <li key={stage.id} className={`pcp-stage pcp-stage--${stageStatus}`}>
              <div className="pcp-stage-head">
                <h3 className="pcp-stage-title">{stage.stageName}</h3>
                <span className={`pcp-pill pcp-pill--${stageStatus}`}>
                  <span className="pcp-pill-dot" />
                  {STAGE_STATUS_LABEL[stageStatus]}
                </span>
              </div>
              {stage.description && <p className="pcp-stage-desc">{stage.description}</p>}
              {stage.workLink && (
                <ExternalLinkPreviewCard url={stage.workLink} />
              )}
              {showApprove && (
                <button type="button" className="pcp-cta" onClick={onApprove}>
                  Принять этап
                </button>
              )}
              {approved && stage.status === 'completed' && (
                <p className="pcp-stage-approved">Подтверждено</p>
              )}

              {stageTasks.length > 0 && (
                <>
                  <div className="pcp-stage-tasks-meta">
                    <span className="pcp-stage-tasks-count">{formatTaskCount(stageTasks.length)}</span>
                    <div className="pcp-stage-task-badges">
                      {taskSummary.map((item) => (
                        <span key={`${stage.id}-${item.key}`} className={`pcp-stage-task-badge pcp-stage-task-badge--${TASK_STATUS_TONE[item.key]}`}>
                          {TASK_GROUP_TITLE[item.key]} · {item.count}
                        </span>
                      ))}
                    </div>
                  </div>

                  <TaskGroupsList groups={groupedStageTasks} compact onOpenTask={onOpenTask} activeTaskId={activeTaskId} />
                </>
              )}
            </li>
          );
        })}
      </ul>

      {unmatched.length > 0 && (
        <DetachedTasksBlock
          title="Дополнительные задачи"
          description="Эти задачи пришли в ответе, но не были привязаны к конкретному этапу."
          tasks={unmatched}
          onOpenTask={onOpenTask}
          activeTaskId={activeTaskId}
        />
      )}
    </section>
  );
};
