import { useEffect, useMemo, useState } from 'react';
import { useAgentStore } from '../../store/agent.store';
import { useUiStore } from '../../store/ui.store';
import { normalizeApiError } from '../../lib/api/errors';
import type { AgentRun, WorkflowType } from '../../types/models';

type AgentRunsPanelProps = {
  projectId: string;
  compact?: boolean;
  workflowType: WorkflowType;
  stageOptions?: Array<{
    id: string;
    label: string;
  }>;
  defaultStageId?: string | null;
  canCreateTasks?: boolean;
};

const isTerminal = (status: AgentRun['status']) =>
  status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'canceled';

const statusLabel = (status: AgentRun['status']) => {
  if (status === 'queued') return 'В очереди';
  if (status === 'running') return 'Выполняется';
  if (status === 'completed') return 'Завершен';
  if (status === 'failed') return 'Ошибка';
  if (status === 'cancelled' || status === 'canceled') return 'Остановлен';
  return 'Неизвестно';
};

const statusClassName = (status: AgentRun['status']) => {
  if (status === 'completed') return 'is-completed';
  if (status === 'failed') return 'is-failed';
  if (status === 'running' || status === 'queued') return 'is-running';
  return '';
};

const formatTimestamp = (value?: string) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const AgentRunsPanel = ({
  projectId,
  compact = false,
  workflowType,
  stageOptions = [],
  defaultStageId = null,
  canCreateTasks = true,
}: AgentRunsPanelProps) => {
  const runs = useAgentStore((state) => state.runs);
  const currentRunId = useAgentStore((state) => state.currentRunId);
  const isPolling = useAgentStore((state) => state.isPolling);
  const prompt = useAgentStore((state) => state.prompt);
  const model = useAgentStore((state) => state.model);
  const createTasks = useAgentStore((state) => state.createTasks);
  const taskLimit = useAgentStore((state) => state.taskLimit);
  const stageId = useAgentStore((state) => state.stageId);
  const loadingRuns = useAgentStore((state) => state.loadingRuns);
  const loadingCurrent = useAgentStore((state) => state.loadingCurrent);
  const creatingRun = useAgentStore((state) => state.creatingRun);
  const error = useAgentStore((state) => state.error);
  const setPrompt = useAgentStore((state) => state.setPrompt);
  const setModel = useAgentStore((state) => state.setModel);
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

  const isStagesWorkflow = workflowType === 'stages';
  const createTasksEnabled = createTasks && canCreateTasks;

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void fetchRuns(projectId, 20);
    return () => {
      stopPolling();
    };
  }, [fetchRuns, projectId, stopPolling]);

  useEffect(() => {
    if (!isStagesWorkflow) {
      setStageId(null);
      return;
    }

    const hasCurrent = stageId ? stageOptions.some((stage) => stage.id === stageId) : false;
    if (hasCurrent) {
      return;
    }

    const fallback = defaultStageId || stageOptions[0]?.id || null;
    setStageId(fallback);
  }, [defaultStageId, isStagesWorkflow, setStageId, stageId, stageOptions]);

  useEffect(() => {
    if (!canCreateTasks && createTasks) {
      setCreateTasks(false);
    }
  }, [canCreateTasks, createTasks, setCreateTasks]);

  const onRun = async () => {
    const value = prompt.trim();
    if (!value) {
      pushToast('Введите запрос для агента', 'info');
      return;
    }

    if (createTasks && !canCreateTasks) {
      pushToast('Автосоздание задач доступно только владельцу проекта', 'error');
      return;
    }

    try {
      await createRun(projectId);
      pushToast('Запуск агента создан', 'success');
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      if (normalized.status === 403 && createTasksEnabled) {
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
    if (!currentRun) {
      return;
    }

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
    if (!currentRun?.outputText) {
      return;
    }

    setCopying(true);
    try {
      await navigator.clipboard.writeText(currentRun.outputText);
      pushToast('Результат скопирован', 'success');
    } catch {
      pushToast('Не удалось скопировать результат', 'error');
    } finally {
      setCopying(false);
    }
  };

  const runDisabled =
    creatingRun ||
    loadingRuns ||
    !prompt.trim() ||
    !model.trim() ||
    (isStagesWorkflow && createTasksEnabled && !stageId);

  return (
    <article className={`agent-v1-panel ${compact ? 'is-compact' : ''}`}>
      <header className="agent-v1-head">
        <h3>Агент</h3>
        <span className={`agent-v1-live ${isPolling ? 'is-polling' : ''}`}>
          {isPolling ? 'live' : 'idle'}
        </span>
      </header>

      <div className="agent-v1-run-form">
        <textarea
          value={prompt}
          rows={compact ? 2 : 3}
          placeholder="Что нужно сделать в проекте?"
          onChange={(event) => {
            setPrompt(event.target.value);
          }}
        />
        <div className="agent-v1-fields">
          <label>
            <span>Модель</span>
            <input
              value={model}
              placeholder="gemini-2.5-flash"
              onChange={(event) => {
                setModel(event.target.value);
              }}
            />
          </label>

          <label className={`agent-v1-toggle ${!canCreateTasks ? 'is-disabled' : ''}`}>
            <input
              type="checkbox"
              checked={createTasksEnabled}
              disabled={!canCreateTasks}
              onChange={(event) => {
                setCreateTasks(event.target.checked);
              }}
            />
            <span>Автосоздание задач</span>
          </label>

          <label>
            <span>Лимит задач</span>
            <input
              type="number"
              min={1}
              max={20}
              value={taskLimit}
              disabled={!createTasksEnabled}
              onChange={(event) => {
                setTaskLimit(Number(event.target.value));
              }}
            />
          </label>

          {isStagesWorkflow ? (
            <label>
              <span>Этап</span>
              <select
                value={stageId ?? ''}
                disabled={!createTasksEnabled || stageOptions.length === 0}
                onChange={(event) => {
                  setStageId(event.target.value || null);
                }}
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
        </div>
        <button type="button" className="project-v4-primary-btn" disabled={runDisabled} onClick={() => void onRun()}>
          {creatingRun ? 'Запускаем...' : 'Запустить'}
        </button>
      </div>

      {loadingRuns && runs.length === 0 ? (
        <p className="agent-v1-state">Загрузка запусков...</p>
      ) : null}

      {error && runs.length === 0 ? (
        <div className="agent-v1-state is-error">
          <p>{error.message}</p>
          <button type="button" onClick={() => void fetchRuns(projectId, 20)}>
            Повторить
          </button>
        </div>
      ) : null}

      <div className="agent-v1-layout">
        <div className="agent-v1-runs">
          <div className="agent-v1-runs-head">История запусков</div>
          {runs.length === 0 ? (
            <p className="agent-v1-empty">Запусков пока нет.</p>
          ) : (
            <ul>
              {runs.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    className={`agent-v1-run-item ${run.id === currentRunId ? 'is-active' : ''}`}
                    onClick={() => {
                      onSelectRun(run);
                    }}
                    >
                      <div>
                        <strong>{run.prompt || 'Без промпта'}</strong>
                        <small>{formatTimestamp(run.createdAt)}</small>
                        <small>
                          {run.createTasks ? `Создано задач: ${run.createdTasksCount ?? 0}` : 'Без автосоздания задач'}
                        </small>
                      </div>
                      <span className={`agent-v1-run-status ${statusClassName(run.status)}`}>
                        {statusLabel(run.status)}
                      </span>
                    </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="agent-v1-result">
          <div className="agent-v1-result-head">
            <h4>Результат</h4>
            <div className="agent-v1-result-actions">
              <button type="button" onClick={() => void onRefreshCurrent()} disabled={!currentRun || loadingCurrent}>
                {loadingCurrent ? 'Обновление...' : 'Обновить'}
              </button>
              <button
                type="button"
                onClick={() => void onCopyResult()}
                disabled={!currentRun?.outputText || copying}
              >
                {copying ? 'Копируем...' : 'Copy'}
              </button>
            </div>
          </div>

          {currentRun ? (
            <div className="agent-v1-run-meta">
              <span>model: {currentRun.model || '—'}</span>
              <span>target_stage_id: {currentRun.targetStageId || '—'}</span>
              <span>created_tasks_count: {currentRun.createdTasksCount ?? 0}</span>
            </div>
          ) : null}

          {!currentRun ? (
            <p className="agent-v1-empty">Выберите запуск из списка слева.</p>
          ) : currentRun.status === 'failed' ? (
            <div className="agent-v1-output is-error">
              <p>{currentRun.errorMessage || 'Запуск завершился с ошибкой.'}</p>
              <button
                type="button"
                onClick={() => {
                  startPolling(projectId, currentRun.id);
                }}
              >
                Повторить проверку
              </button>
            </div>
          ) : currentRun.status === 'running' || currentRun.status === 'queued' ? (
            <div className="agent-v1-output is-running">
              <p>{currentRun.status === 'queued' ? 'Запуск в очереди...' : 'Агент выполняет задачу...'}</p>
              {currentRun.outputText ? <pre>{currentRun.outputText}</pre> : null}
            </div>
          ) : (
            <div className="agent-v1-output">
              {currentRun.outputText ? (
                <pre>{currentRun.outputText}</pre>
              ) : (
                <p className="agent-v1-empty">Запуск завершен, но текстовый результат пустой.</p>
              )}
            </div>
          )}

          {currentRun && currentRun.createdTasks.length > 0 ? (
            <div className="agent-v1-created-tasks">
              <h5>Созданные задачи</h5>
              <ul>
                {currentRun.createdTasks.map((task, index) => (
                  <li key={`${task.id || 'task'}-${index}`}>
                    <span>{task.issueKey ? task.issueKey.toUpperCase() : '—'}</span>
                    <strong>{task.title}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
