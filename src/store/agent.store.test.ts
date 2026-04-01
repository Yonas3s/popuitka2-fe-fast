import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentStore } from './agent.store';
import { useAuthStore } from './auth.store';

describe('agent store', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'jwt-token', isAuthenticated: true });
    useAgentStore.getState().reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    useAgentStore.getState().stopPolling();
    useAgentStore.getState().reset();
    vi.useRealTimers();
  });

  it('keeps required contract and handles create -> poll -> completed/failed', async () => {
    const state = useAgentStore.getState();
    expect(Array.isArray(state.runs)).toBe(true);
    expect(state.currentRunId).toBeNull();
    expect(state.isPolling).toBe(false);
    expect(state.prompt).toBe('');
    expect(state.model).toBeTruthy();
    expect(state.createTasks).toBe(true);
    expect(state.taskLimit).toBe(7);
    expect(state.stageId).toBeNull();

    state.setPrompt('Собери summary по задачам');
    await state.createRun('p1');

    const firstRunId = useAgentStore.getState().currentRunId;
    expect(firstRunId).toBeTruthy();
    useAgentStore.getState().startPolling('p1', firstRunId);
    await vi.advanceTimersByTimeAsync(5500);

    const completedRun = useAgentStore.getState().runs.find((run) => run.id === firstRunId);
    expect(completedRun?.status).toBe('completed');
    expect(completedRun?.outputText).toBeTruthy();
    expect(useAgentStore.getState().isPolling).toBe(false);

    useAgentStore.getState().setPrompt('fail this run');
    await useAgentStore.getState().createRun('p1');

    const failedRunId = useAgentStore.getState().currentRunId;
    expect(failedRunId).toBeTruthy();
    useAgentStore.getState().startPolling('p1', failedRunId);
    await vi.advanceTimersByTimeAsync(5500);

    const failedRun = useAgentStore.getState().runs.find((run) => run.id === failedRunId);
    expect(failedRun?.status).toBe('failed');
    expect(failedRun?.errorMessage).toBeTruthy();
    expect(useAgentStore.getState().isPolling).toBe(false);
  });
});
