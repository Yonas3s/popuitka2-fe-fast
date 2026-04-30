import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { PublicSharePayload, Stage, Task, TaskStatus } from '../types/models';
import { useUiStore } from '../store/ui.store';
import { SEO } from '../components/seo/SEO';
import { TASK_TYPE_CFG } from '../components/tasks/TaskMetaMenu';

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

const groupTasks = (tasks: Task[]): { key: TaskStatus; items: Task[] }[] => {
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

const overallStatus = (data: PublicSharePayload): StageStatus => {
  if (data.approved) return 'completed';
  if (data.workflowType === 'flat') {
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

  const progress = useMemo(() => {
    if (!payload) return { done: 0, total: 0, percent: 0 };
    if (payload.workflowType === 'flat') {
      const total = payload.tasks.length;
      const done = payload.tasks.filter((t) => t.done || t.status === 'done').length;
      return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
    }
    const total = payload.stages.length;
    const done = payload.stages.filter((s) => s.status === 'completed').length;
    return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [payload]);

  return (
    <div className="pcp-page">
      <SEO
        title={payload ? `${projectName} — статус проекта` : 'Статус проекта'}
        description="Публичный обзор проекта для заказчика: прогресс по задачам и этапам."
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
                      {progress.done} из {progress.total} {payload.workflowType === 'flat' ? 'задач' : 'этапов'} готово
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
                  approved={Boolean(payload.approved)}
                  onApprove={onApprove}
                />
              ) : (
                <StagesSection
                  stages={payload.stages}
                  approved={Boolean(payload.approved)}
                  onApprove={onApprove}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="pcp-footer">
        <div className="pcp-container pcp-footer-row">
          <span>Сделано в unit-labs</span>
          <span className="pcp-footer-hint">
            Эта страница — публичный обзор без редактирования. Команда видит ваши действия в реальном времени.
          </span>
        </div>
      </footer>
    </div>
  );
};

/* ── Sections ──────────────────────────────────────────── */

const FlatTasksSection = ({
  tasks,
  approved,
  onApprove,
}: {
  tasks: Task[];
  approved: boolean;
  onApprove: () => void;
}) => {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const hasReview = tasks.some((t) => t.status === 'review');

  if (tasks.length === 0) {
    return (
      <section className="pcp-empty">
        <h2>Задач пока нет</h2>
        <p>Менеджер проекта добавит их в ближайшее время.</p>
      </section>
    );
  }

  return (
    <section className="pcp-section">
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

      {groups.map((group) => (
        <div key={group.key} className="pcp-group">
          <h2 className="pcp-group-title">
            <span className={`pcp-group-dot pcp-group-dot--${TASK_STATUS_TONE[group.key]}`} />
            {TASK_GROUP_TITLE[group.key]}
            <span className="pcp-group-count">{group.items.length}</span>
          </h2>
          <ul className="pcp-tasks">
            {group.items.map((t) => {
              const tp = TASK_TYPE_CFG[t.taskType] || TASK_TYPE_CFG.task;
              const issueKey = fmtIssueKey(t.issueKey);
              return (
                <li key={t.id} className={`pcp-task pcp-task--${TASK_STATUS_TONE[group.key]}`}>
                  <div className="pcp-task-main">
                    {issueKey && <span className="pcp-task-key">{issueKey}</span>}
                    <span className="pcp-task-title">{t.title}</span>
                  </div>
                  <span className="pcp-task-type" style={{ '--tc': tp.color } as React.CSSProperties}>
                    <span className="pcp-task-type-dot" />
                    {tp.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
};

const StagesSection = ({
  stages,
  approved,
  onApprove,
}: {
  stages: Stage[];
  approved: boolean;
  onApprove: () => void;
}) => {
  const sorted = useMemo(() => sortStages(stages), [stages]);

  if (sorted.length === 0) {
    return (
      <section className="pcp-empty">
        <h2>Этапы пока не созданы</h2>
        <p>Менеджер проекта добавит их в ближайшее время.</p>
      </section>
    );
  }

  return (
    <section className="pcp-section">
      <ul className="pcp-stages">
        {sorted.map((stage) => {
          const stageStatus: StageStatus = stage.status ?? 'unknown';
          const showApprove = stage.status === 'review' && !approved;
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
                <a href={stage.workLink} className="pcp-stage-link" target="_blank" rel="noreferrer">
                  Открыть результат →
                </a>
              )}
              {showApprove && (
                <button type="button" className="pcp-cta" onClick={onApprove}>
                  Принять этап
                </button>
              )}
              {approved && stage.status === 'completed' && (
                <p className="pcp-stage-approved">Подтверждено</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
