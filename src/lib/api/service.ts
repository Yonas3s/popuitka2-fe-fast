import { apiClient } from './client';
import { endpoints } from './endpoints';
import {
  extractAgentRun,
  extractAgentRuns,
  extractAdminActionLogs,
  extractDirection,
  extractDirections,
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
  AgentRun,
  TaskStatus,
  AdminActionAuthType,
  AdminActionLogsPayload,
  AdminActionSource,
  AdminStat,
  ApiToken,
  AuthProfile,
  BoundRepository,
  CreatedApiToken,
  DirectionTag,
  GitHubInstallation,
  GitHubRepo,
  Project,
  PublicSharePayload,
  ShareLinkResponse,
  Stage,
  Task,
  TaskType,
  TaskPriority,
  Team,
  TeamActiveInvite,
  TeamDetails,
  TeamMember,
  TeamInvitePreview,
  TeamProjectsPayload,
  WebhookEvent,
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

export type UpdateProjectPayload = {
  project_name?: string;
  work_link?: string;
};

export type CreateStagePayload = {
  stage_name: string;
  description?: string;
};

export type UpdateStagePayload = {
  stage_name?: string;
  work_link?: string;
  description?: string;
};

export type CreateTaskPayload = {
  title: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type CreateDirectionPayload = {
  name: string;
  direction_name?: string;
  color?: string | null;
};

export type UpdateDirectionPayload = {
  name?: string;
  color?: string | null;
};

export type EditTaskTitlePayload = {
  title: string;
};

export type AssignTaskPayload = {
  user_id?: string | null;
  assignee_user_id?: string | null;
};

export type PatchTaskMetaPayload = {
  task_type?: TaskType;
  direction_ids?: string[];
  description?: string;
  priority?: TaskPriority;
};

export type CreateAgentRunPayload = {
  prompt: string;
  // Optional: when omitted, the backend chooses the default model for the
  // currently configured provider (e.g. llama-3.3-70b-versatile on Groq).
  model?: string;
  create_tasks: boolean;
  task_limit: number;
  stage_id?: string;
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
  reset_token: string;
  password: string;
};

export type CreateTeamPayload = {
  name: string;
};

export type UpdateTeamPayload = {
  name: string;
};

export type InviteToTeamPayload = {
  email: string;
};

export type CreateApiTokenPayload = {
  name: string;
  expires_at?: string;
};

export type BindRepositoryPayload = {
  repository_external_id: string;
  installation_id: string;
  auto_close_on_merge?: boolean;
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

  async verifyResetCode(payload: VerifyResetCodePayload): Promise<string> {
    const response = await apiClient.post(endpoints.verifyResetCode(), payload);
    const data = response.data as Record<string, unknown>;
    return typeof data.reset_token === 'string' ? data.reset_token : '';
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

  async patchTeam(teamId: string, payload: UpdateTeamPayload): Promise<Team> {
    const response = await apiClient.patch(endpoints.teamById(teamId), payload);
    return extractTeam(response.data);
  },

  async deleteTeam(teamId: string): Promise<void> {
    await apiClient.delete(endpoints.teamById(teamId));
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

  async patchProject(projectId: string, payload: UpdateProjectPayload): Promise<Project> {
    const response = await apiClient.patch(endpoints.projectById(projectId), payload);
    return extractProject(response.data);
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(endpoints.projectById(projectId));
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get(endpoints.projectById(projectId));
    return extractProject(response.data);
  },

  async getDirections(projectId: string): Promise<DirectionTag[]> {
    const response = await apiClient.get(endpoints.directions(projectId));
    return extractDirections(response.data);
  },

  async addDirection(projectId: string, payload: CreateDirectionPayload): Promise<DirectionTag> {
    const normalizedName = payload.name.trim();
    const response = await apiClient.post(endpoints.directions(projectId), {
      ...payload,
      name: normalizedName,
      // Backward compatibility for old BE contract.
      direction_name: normalizedName,
    });
    return extractDirection(response.data);
  },

  async updateDirection(
    projectId: string,
    directionId: string,
    payload: UpdateDirectionPayload,
  ): Promise<DirectionTag> {
    const response = await apiClient.patch(
      endpoints.directionById(projectId, directionId),
      payload,
    );
    return extractDirection(response.data);
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

  async deleteStage(projectId: string, stageId: string): Promise<void> {
    await apiClient.delete(endpoints.stageById(projectId, stageId));
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
      taskType: 'task',
      status: 'backlog',
      priority: 'none',
      directionIds: [],
      issueKey: undefined,
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

  async patchTaskMeta(
    projectId: string,
    stageId: string,
    taskId: string,
    payload: PatchTaskMetaPayload,
  ): Promise<void> {
    await apiClient.patch(endpoints.patchTaskMeta(projectId, stageId, taskId), payload);
  },

  async changeTaskStatus(projectId: string, stageId: string, taskId: string, status: TaskStatus): Promise<void> {
    await apiClient.patch(endpoints.taskStatus(projectId, stageId, taskId), { status });
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
      taskType: 'task',
      status: 'backlog',
      priority: 'none',
      directionIds: [],
      issueKey: undefined,
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

  async patchProjectTaskMeta(projectId: string, taskId: string, payload: PatchTaskMetaPayload): Promise<void> {
    await apiClient.patch(endpoints.patchProjectTaskMeta(projectId, taskId), payload);
  },

  async changeProjectTaskStatus(projectId: string, taskId: string, status: TaskStatus): Promise<void> {
    await apiClient.patch(endpoints.projectTaskStatus(projectId, taskId), { status });
  },

  async deleteProjectTask(projectId: string, taskId: string): Promise<void> {
    await apiClient.delete(endpoints.deleteProjectTask(projectId, taskId));
  },

  async getAgentRuns(projectId: string, limit = 20): Promise<AgentRun[]> {
    const response = await apiClient.get(endpoints.agentRuns(projectId), {
      params: {
        limit,
      },
    });
    return extractAgentRuns(response.data);
  },

  async createAgentRun(projectId: string, payload: CreateAgentRunPayload): Promise<AgentRun> {
    const response = await apiClient.post(endpoints.agentRuns(projectId), payload);
    return extractAgentRun(response.data);
  },

  async getAgentRun(projectId: string, runId: string): Promise<AgentRun> {
    const response = await apiClient.get(endpoints.agentRunById(projectId, runId));
    return extractAgentRun(response.data);
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

  async getGitHubInstallations(): Promise<GitHubInstallation[]> {
    const response = await apiClient.get(endpoints.githubInstallations());
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: Record<string, unknown>) => ({
      id: String(item.installationId || item.installation_id || item.id || item._id || ''),
      accountLogin: String(item.accountLogin || item.account_login || ''),
      accountType: String(item.accountType || item.account_type || 'User'),
      appSlug: typeof item.appSlug === 'string' ? item.appSlug : typeof item.app_slug === 'string' ? item.app_slug : undefined,
      raw: item,
    }));
  },

  async getInstallationRepos(installationId: string): Promise<GitHubRepo[]> {
    const response = await apiClient.get(endpoints.githubInstallationRepos(installationId));
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: Record<string, unknown>) => {
      const owner = typeof item.owner === 'object' && item.owner !== null ? item.owner as Record<string, unknown> : {};
      const ownerLogin = String(item.ownerLogin || item.owner_login || owner.login || '');
      const name = String(item.name || item.repositoryName || item.repository_name || '');
      const fullName = String(
        item.fullName ||
        item.full_name ||
        (ownerLogin && name ? `${ownerLogin}/${name}` : '') ||
        name ||
        item.externalId ||
        item.external_id ||
        item.id ||
        '',
      );
      return {
        externalId: String(item.externalId || item.external_id || item.id || ''),
        fullName,
        name: name || fullName.split('/').pop() || fullName,
        isPrivate: Boolean(item.isPrivate ?? item.is_private ?? item.private),
        htmlUrl: String(item.htmlUrl || item.html_url || (fullName.includes('/') ? `https://github.com/${fullName}` : '')),
        raw: item,
      };
    });
  },

  async handleGitHubInstallCallback(installationId: string, setupAction: string): Promise<void> {
    await apiClient.get(endpoints.githubCallbackInstall(), {
      params: { installation_id: installationId, setup_action: setupAction },
    });
  },

  async getProjectRepositories(projectId: string): Promise<BoundRepository[]> {
    const response = await apiClient.get(endpoints.projectRepositories(projectId));
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: Record<string, unknown>) => {
      const repo = (typeof item.repositoryId === 'object' && item.repositoryId !== null
        ? item.repositoryId
        : typeof item.repository_id === 'object' && item.repository_id !== null
          ? item.repository_id
          : typeof item.repository === 'object' && item.repository !== null
            ? item.repository
            : typeof item.repo === 'object' && item.repo !== null
              ? item.repo
              : typeof item.githubRepository === 'object' && item.githubRepository !== null
                ? item.githubRepository
                : typeof item.github_repository === 'object' && item.github_repository !== null
                  ? item.github_repository
          : item) as Record<string, unknown>;
      const owner = typeof repo.owner === 'object' && repo.owner !== null ? repo.owner as Record<string, unknown> : {};
      const ownerLogin = String(
        repo.ownerLogin ||
        repo.owner_login ||
        repo.owner_name ||
        repo.ownerName ||
        item.ownerLogin ||
        item.owner_login ||
        owner.login ||
        '',
      );
      const repoName = String(
        repo.name ||
        repo.repoName ||
        repo.repo_name ||
        repo.repositoryName ||
        repo.repository_name ||
        repo.repository ||
        item.name ||
        item.repoName ||
        item.repo_name ||
        item.repositoryName ||
        item.repository_name ||
        '',
      );
      const repositoryExternalId = String(
        repo.externalId ||
        repo.external_id ||
        repo.githubId ||
        repo.github_id ||
        repo.githubRepositoryId ||
        repo.github_repository_id ||
        item.repositoryExternalId ||
        item.repository_external_id ||
        item.githubRepositoryId ||
        item.github_repository_id ||
        (typeof item.repository_id === 'string' ? item.repository_id : '') ||
        '',
      );
      const fullName = String(
        repo.fullName ||
        repo.full_name ||
        repo.repositoryFullName ||
        repo.repository_full_name ||
        item.fullName ||
        item.full_name ||
        item.repositoryFullName ||
        item.repository_full_name ||
        (ownerLogin && repoName ? `${ownerLogin}/${repoName}` : '') ||
        repoName ||
        repositoryExternalId ||
        '',
      );
      return {
        id: String(item.id || item._id || ''),
        repositoryExternalId,
        installationId: String(repo.installationId || repo.installation_id || item.installationId || item.installation_id || ''),
        fullName,
        htmlUrl: String(repo.htmlUrl || repo.html_url || item.htmlUrl || item.html_url || (fullName.includes('/') ? `https://github.com/${fullName}` : '')),
        autoCloseOnMerge: Boolean(item.autoCloseOnMerge ?? item.auto_close_on_merge),
        raw: item,
      };
    });
  },

  async bindRepository(projectId: string, payload: BindRepositoryPayload): Promise<void> {
    await apiClient.post(endpoints.projectRepositories(projectId), payload);
  },

  async unbindRepository(projectId: string, repoId: string): Promise<void> {
    await apiClient.delete(endpoints.projectRepositoryById(projectId, repoId));
  },

  async getMeTelegram(): Promise<{ linked: boolean; telegramUsername: string | null; raw: Record<string, unknown> }> {
    const response = await apiClient.get(endpoints.meTelegram());
    const data = (response.data || {}) as Record<string, unknown>;
    const telegramUsername =
      (typeof data.telegramUsername === 'string' && data.telegramUsername) ||
      (typeof data.telegram_username === 'string' && data.telegram_username) ||
      null;
    return {
      linked: Boolean(data.linked),
      telegramUsername,
      raw: data,
    };
  },

  async createMeTelegramConnectLink(): Promise<{ token: string; deepLink: string; expiresAt: string }> {
    const response = await apiClient.post(endpoints.meTelegramConnectLink());
    const data = (response.data || {}) as Record<string, unknown>;
    return {
      token: String(data.token || ''),
      deepLink: String(data.deepLink || data.deep_link || ''),
      expiresAt: String(data.expiresAt || data.expires_at || ''),
    };
  },

  async disconnectMeTelegram(): Promise<void> {
    await apiClient.delete(endpoints.meTelegram());
  },

  async getProjectTelegramBindings(projectId: string) {
    const response = await apiClient.get(endpoints.projectTelegramBindings(projectId));
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: Record<string, unknown>) => ({
      id: String(item.id || item._id || ''),
      chatTitle: String(item.chatTitle || item.chat_title || item.title || 'Чат'),
      chatId: item.chatId ? String(item.chatId) : item.chat_id ? String(item.chat_id) : undefined,
      topicTitle:
        typeof item.topicTitle === 'string'
          ? item.topicTitle
          : typeof item.topic_title === 'string'
            ? item.topic_title
            : typeof item.threadTitle === 'string'
              ? item.threadTitle
              : typeof item.thread_title === 'string'
                ? item.thread_title
                : undefined,
      topicId:
        item.topicId
          ? String(item.topicId)
          : item.topic_id
            ? String(item.topic_id)
            : item.messageThreadId
              ? String(item.messageThreadId)
              : item.message_thread_id
                ? String(item.message_thread_id)
                : undefined,
      createdAt: String(item.createdAt || item.created_at || ''),
      raw: item,
    }));
  },

  async createProjectTelegramBindToken(projectId: string) {
    const response = await apiClient.post(endpoints.projectTelegramBindToken(projectId));
    const data = (response.data || {}) as Record<string, unknown>;
    const instructions = Array.isArray(data.instructions) ? (data.instructions as string[]) : [];
    return {
      token: String(data.token || ''),
      command: String(data.command || ''),
      botUsername: String(data.botUsername || data.bot_username || 'unit_duck_bot'),
      expiresAt: String(data.expiresAt || data.expires_at || ''),
      instructions,
    };
  },

  async unbindProjectTelegram(projectId: string, bindingId: string): Promise<void> {
    await apiClient.delete(endpoints.projectTelegramBindingById(projectId, bindingId));
  },

  async getWebhookEvents(projectId: string): Promise<{ events: WebhookEvent[]; total: number }> {
    const response = await apiClient.get(endpoints.webhookEvents(projectId));
    const data = response.data as Record<string, unknown>;
    const rawEvents = Array.isArray(data.events) ? data.events : [];
    const events: WebhookEvent[] = rawEvents.map((item: Record<string, unknown>) => ({
      id: String(item.id || item._id || ''),
      eventType: String(item.eventType || item.event_type || ''),
      branch: String(item.branch || ''),
      closedTasks: Array.isArray(item.closedTasks)
        ? item.closedTasks as string[]
        : Array.isArray(item.closed_tasks)
          ? item.closed_tasks as string[]
          : [],
      status: String(item.status || ''),
      createdAt: String(item.createdAt || item.created_at || ''),
      raw: item,
    }));
    return { events, total: Number(data.total || events.length) };
  },
};
