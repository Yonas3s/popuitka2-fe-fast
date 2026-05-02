import { create } from 'zustand';
import {
  apiService,
  type CreateProjectPayload,
  type CreateStagePayload,
  type UpdateProjectPayload,
} from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { ApiError, Project, Stage } from '../types/models';

type ProjectsState = {
  projects: Project[];
  currentProject: Project | null;
  stages: Stage[];
  loading: boolean;
  error: ApiError | null;
  shareLink: string;
  fetchProjects: () => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  patchProject: (projectId: string, payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  fetchStages: (projectId: string) => Promise<void>;
  createStage: (projectId: string, payload: CreateStagePayload) => Promise<void>;
  createShareLink: (projectId: string) => Promise<void>;
  clearError: () => void;
};

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  stages: [],
  loading: false,
  error: null,
  shareLink: '',

  async fetchProjects() {
    set({ loading: true, error: null });
    try {
      const projects = await apiService.getProjects();
      set({ projects, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
    }
  },

  async createProject(payload) {
    set({ loading: true, error: null });
    try {
      const created = await apiService.createProject(payload);
      // Refetch in the background so the projects list stays fresh without
      // blocking the navigate-into-project flow.
      void get().fetchProjects();
      set({ loading: false });
      return created;
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async patchProject(projectId, payload) {
    set({ loading: true, error: null });
    try {
      const updated = await apiService.patchProject(projectId, payload);
      set((state) => ({
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
        projects: state.projects.map((project) => (project.id === projectId ? updated : project)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async deleteProject(projectId) {
    set({ loading: true, error: null });
    try {
      await apiService.deleteProject(projectId);
      set((state) => ({
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        projects: state.projects.filter((project) => project.id !== projectId),
        stages: state.currentProject?.id === projectId ? [] : state.stages,
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async fetchProject(projectId) {
    set({ loading: true, error: null });
    try {
      const currentProject = await apiService.getProject(projectId);
      set({ currentProject, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
    }
  },

  async fetchStages(projectId) {
    set({ loading: true, error: null });
    try {
      const stages = await apiService.getStages(projectId);
      set({ stages, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
    }
  },

  async createStage(projectId, payload) {
    set({ loading: true, error: null });
    try {
      await apiService.createStage(projectId, payload);
      await get().fetchStages(projectId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  async createShareLink(projectId) {
    set({ loading: true, error: null });
    try {
      const response = await apiService.createShareLink(projectId);
      set({ shareLink: response.shareLink, loading: false });
    } catch (error) {
      set({ loading: false, error: normalizeApiError(error) });
      throw error;
    }
  },

  clearError() {
    set({ error: null });
  },
}));
