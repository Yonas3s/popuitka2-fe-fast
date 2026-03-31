import { create } from 'zustand';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { AgentRun, ApiError } from '../types/models';

type AgentState = {
  runs: AgentRun[];
  currentRunId: string | null;
  isPolling: boolean;
  prompt: string;
  loadingRuns: boolean;
  loadingCurrent: boolean;
  creatingRun: boolean;
  error: ApiError | null;
  setPrompt: (value: string) => void;
  setCurrentRunId: (runId: string | null) => void;
  fetchRuns: (projectId: string, limit?: number) => Promise<void>;
  createRun: (projectId: string) => Promise<void>;
  fetchRunById: (projectId: string, runId: string) => Promise<AgentRun | null>;
  startPolling: (projectId: string, runId?: string | null) => void;
  stopPolling: () => void;
  reset: () => void;
};

const isTerminalRunStatus = (status: AgentRun['status']) =>
  status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'canceled';

const sortRunsByDate = (runs: AgentRun[]): AgentRun[] => {
  const toTs = (value?: string) => {
    if (!value) {
      return 0;
    }
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  return [...runs].sort((left, right) => {
    const diff = toTs(right.createdAt) - toTs(left.createdAt);
    if (diff !== 0) {
      return diff;
    }
    return right.id.localeCompare(left.id);
  });
};

const upsertRun = (runs: AgentRun[], nextRun: AgentRun): AgentRun[] => {
  const index = runs.findIndex((item) => item.id === nextRun.id);
  if (index < 0) {
    return sortRunsByDate([nextRun, ...runs]);
  }

  const next = [...runs];
  next[index] = {
    ...next[index],
    ...nextRun,
  };
  return sortRunsByDate(next);
};

let pollTimer: number | null = null;

export const useAgentStore = create<AgentState>((set, get) => ({
  runs: [],
  currentRunId: null,
  isPolling: false,
  prompt: '',
  loadingRuns: false,
  loadingCurrent: false,
  creatingRun: false,
  error: null,

  setPrompt(value) {
    set({ prompt: value });
  },

  setCurrentRunId(runId) {
    set({ currentRunId: runId });
  },

  async fetchRuns(projectId, limit = 20) {
    set({ loadingRuns: true, error: null });
    try {
      const runs = sortRunsByDate(await apiService.getAgentRuns(projectId, limit));
      const currentRunId = get().currentRunId;
      const hasCurrent = currentRunId ? runs.some((run) => run.id === currentRunId) : false;
      const nextCurrentRunId = hasCurrent ? currentRunId : runs[0]?.id || null;
      set({
        runs,
        loadingRuns: false,
        currentRunId: nextCurrentRunId,
      });

      const selectedRun = runs.find((run) => run.id === nextCurrentRunId);
      if (selectedRun && !isTerminalRunStatus(selectedRun.status)) {
        get().startPolling(projectId, selectedRun.id);
      } else {
        get().stopPolling();
      }
    } catch (reason) {
      set({
        loadingRuns: false,
        error: normalizeApiError(reason),
      });
    }
  },

  async createRun(projectId) {
    const prompt = get().prompt.trim();
    if (!prompt) {
      throw new Error('Введите запрос для агента');
    }

    const tempRunId = `run-tmp-${Date.now()}`;
    const optimisticRun: AgentRun = {
      id: tempRunId,
      status: 'queued',
      prompt,
      createdAt: new Date().toISOString(),
      raw: {},
    };

    set((state) => ({
      creatingRun: true,
      error: null,
      runs: upsertRun(state.runs, optimisticRun),
      currentRunId: tempRunId,
    }));

    try {
      const createdRun = await apiService.createAgentRun(projectId, { prompt });
      set((state) => {
        const withoutTemp = state.runs.filter((item) => item.id !== tempRunId);
        return {
          creatingRun: false,
          prompt: '',
          runs: upsertRun(withoutTemp, createdRun),
          currentRunId: createdRun.id,
        };
      });

      if (!isTerminalRunStatus(createdRun.status)) {
        get().startPolling(projectId, createdRun.id);
      } else {
        get().stopPolling();
      }
    } catch (reason) {
      set((state) => ({
        creatingRun: false,
        runs: state.runs.filter((item) => item.id !== tempRunId),
        currentRunId: state.currentRunId === tempRunId ? null : state.currentRunId,
        error: normalizeApiError(reason),
      }));
      throw reason;
    }
  },

  async fetchRunById(projectId, runId) {
    set({ loadingCurrent: true });
    try {
      const run = await apiService.getAgentRun(projectId, runId);
      set((state) => ({
        loadingCurrent: false,
        error: null,
        runs: upsertRun(state.runs, run),
      }));
      return run;
    } catch (reason) {
      set({
        loadingCurrent: false,
        error: normalizeApiError(reason),
      });
      return null;
    }
  },

  startPolling(projectId, runId) {
    const targetRunId = runId ?? get().currentRunId;
    if (!targetRunId) {
      return;
    }

    get().stopPolling();
    set({ isPolling: true, currentRunId: targetRunId });

    const tick = async () => {
      const current = await get().fetchRunById(projectId, targetRunId);
      if (!current || isTerminalRunStatus(current.status)) {
        get().stopPolling();
      }
    };

    void tick();
    pollTimer = window.setInterval(() => {
      void tick();
    }, 2500);
  },

  stopPolling() {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
    set({ isPolling: false });
  },

  reset() {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
    set({
      runs: [],
      currentRunId: null,
      isPolling: false,
      prompt: '',
      loadingRuns: false,
      loadingCurrent: false,
      creatingRun: false,
      error: null,
    });
  },
}));

