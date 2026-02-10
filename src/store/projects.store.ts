import { create } from 'zustand';
import { apiService, type CreateProjectPayload, type CreateStagePayload } from '../lib/api/service';
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
  createProject: (payload: CreateProjectPayload) => Promise<void>;
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
      await apiService.createProject(payload);
      await get().fetchProjects();
      set({ loading: false });
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
