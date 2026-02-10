import { create } from 'zustand';
import {
  apiService,
  type CreateTaskPayload,
  type EditTaskTitlePayload,
  type UpdateStagePayload,
} from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { ApiError, Stage, Task } from '../types/models';

type StageState = {
  currentStage: Stage | null;
  tasks: Task[];
  loading: boolean;
  error: ApiError | null;
  fetchStage: (projectId: string, stageId: string) => Promise<void>;
  patchStage: (projectId: string, stageId: string, payload: UpdateStagePayload) => Promise<void>;
  requestReview: (projectId: string, stageId: string) => Promise<void>;
  fetchTasks: (projectId: string, stageId: string) => Promise<void>;
  createTask: (projectId: string, stageId: string, payload: CreateTaskPayload) => Promise<void>;
  toggleTask: (projectId: string, stageId: string, taskId: string) => Promise<void>;
  editTaskTitle: (
    projectId: string,
    stageId: string,
    taskId: string,
    payload: EditTaskTitlePayload,
  ) => Promise<void>;
  deleteTask: (projectId: string, stageId: string, taskId: string) => Promise<void>;
};

export const useStageStore = create<StageState>((set, get) => ({
  currentStage: null,
  tasks: [],
  loading: false,
  error: null,

  async fetchStage(projectId, stageId) {
    set({ loading: true, error: null });
    try {
      const currentStage = await apiService.getStage(projectId, stageId);
      set({ currentStage, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
    }
  },

  async patchStage(projectId, stageId, payload) {
    set({ loading: true, error: null });
    try {
      const currentStage = await apiService.patchStage(projectId, stageId, payload);
      set({ currentStage, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async requestReview(projectId, stageId) {
    set({ loading: true, error: null });
    try {
      await apiService.requestReview(projectId, stageId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async fetchTasks(projectId, stageId) {
    set({ loading: true, error: null });
    try {
      const tasks = await apiService.getTasks(projectId, stageId);
      set({ tasks, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
    }
  },

  async createTask(projectId, stageId, payload) {
    set({ loading: true, error: null });
    try {
      await apiService.createTask(projectId, stageId, payload);
      await get().fetchTasks(projectId, stageId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async toggleTask(projectId, stageId, taskId) {
    const previous = get().tasks;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );

    set({ tasks: optimistic, error: null });

    try {
      await apiService.toggleTask(projectId, stageId, taskId);
      await get().fetchTasks(projectId, stageId);
    } catch (error) {
      set({ tasks: previous, error: normalizeApiError(error) });
      throw error;
    }
  },

  async editTaskTitle(projectId, stageId, taskId, payload) {
    const previous = get().tasks;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, title: payload.title } : task,
    );

    set({ tasks: optimistic, error: null });

    try {
      await apiService.editTaskTitle(projectId, stageId, taskId, payload);
      await get().fetchTasks(projectId, stageId);
    } catch (error) {
      set({ tasks: previous, error: normalizeApiError(error) });
      throw error;
    }
  },

  async deleteTask(projectId, stageId, taskId) {
    const previous = get().tasks;
    const optimistic = previous.filter((task) => task.id !== taskId);
    set({ tasks: optimistic, error: null });

    try {
      await apiService.deleteTask(projectId, stageId, taskId);
      await get().fetchTasks(projectId, stageId);
    } catch (error) {
      set({ tasks: previous, error: normalizeApiError(error) });
      throw error;
    }
  },
}));
