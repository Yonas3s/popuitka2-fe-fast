import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../../lib/api/service';
import { normalizeApiError } from '../../lib/api/errors';
import { useProjectsStore } from '../../store/projects.store';
import { useStageStore } from '../../store/stage.store';
import { useAuthStore } from '../../store/auth.store';
import { useDuckStore } from '../../store/duck.store';
import { useUiStore } from '../../store/ui.store';
import { DuckFab } from './DuckFab';
import { DuckDialog } from './DuckDialog';
import type { DuckMood } from './PixelDuck';
import type { AgentRun, WorkflowType } from '../../types/models';

const ATTENTION_COOLDOWN_MS = 30_000;
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 48; // ~2 minutes total (research runs can take up to 90s)

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isTerminalStatus = (status: AgentRun['status']) =>
  status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'canceled';

const shouldHideForPath = (pathname: string) =>
  pathname === '/' ||
  pathname.startsWith('/signin') ||
  pathname.startsWith('/signup') ||
  pathname.startsWith('/forgot-password') ||
  pathname.startsWith('/verify-reset-code') ||
  pathname.startsWith('/reset-password') ||
  pathname.startsWith('/auth/callback') ||
  pathname.startsWith('/p/');

const resolveContextFromPath = (pathname: string) => {
  const stageMatch = pathname.match(/^\/projects\/([^/]+)\/stages\/([^/]+)/);
  if (stageMatch) {
    return {
      projectId: stageMatch[1],
      stageId: stageMatch[2],
    };
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  if (projectMatch) {
    return {
      projectId: projectMatch[1],
      stageId: null,
    };
  }

  return {
    projectId: null,
    stageId: null,
  };
};

const resolveCanCreateTasks = (
  workflowType: WorkflowType,
  teamId: string | undefined,
  raw: Record<string, unknown> | undefined,
  userId: string | undefined,
) => {
  if (workflowType === 'flat' && !teamId) {
    return true;
  }

  const ownerId =
    (typeof raw?.owner_id === 'string' && raw.owner_id) ||
    (typeof raw?.ownerId === 'string' && raw.ownerId) ||
    '';
  const myRole =
    (typeof raw?.myRole === 'string' && raw.myRole) ||
    (typeof raw?.my_role === 'string' && raw.my_role) ||
    (typeof raw?.role === 'string' && raw.role) ||
    '';

  if (myRole) {
    return myRole.toLowerCase() === 'owner';
  }

  if (teamId) {
    if (ownerId && userId) {
      return ownerId === userId;
    }
    return false;
  }

  if (ownerId && userId) {
    return ownerId === userId;
  }

  return true;
};

const buildAssistantResult = (run: AgentRun) => {
  if (run.status === 'failed') {
    return run.errorMessage || 'Запуск завершился с ошибкой.';
  }

  const lines: string[] = [];
  if (run.createTasks) {
    lines.push(`Создано задач: ${run.createdTasksCount ?? 0}`);
  }
  if (run.targetStageId) {
    lines.push(`Этап: ${run.targetStageId}`);
  }
  if (run.createdTasks.length > 0) {
    lines.push('');
    lines.push('Новые задачи:');
    lines.push(
      ...run.createdTasks.map((task) =>
        `${task.issueKey ? `[${task.issueKey.toUpperCase()}] ` : ''}${task.title}`,
      ),
    );
  }
  if (run.outputText) {
    lines.push('');
    lines.push(run.outputText);
  }
  if (lines.length === 0) {
    lines.push('Запуск завершен, но текстовый ответ пустой.');
  }
  return lines.join('\n');
};

export const DuckAssistant = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const currentProject = useProjectsStore((state) => state.currentProject);
  const stages = useProjectsStore((state) => state.stages);
  const currentStage = useStageStore((state) => state.currentStage);
  const pushToast = useUiStore((state) => state.pushToast);

  const isOpen = useDuckStore((state) => state.isOpen);
  const unreadCount = useDuckStore((state) => state.unreadCount);
  const isTyping = useDuckStore((state) => state.isTyping);
  const draft = useDuckStore((state) => state.draft);
  const model = useDuckStore((state) => state.model);
  const createTasks = useDuckStore((state) => state.createTasks);
  const taskLimit = useDuckStore((state) => state.taskLimit);
  const preferredStageId = useDuckStore((state) => state.preferredStageId);
  const messages = useDuckStore((state) => state.messages);
  const close = useDuckStore((state) => state.close);
  const toggle = useDuckStore((state) => state.toggle);
  const setTyping = useDuckStore((state) => state.setTyping);
  const setDraft = useDuckStore((state) => state.setDraft);
  const setModel = useDuckStore((state) => state.setModel);
  const setCreateTasks = useDuckStore((state) => state.setCreateTasks);
  const setTaskLimit = useDuckStore((state) => state.setTaskLimit);
  const setPreferredStageId = useDuckStore((state) => state.setPreferredStageId);
  const pushUserMessage = useDuckStore((state) => state.pushUserMessage);
  const pushAssistantMessage = useDuckStore((state) => state.pushAssistantMessage);
  const resetConversation = useDuckStore((state) => state.resetConversation);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const attentionRef = useRef(0);
  const mountedRef = useRef(true);
  const [attention, setAttention] = useState(false);
  const [flashMood, setFlashMood] = useState<DuckMood | null>(null);

  const effectiveMood: DuckMood = isTyping ? 'thinking' : flashMood ?? 'idle';

  const routeContext = useMemo(() => resolveContextFromPath(location.pathname), [location.pathname]);
  const workflowType: WorkflowType = currentProject?.workflowType || 'stages';
  const canCreateTasks = useMemo(
    () =>
      resolveCanCreateTasks(
        workflowType,
        currentProject?.teamId,
        (currentProject?.raw ?? undefined) as Record<string, unknown> | undefined,
        user?.id,
      ),
    [currentProject?.raw, currentProject?.teamId, user?.id, workflowType],
  );

  const stageOptions = useMemo(() => {
    if (stages.length > 0) {
      return stages.map((stage) => ({
        id: stage.id,
        label: stage.stageName,
      }));
    }
    if (currentStage) {
      return [{ id: currentStage.id, label: currentStage.stageName }];
    }
    return [];
  }, [currentStage, stages]);

  const resolvedStageId = useMemo(() => {
    if (workflowType !== 'stages') {
      return null;
    }
    if (routeContext.stageId) {
      return routeContext.stageId;
    }
    if (preferredStageId && stageOptions.some((stage) => stage.id === preferredStageId)) {
      return preferredStageId;
    }
    return stageOptions[0]?.id || null;
  }, [preferredStageId, routeContext.stageId, stageOptions, workflowType]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
  }, [isOpen]);

  useEffect(() => {
    if (!isAuthenticated || shouldHideForPath(location.pathname)) {
      close();
    }
  }, [close, isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!canCreateTasks && createTasks) {
      setCreateTasks(false);
    }
  }, [canCreateTasks, createTasks, setCreateTasks]);

  useEffect(() => {
    if (workflowType !== 'stages') {
      setPreferredStageId(null);
      return;
    }

    if (routeContext.stageId) {
      setPreferredStageId(routeContext.stageId);
      return;
    }

    if (preferredStageId && stageOptions.some((item) => item.id === preferredStageId)) {
      return;
    }

    setPreferredStageId(stageOptions[0]?.id || null);
  }, [preferredStageId, routeContext.stageId, setPreferredStageId, stageOptions, workflowType]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, isOpen, toggle]);

  useEffect(() => {
    if (unreadCount <= 0) {
      return;
    }
    const now = Date.now();
    if (now - attentionRef.current < ATTENTION_COOLDOWN_MS) {
      return;
    }
    attentionRef.current = now;
    setAttention(true);
    const timeoutId = window.setTimeout(() => {
      setAttention(false);
    }, 1200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [unreadCount]);

  const waitForRunCompletion = useCallback(
    async (projectId: string, runId: string): Promise<{ run: AgentRun; timedOut: boolean }> => {
      let latest = await apiService.getAgentRun(projectId, runId);
      if (isTerminalStatus(latest.status)) {
        return { run: latest, timedOut: false };
      }

      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
        await sleep(POLL_INTERVAL_MS);
        latest = await apiService.getAgentRun(projectId, runId);
        if (isTerminalStatus(latest.status)) {
          return { run: latest, timedOut: false };
        }
      }

      return { run: latest, timedOut: true };
    },
    [],
  );

  const sendPrompt = useCallback(
    async (rawPrompt: string, options?: { forceCreateTasks?: boolean }) => {
      const prompt = rawPrompt.trim();
      if (!prompt) {
        return;
      }

      pushUserMessage(prompt);
      setDraft('');
      setTyping(true);

      try {
        if (!routeContext.projectId) {
          pushAssistantMessage('Открой страницу проекта или этапа, и я запущу агента с контекстом.');
          return;
        }

        const shouldCreateTasks = (options?.forceCreateTasks ?? createTasks) && canCreateTasks;
        if ((options?.forceCreateTasks ?? createTasks) && !canCreateTasks) {
          pushAssistantMessage('Автосоздание задач доступно только владельцу проекта.');
          pushToast('Автосоздание задач доступно только owner', 'error');
          return;
        }

        const trimmedModel = model.trim();
        const run = await apiService.createAgentRun(routeContext.projectId, {
          prompt,
          // Empty model → backend picks the default for its active provider
          // (e.g. llama-3.3-70b-versatile on Groq). Avoids leaking stale
          // client-side defaults from older builds.
          ...(trimmedModel ? { model: trimmedModel } : {}),
          create_tasks: shouldCreateTasks,
          task_limit: Math.min(20, Math.max(1, taskLimit)),
          stage_id:
            shouldCreateTasks && workflowType === 'stages' && resolvedStageId ? resolvedStageId : undefined,
        });

        const { run: completedRun, timedOut } = await waitForRunCompletion(
          routeContext.projectId,
          run.id,
        );

        if (timedOut && !isTerminalStatus(completedRun.status)) {
          pushAssistantMessage(
            'Запуск занимает дольше обычного. Я продолжу его в фоне — обнови страницу через минуту или открой историю запусков.',
          );
          setFlashMood('error');
          window.setTimeout(() => {
            if (mountedRef.current) setFlashMood(null);
          }, 2000);
          return;
        }

        pushAssistantMessage(buildAssistantResult(completedRun));

        const resultMood: DuckMood = completedRun.status === 'failed' ? 'error' : 'success';
        setFlashMood(resultMood);
        window.setTimeout(() => {
          if (mountedRef.current) setFlashMood(null);
        }, 2000);
      } catch (reason) {
        const normalized = normalizeApiError(reason);
        if (normalized.status === 403) {
          pushAssistantMessage('Недостаточно прав для автосоздания задач. Нужна роль owner.');
          pushToast('Недостаточно прав: только owner может create_tasks', 'error');
          return;
        }
        pushAssistantMessage(normalized.message || 'Не удалось выполнить запуск агента.');
        setFlashMood('error');
        window.setTimeout(() => {
          if (mountedRef.current) setFlashMood(null);
        }, 2000);
      } finally {
        if (mountedRef.current) {
          setTyping(false);
        }
      }
    },
    [
      canCreateTasks,
      createTasks,
      model,
      pushAssistantMessage,
      pushToast,
      pushUserMessage,
      resolvedStageId,
      routeContext.projectId,
      setDraft,
      setTyping,
      taskLimit,
      waitForRunCompletion,
      workflowType,
    ],
  );

  const quickActions = useMemo(
    () => [
      {
        id: 'breakdown',
        label: 'Разбить на задачи',
        onClick: () => {
          void sendPrompt(
            'Разбей текущий контекст на конкретные задачи: короткий title, понятный scope, без дубликатов.',
            { forceCreateTasks: true },
          );
        },
      },
      {
        id: 'summary',
        label: 'Суммировать этап',
        onClick: () => {
          void sendPrompt('Сделай короткую сводку текущего состояния и ближайших шагов.');
        },
      },
      {
        id: 'risks',
        label: 'Проверить риски',
        onClick: () => {
          void sendPrompt('Проведи риск-анализ и дай топ-5 блокеров с mitigation шагами.');
        },
      },
    ],
    [sendPrompt],
  );

  if (!isAuthenticated || shouldHideForPath(location.pathname)) {
    return null;
  }

  return (
    <div className="duck-assistant-root" aria-live="polite">
      <DuckDialog
        open={isOpen}
        projectId={routeContext.projectId ?? undefined}
        projectName={currentProject?.projectName}
        stageId={resolvedStageId}
        stageName={
          resolvedStageId
            ? stages.find((s) => s.id === resolvedStageId)?.stageName
              ?? currentStage?.stageName
            : undefined
        }
        workflowType={workflowType}
        canCreateTasks={canCreateTasks}
        createTasks={createTasks}
        taskLimit={taskLimit}
        draft={draft}
        isTyping={isTyping}
        messages={messages}
        quickActions={quickActions}
        onClose={close}
        onSubmit={() => {
          void sendPrompt(draft);
        }}
        onDraftChange={setDraft}
        onCreateTasksChange={setCreateTasks}
        onTaskLimitChange={setTaskLimit}
        onResetConversation={resetConversation}
        inputRef={inputRef}
      />
      <DuckFab open={isOpen} unreadCount={unreadCount} attention={attention} mood={effectiveMood} onToggle={toggle} />
    </div>
  );
};
