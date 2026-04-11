import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAgentStore } from '../store/agent.store';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { useAuthStore } from '../store/auth.store';
import { normalizeApiError } from '../lib/api/errors';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import type { AgentRun } from '../types/models';

const isTerminal = (status: AgentRun['status']) =>
  status === 'completed' ||
  status === 'failed' ||
  status === 'cancelled' ||
  status === 'canceled';

const STATUS_META: Record<AgentRun['status'], { label: string; className: string; icon: string }> = {
  queued: { label: 'В очереди', className: 'is-queued', icon: '●' },
  running: { label: 'Выполняется', className: 'is-running', icon: '●' },
  completed: { label: 'Готово', className: 'is-completed', icon: '✓' },
  failed: { label: 'Ошибка', className: 'is-failed', icon: '✕' },
  cancelled: { label: 'Отменён', className: 'is-cancelled', icon: '◯' },
  canceled: { label: 'Отменён', className: 'is-cancelled', icon: '◯' },
  unknown: { label: 'Неизвестно', className: 'is-cancelled', icon: '◯' },
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelative = (value?: string) => {
  if (!value) return '';
  const d = new Date(value).getTime();
  if (!Number.isFinite(d)) return '';
  const diffMs = Date.now() - d;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 45) return 'только что';
  if (diffSec < 90) return 'минуту назад';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 45) return `${diffMin} мин назад`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} дн назад`;
  return formatDate(value);
};

export const AgentPage = () => {
  const { projectId = '' } = useParams();
  const project = useProjectsStore((state) => state.currentProject);
  const stages = useProjectsStore((state) => state.stages);
  const fetchProject = useProjectsStore((state) => state.fetchProject);
  const fetchStages = useProjectsStore((state) => state.fetchStages);
  const user = useAuthStore((state) => state.user);

  const runs = useAgentStore((state) => state.runs);
  const currentRunId = useAgentStore((state) => state.currentRunId);
  const isPolling = useAgentStore((state) => state.isPolling);
  const prompt = useAgentStore((state) => state.prompt);
  const createTasks = useAgentStore((state) => state.createTasks);
  const taskLimit = useAgentStore((state) => state.taskLimit);
  const stageId = useAgentStore((state) => state.stageId);
  const loadingRuns = useAgentStore((state) => state.loadingRuns);
  const loadingCurrent = useAgentStore((state) => state.loadingCurrent);
  const creatingRun = useAgentStore((state) => state.creatingRun);
  const error = useAgentStore((state) => state.error);
  const setPrompt = useAgentStore((state) => state.setPrompt);
  const setCreateTasks = useAgentStore((state) => state.setCreateTasks);
  const setTaskLimit = useAgentStore((state) => state.setTaskLimit);
  const setStageId = useAgentStore((state) => state.setStageId);
  const setCurrentRunId = useAgentStore((state) => state.setCurrentRunId);
  const fetchRuns = useAgentStore((state) => state.fetchRuns);
  const createRun = useAgentStore((state) => state.createRun);
  const fetchRunById = useAgentStore((state) => state.fetchRunById);
  const startPolling = useAgentStore((state) => state.startPolling);
  const stopPolling = useAgentStore((state) => state.stopPolling);
  const pushToast = useUiStore((state) => state.pushToast);
  const [copying, setCopying] = useState(false);

  const currentRun = useMemo(
    () => runs.find((item) => item.id === currentRunId) || null,
    [runs, currentRunId],
  );

  const isStagesWorkflow = project?.workflowType === 'stages';
  const isProjectOwner = Boolean(
    user && project && (project.raw?.owner_id === user.id || project.raw?.ownerId === user.id),
  );
  // Backend enforces 403 for non-owners if create_tasks=true; we surface that hint
  // via the disabled state on the checkbox.
  const canCreateTasks = isProjectOwner;

  const stageOptions = useMemo(
    () => stages.map((stage) => ({ id: stage.id, label: stage.stageName })),
    [stages],
  );

  useEffect(() => {
    if (!projectId) return;
    void fetchProject(projectId);
  }, [fetchProject, projectId]);

  useEffect(() => {
    if (!projectId || !project) return;
    if (project.workflowType === 'stages') {
      void fetchStages(projectId);
    }
  }, [fetchStages, project, projectId]);

  useEffect(() => {
    if (!projectId) return;
    void fetchRuns(projectId, 20);
    return () => {
      stopPolling();
    };
  }, [fetchRuns, projectId, stopPolling]);

  useEffect(() => {
    if (!isStagesWorkflow) {
      if (stageId !== null) setStageId(null);
      return;
    }
    if (!stageOptions.length) return;
    const hasCurrent = stageId ? stageOptions.some((s) => s.id === stageId) : false;
    if (!hasCurrent) {
      setStageId(stageOptions[0].id);
    }
  }, [isStagesWorkflow, stageOptions, stageId, setStageId]);

  useEffect(() => {
    if (!canCreateTasks && createTasks) {
      setCreateTasks(false);
    }
  }, [canCreateTasks, createTasks, setCreateTasks]);

  const runDisabled =
    creatingRun ||
    !prompt.trim() ||
    (isStagesWorkflow && createTasks && canCreateTasks && !stageId);

  const onRun = async () => {
    const value = prompt.trim();
    if (!value) {
      pushToast('Введите запрос для агента', 'info');
      return;
    }
    try {
      await createRun(projectId);
      pushToast('Запуск отправлен', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (normalized.status === 403) {
        pushToast('Недостаточно прав для автосоздания задач', 'error');
        return;
      }
      pushToast(normalized.message || 'Не удалось запустить агента', 'error');
    }
  };

  const onSelectRun = (run: AgentRun) => {
    setCurrentRunId(run.id);
    if (isTerminal(run.status)) {
      stopPolling();
      return;
    }
    startPolling(projectId, run.id);
  };

  const onRefreshCurrent = async () => {
    if (!currentRun) return;
    const updated = await fetchRunById(projectId, currentRun.id);
    if (!updated) {
      pushToast('Не удалось обновить запуск', 'error');
      return;
    }
    if (!isTerminal(updated.status)) {
      startPolling(projectId, updated.id);
    }
  };

  const onCopyResult = async () => {
    if (!currentRun?.outputText) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(currentRun.outputText);
      pushToast('Результат скопирован', 'success');
    } catch {
      pushToast('Не удалось скопировать', 'error');
    } finally {
      setCopying(false);
    }
  };

  const currentStatusMeta = currentRun ? STATUS_META[currentRun.status] : null;

  return (
    <div className="project-v4-page">
      <WorkspaceHeader activeTab="projects" />

      <main className="project-v4-main">
        <div className="project-v4-grid-bg" />
        <div className="project-v4-container project-v4-content">
          {/* Breadcrumb */}
          <nav className="agent-v2-breadcrumb">
            <Link to="/projects">Проекты</Link>
            <span className="agent-v2-breadcrumb-sep">›</span>
            <Link to={`/projects/${projectId}`}>
              {project?.projectName || 'Проект'}
            </Link>
            <span className="agent-v2-breadcrumb-sep">›</span>
            <span className="agent-v2-breadcrumb-current">Агент</span>
          </nav>

          {/* Header */}
          <div className="project-v4-head">
            <div>
              <div className="project-v4-title-row">
                <h1>Агент</h1>
                <span className={`agent-v2-live-badge ${isPolling ? 'is-live' : ''}`}>
                  <span className="agent-v2-live-dot" />
                  {isPolling ? 'LIVE' : 'IDLE'}
                </span>
              </div>
              <p>
                Дайте агенту задачу в свободной форме — он проанализирует
                привязанные репозитории и предложит план или создаст подзадачи.
              </p>
            </div>
          </div>

          {/* Main layout: form+result on left, history on right */}
          <div className="agent-v2-layout">
            <div className="agent-v2-main">
              {/* ── Form card ── */}
              <section className="agent-v2-card">
                <header className="agent-v2-card-head">
                  <div>
                    <h2>Новый запуск</h2>
                    <p>Опишите что нужно сделать — текст, код, ссылки на задачи.</p>
                  </div>
                </header>

                <div className="agent-v2-form">
                  <textarea
                    className="agent-v2-prompt"
                    value={prompt}
                    rows={5}
                    placeholder="Например: проанализируй authController.js и предложи 3 задачи по улучшению безопасности"
                    onChange={(e) => setPrompt(e.target.value)}
                  />

                  <div className="agent-v2-form-row">
                    <label
                      className={`agent-v2-checkbox ${!canCreateTasks ? 'is-disabled' : ''}`}
                      title={
                        !canCreateTasks
                          ? 'Автосоздание задач доступно только владельцу проекта'
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={createTasks && canCreateTasks}
                        disabled={!canCreateTasks}
                        onChange={(e) => setCreateTasks(e.target.checked)}
                      />
                      <span className="agent-v2-checkbox-box" />
                      <span>Автоматически создать задачи</span>
                    </label>

                    <label className="agent-v2-field">
                      <span>Лимит</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={taskLimit}
                        disabled={!createTasks || !canCreateTasks}
                        onChange={(e) => setTaskLimit(Number(e.target.value))}
                      />
                    </label>

                    {isStagesWorkflow ? (
                      <label className="agent-v2-field">
                        <span>Этап</span>
                        <select
                          value={stageId ?? ''}
                          disabled={!createTasks || !canCreateTasks || stageOptions.length === 0}
                          onChange={(e) => setStageId(e.target.value || null)}
                        >
                          {stageOptions.length === 0 ? (
                            <option value="">Нет этапов</option>
                          ) : null}
                          {stageOptions.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <button
                      type="button"
                      className="agent-v2-run-btn"
                      disabled={runDisabled}
                      onClick={() => void onRun()}
                    >
                      {creatingRun ? (
                        <>
                          <span className="agent-v2-spinner" />
                          Отправляем
                        </>
                      ) : (
                        <>Запустить</>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              {/* ── Result card ── */}
              <section className="agent-v2-card">
                <header className="agent-v2-card-head">
                  <div>
                    <h2>Результат</h2>
                    {currentRun && currentStatusMeta ? (
                      <div className="agent-v2-result-meta">
                        <span className={`agent-v2-status-pill ${currentStatusMeta.className}`}>
                          <span className="agent-v2-status-icon">{currentStatusMeta.icon}</span>
                          {currentStatusMeta.label}
                        </span>
                        {currentRun.model ? (
                          <span className="agent-v2-meta-chip">
                            <span>модель</span>
                            {currentRun.model}
                          </span>
                        ) : null}
                        {currentRun.createTasks ? (
                          <span className="agent-v2-meta-chip">
                            <span>создано</span>
                            {currentRun.createdTasksCount ?? 0} / {currentRun.taskLimit ?? '—'}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p>Выберите запуск в списке справа или отправьте новый.</p>
                    )}
                  </div>
                  <div className="agent-v2-card-actions">
                    <button
                      type="button"
                      className="agent-v2-ghost-btn"
                      onClick={() => void onRefreshCurrent()}
                      disabled={!currentRun || loadingCurrent}
                    >
                      {loadingCurrent ? 'Обновление…' : 'Обновить'}
                    </button>
                    <button
                      type="button"
                      className="agent-v2-ghost-btn"
                      onClick={() => void onCopyResult()}
                      disabled={!currentRun?.outputText || copying}
                    >
                      {copying ? 'Копируем…' : 'Скопировать'}
                    </button>
                  </div>
                </header>

                {!currentRun ? (
                  <div className="agent-v2-empty">
                    <div className="agent-v2-empty-icon">◎</div>
                    <p>Выберите запуск из истории или отправьте новый запрос.</p>
                  </div>
                ) : currentRun.status === 'failed' ? (
                  <div className="agent-v2-alert">
                    <div className="agent-v2-alert-title">Запуск завершился с ошибкой</div>
                    <p>{currentRun.errorMessage || 'Описание ошибки отсутствует.'}</p>
                    <button
                      type="button"
                      className="agent-v2-ghost-btn"
                      onClick={() => startPolling(projectId, currentRun.id)}
                    >
                      Перепроверить статус
                    </button>
                  </div>
                ) : currentRun.status === 'queued' || currentRun.status === 'running' ? (
                  <div className="agent-v2-running">
                    <div className="agent-v2-running-head">
                      <span className="agent-v2-spinner" />
                      <span>
                        {currentRun.status === 'queued'
                          ? 'Запуск в очереди…'
                          : 'Агент анализирует проект…'}
                      </span>
                    </div>
                    {currentRun.outputText ? (
                      <pre className="agent-v2-output is-partial">{currentRun.outputText}</pre>
                    ) : (
                      <div className="agent-v2-skeleton">
                        <div className="agent-v2-skeleton-line" />
                        <div className="agent-v2-skeleton-line short" />
                        <div className="agent-v2-skeleton-line" />
                        <div className="agent-v2-skeleton-line" />
                        <div className="agent-v2-skeleton-line short" />
                      </div>
                    )}
                  </div>
                ) : currentRun.outputText ? (
                  <pre className="agent-v2-output">{currentRun.outputText}</pre>
                ) : (
                  <div className="agent-v2-empty">
                    <div className="agent-v2-empty-icon">○</div>
                    <p>Запуск завершён, но текстовый ответ пустой.</p>
                  </div>
                )}

                {currentRun && currentRun.createdTasks.length > 0 ? (
                  <div className="agent-v2-created-tasks">
                    <h3>Созданные задачи</h3>
                    <ul>
                      {currentRun.createdTasks.map((task, index) => {
                        const key = (task.issueKey || '').toUpperCase();
                        const href = key
                          ? `/projects/${projectId}${
                              currentRun.targetStageId
                                ? `/stages/${currentRun.targetStageId}`
                                : ''
                            }?task=${encodeURIComponent(key)}`
                          : null;
                        return (
                          <li key={`${task.id || 'task'}-${index}`}>
                            <span className="agent-v2-task-key">{key || '—'}</span>
                            {href ? (
                              <Link to={href} className="agent-v2-task-title">
                                {task.title}
                              </Link>
                            ) : (
                              <span className="agent-v2-task-title">{task.title}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>

            {/* ── History sidebar ── */}
            <aside className="agent-v2-sidebar">
              <header className="agent-v2-sidebar-head">
                <h2>История</h2>
                <span className="agent-v2-sidebar-count">{runs.length}</span>
              </header>

              {loadingRuns && runs.length === 0 ? (
                <div className="agent-v2-history-skel">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="agent-v2-history-skel-item">
                      <div className="agent-v2-skeleton-line" />
                      <div className="agent-v2-skeleton-line short" />
                    </div>
                  ))}
                </div>
              ) : error && runs.length === 0 ? (
                <div className="agent-v2-alert">
                  <p>{error.message}</p>
                  <button
                    type="button"
                    className="agent-v2-ghost-btn"
                    onClick={() => void fetchRuns(projectId, 20)}
                  >
                    Повторить
                  </button>
                </div>
              ) : runs.length === 0 ? (
                <div className="agent-v2-empty small">
                  <div className="agent-v2-empty-icon">◇</div>
                  <p>Запусков пока нет. Опишите задачу в форме — первый запуск появится здесь.</p>
                </div>
              ) : (
                <ul className="agent-v2-history">
                  {runs.map((run) => {
                    const meta = STATUS_META[run.status];
                    const active = run.id === currentRunId;
                    return (
                      <li key={run.id}>
                        <button
                          type="button"
                          className={`agent-v2-history-item ${active ? 'is-active' : ''}`}
                          onClick={() => onSelectRun(run)}
                        >
                          <div className="agent-v2-history-row">
                            <span className={`agent-v2-status-pill compact ${meta.className}`}>
                              <span className="agent-v2-status-icon">{meta.icon}</span>
                              {meta.label}
                            </span>
                            <span className="agent-v2-history-time">
                              {formatRelative(run.createdAt)}
                            </span>
                          </div>
                          <div className="agent-v2-history-prompt">
                            {run.prompt || 'Без описания'}
                          </div>
                          {run.createTasks ? (
                            <div className="agent-v2-history-foot">
                              задач: {run.createdTasksCount ?? 0}
                              {run.taskLimit ? ` / ${run.taskLimit}` : ''}
                            </div>
                          ) : (
                            <div className="agent-v2-history-foot muted">без автосоздания</div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};
