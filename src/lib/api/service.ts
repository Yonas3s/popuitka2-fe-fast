import { apiClient } from './client';
import { endpoints } from './endpoints';
import {
  extractAdminActionLogs,
  extractProject,
  extractProjects,
  extractApiTokens,
  extractCreatedApiToken,
  extractPublicShare,
  extractShareLink,
  extractTeams,
  extractTeam,
  extractTeamInvitePreview,
  extractInviteUrl,
  extractTeamActiveInvites,
  extractTeamDetails,
  extractTeamMembers,
  extractTeamProjects,
  extractStage,
  extractStages,
  extractAdminStat,
  extractAuthProfile,
  extractTasks,
  extractToken,
} from './schemas';
import type {
  AdminActionAuthType,
  AdminActionLogsPayload,
  AdminActionSource,
  AdminStat,
  ApiToken,
  AuthProfile,
  CreatedApiToken,
  Project,
  PublicSharePayload,
  ShareLinkResponse,
  Stage,
  Task,
  Team,
  TeamActiveInvite,
  TeamDetails,
  TeamMember,
  TeamInvitePreview,
  TeamProjectsPayload,
  WorkflowType,
} from '../../types/models';

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
  team_id?: string;
  workflow_type?: WorkflowType;
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

export type AssignTaskPayload = {
  assignee_user_id?: string | null;
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

export type CreateTeamPayload = {
  name: string;
};

export type InviteToTeamPayload = {
  email: string;
};

export type CreateApiTokenPayload = {
  name: string;
  expires_at?: string;
};

export type GetAdminActionLogsParams = {
  source?: AdminActionSource;
  authType?: AdminActionAuthType;
  limit?: number;
};

export const apiService = {
  async health(): Promise<string> {
    const response = await apiClient.get(endpoints.health());
    return typeof response.data === 'string' ? response.data : 'ok';
  },

  async getMe(): Promise<AuthProfile> {
    const response = await apiClient.get(endpoints.me());
    return extractAuthProfile(response.data);
  },

  async getAdminStat(): Promise<AdminStat> {
    const response = await apiClient.get(endpoints.stat());
    return extractAdminStat(response.data);
  },

  async getAdminActionLogs(params?: GetAdminActionLogsParams): Promise<AdminActionLogsPayload> {
    const response = await apiClient.get(endpoints.statActions(), {
      params: {
        ...(params?.source ? { source: params.source } : {}),
        ...(params?.authType ? { auth_type: params.authType } : {}),
        ...(typeof params?.limit === 'number' ? { limit: params.limit } : {}),
      },
    });
    return extractAdminActionLogs(response.data);
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

  async getApiTokens(): Promise<ApiToken[]> {
    const response = await apiClient.get(endpoints.settingsTokens());
    return extractApiTokens(response.data);
  },

  async createApiToken(payload: CreateApiTokenPayload): Promise<CreatedApiToken> {
    const response = await apiClient.post(endpoints.settingsTokens(), payload);
    return extractCreatedApiToken(response.data);
  },

  async revokeApiToken(tokenId: string): Promise<void> {
    await apiClient.delete(endpoints.settingsTokenById(tokenId));
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const response = await apiClient.post(endpoints.teams(), payload);
    return extractTeam(response.data);
  },

  async getTeams(): Promise<Team[]> {
    const response = await apiClient.get(endpoints.teams());
    return extractTeams(response.data);
  },

  async getTeamById(teamId: string): Promise<TeamDetails> {
    const response = await apiClient.get(endpoints.teamById(teamId));
    return extractTeamDetails(response.data);
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await apiClient.get(endpoints.teamMembers(teamId));
    return extractTeamMembers(response.data);
  },

  async getTeamProjects(teamId: string): Promise<TeamProjectsPayload> {
    const response = await apiClient.get(endpoints.teamProjects(teamId));
    return extractTeamProjects(response.data);
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await apiClient.delete(endpoints.teamMemberByUser(teamId, userId));
  },

  async getTeamActiveInvites(teamId: string): Promise<TeamActiveInvite[]> {
    const response = await apiClient.get(endpoints.teamInvites(teamId));
    return extractTeamActiveInvites(response.data);
  },

  async revokeTeamInvite(teamId: string, inviteId: string): Promise<void> {
    await apiClient.post(endpoints.teamInviteById(teamId, inviteId));
  },

  async inviteToTeam(teamId: string, payload: InviteToTeamPayload): Promise<string> {
    const response = await apiClient.post(endpoints.teamInvite(teamId), payload);
    return extractInviteUrl(response.data);
  },

  async getTeamInvite(token: string): Promise<TeamInvitePreview> {
    const response = await apiClient.get(endpoints.teamInviteByToken(token));
    return extractTeamInvitePreview(response.data);
  },

  async acceptTeamInvite(token: string): Promise<void> {
    await apiClient.post(endpoints.teamInviteAccept(token));
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

  async assignTask(projectId: string, stageId: string, taskId: string, payload: AssignTaskPayload): Promise<void> {
    await apiClient.patch(endpoints.assignTask(projectId, stageId, taskId), payload);
  },

  async deleteTask(projectId: string, stageId: string, taskId: string): Promise<void> {
    await apiClient.delete(endpoints.deleteTask(projectId, stageId, taskId));
  },

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const response = await apiClient.get(endpoints.projectTasks(projectId));
    return extractTasks(response.data);
  },

  async createProjectTask(projectId: string, payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post(endpoints.projectTasks(projectId), payload);
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

  async toggleProjectTask(projectId: string, taskId: string): Promise<void> {
    await apiClient.patch(endpoints.toggleProjectTask(projectId, taskId));
  },

  async editProjectTaskTitle(projectId: string, taskId: string, payload: EditTaskTitlePayload): Promise<void> {
    await apiClient.patch(endpoints.editProjectTaskTitle(projectId, taskId), payload);
  },

  async assignProjectTask(projectId: string, taskId: string, payload: AssignTaskPayload): Promise<void> {
    await apiClient.patch(endpoints.assignProjectTask(projectId, taskId), payload);
  },

  async deleteProjectTask(projectId: string, taskId: string): Promise<void> {
    await apiClient.delete(endpoints.deleteProjectTask(projectId, taskId));
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
