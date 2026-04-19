import { create } from 'zustand';
import {
  apiService,
  type AssignTaskPayload,
  type CreateTaskPayload,
  type EditTaskTitlePayload,
  type PatchTaskMetaPayload,
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
  assignTask: (
    projectId: string,
    stageId: string,
    taskId: string,
    payload: AssignTaskPayload,
  ) => Promise<void>;
  patchTaskMeta: (
    projectId: string,
    stageId: string,
    taskId: string,
    payload: PatchTaskMetaPayload,
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

  async assignTask(projectId, stageId, taskId, payload) {
    const previous = get().tasks;
    const nextAssignee = payload.user_id ?? payload.assignee_user_id ?? null;
    const optimistic = previous.map((task) =>
      task.id === taskId ? { ...task, assigneeUserId: nextAssignee || undefined } : task,
    );

    set({ tasks: optimistic, error: null });

    try {
      await apiService.assignTask(projectId, stageId, taskId, payload);
      await get().fetchTasks(projectId, stageId);
    } catch (error) {
      set({ tasks: previous, error: normalizeApiError(error) });
      throw error;
    }
  },

  async patchTaskMeta(projectId, stageId, taskId, payload) {
    const previous = get().tasks;
    const current = previous.find((task) => task.id === taskId);
    // Backend requires at least one of task_type / direction_ids / repository_id
    // on /meta; always include the current task_type so priority/description-only
    // patches don't 400.
    const safePayload: PatchTaskMetaPayload = {
      task_type: payload.task_type ?? current?.taskType,
      ...payload,
    };

    const optimistic = previous.map((task) =>
      task.id === taskId
        ? {
            ...task,
            taskType: payload.task_type ?? task.taskType,
            directionIds: payload.direction_ids ?? task.directionIds,
            description: payload.description ?? task.description,
            priority: payload.priority ?? task.priority,
          }
        : task,
    );

    set({ tasks: optimistic, error: null });

    try {
      await apiService.patchTaskMeta(projectId, stageId, taskId, safePayload);
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
