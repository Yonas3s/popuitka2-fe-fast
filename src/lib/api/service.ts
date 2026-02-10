import { apiClient } from './client';
import { endpoints } from './endpoints';
import {
  extractProject,
  extractProjects,
  extractPublicShare,
  extractShareLink,
  extractStage,
  extractStages,
  extractTasks,
  extractToken,
} from './schemas';
import type { Project, PublicSharePayload, ShareLinkResponse, Stage, Task } from '../../types/models';

export type SignUpPayload = {
  username: string;
  email: string;
  password: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type CreateProjectPayload = {
  project_name: string;
};

export type CreateStagePayload = {
  stage_name: string;
  description?: string;
};

export type UpdateStagePayload = {
  work_link?: string;
  description?: string;
};

export type CreateTaskPayload = {
  title: string;
};

export type EditTaskTitlePayload = {
  title: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyResetCodePayload = {
  email: string;
  code: string;
};

export type ResetPasswordPayload = {
  email: string;
  code: string;
  password: string;
};

export const apiService = {
  async health(): Promise<string> {
    const response = await apiClient.get(endpoints.health());
    return typeof response.data === 'string' ? response.data : 'ok';
  },

  async signup(payload: SignUpPayload): Promise<void> {
    await apiClient.post(endpoints.signup(), payload);
  },

  async signin(payload: SignInPayload): Promise<string> {
    const response = await apiClient.post(endpoints.signin(), payload);
    return extractToken(response.data);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiClient.post(endpoints.forgotPassword(), payload);
  },

  async verifyResetCode(payload: VerifyResetCodePayload): Promise<void> {
    await apiClient.post(endpoints.verifyResetCode(), payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post(endpoints.resetPassword(), payload);
  },

  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get(endpoints.projects());
    return extractProjects(response.data);
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const response = await apiClient.post(endpoints.projects(), payload);
    return extractProject(response.data);
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get(endpoints.projectById(projectId));
    return extractProject(response.data);
  },

  async getStages(projectId: string): Promise<Stage[]> {
    const response = await apiClient.get(endpoints.stages(projectId));
    return extractStages(response.data);
  },

  async createStage(projectId: string, payload: CreateStagePayload): Promise<Stage> {
    const response = await apiClient.post(endpoints.stages(projectId), payload);
    return extractStage(response.data);
  },

  async getStage(projectId: string, stageId: string): Promise<Stage> {
    const response = await apiClient.get(endpoints.stageById(projectId, stageId));
    return extractStage(response.data);
  },

  async patchStage(projectId: string, stageId: string, payload: UpdateStagePayload): Promise<Stage> {
    const response = await apiClient.patch(endpoints.stageById(projectId, stageId), payload);
    return extractStage(response.data);
  },

  async requestReview(projectId: string, stageId: string): Promise<void> {
    await apiClient.post(endpoints.requestReview(projectId, stageId));
  },

  async getTasks(projectId: string, stageId: string): Promise<Task[]> {
    const response = await apiClient.get(endpoints.tasks(projectId, stageId));
    return extractTasks(response.data);
  },

  async createTask(projectId: string, stageId: string, payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post(endpoints.tasks(projectId, stageId), payload);
    const list = extractTasks(response.data);
    if (list.length > 0) {
      return list[0];
    }

    return {
      id: `task-${Date.now()}`,
      title: payload.title,
      done: false,
      raw: {},
    };
  },

  async toggleTask(projectId: string, stageId: string, taskId: string): Promise<void> {
    await apiClient.patch(endpoints.toggleTask(projectId, stageId, taskId));
  },

  async editTaskTitle(
    projectId: string,
    stageId: string,
    taskId: string,
    payload: EditTaskTitlePayload,
  ): Promise<void> {
    await apiClient.patch(endpoints.editTaskTitle(projectId, stageId, taskId), payload);
  },

  async deleteTask(projectId: string, stageId: string, taskId: string): Promise<void> {
    await apiClient.delete(endpoints.deleteTask(projectId, stageId, taskId));
  },

  async createShareLink(projectId: string): Promise<ShareLinkResponse> {
    const response = await apiClient.post(endpoints.shareLink(projectId));
    const shareLink = extractShareLink(response.data);
    return {
      shareLink,
    };
  },

  async getPublicProject(shareToken: string): Promise<PublicSharePayload> {
    const response = await apiClient.get(endpoints.publicProject(shareToken));
    return extractPublicShare(response.data, shareToken);
  },

  async approvePublicProject(shareToken: string): Promise<void> {
    await apiClient.post(endpoints.approvePublicProject(shareToken));
  },
};
