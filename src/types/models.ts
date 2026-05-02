export type ApiError = {
  status?: number;
  message: string;
  details?: unknown;
};

export type AuthTokenResponse = {
  token: string;
};

export type AuthProfile = {
  id: string;
  username: string;
  email: string;
  authProvider: string;
  createdAt?: string;
  telegramUsername?: string | null;
  raw: Record<string, unknown>;
};

export type AdminStat = {
  users: number;
  devUsers: number;
  adminUsers: number;
  localUsers: number;
  ghUsers: number;
  projects: number;
  activeProjects: number;
  completedProjects: number;
  stages: number;
  waitingStages: number;
  activeStages: number;
  reviewStages: number;
  completedStages: number;
  actionsTotal: number;
  actionsBySource: Array<{ source: AdminActionSource; count: number }>;
  actionsByAuth: Array<{ authType: AdminActionAuthType; count: number }>;
  recentActions: AdminActionLog[];
  raw: Record<string, unknown>;
};

export type AdminActionSource = 'web' | 'cli' | 'mcp' | 'unknown';

export type AdminActionAuthType = 'jwt' | 'pat';

export type AdminActionLog = {
  id: string;
  createdAt?: string;
  source: AdminActionSource;
  authType: AdminActionAuthType;
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  } | null;
  token?: {
    id?: string;
    name?: string;
    tokenPrefix?: string;
  } | null;
  raw: Record<string, unknown>;
};

export type AdminActionLogsPayload = {
  limit: number;
  count: number;
  data: AdminActionLog[];
  raw: Record<string, unknown>;
};

export type Team = {
  id: string;
  name: string;
  role?: string;
  raw: Record<string, unknown>;
};

export type TeamDetails = {
  id: string;
  name: string;
  ownerId?: string;
  myRole?: string;
  stats: {
    members: number;
    projects: number;
  };
  raw: Record<string, unknown>;
};

export type TeamMember = {
  id: string;
  username: string;
  email: string;
  role: string;
  telegramUsername?: string | null;
  raw: Record<string, unknown>;
};

export type DirectionTag = {
  id: string;
  name: string;
  color: string | null;
  raw: Record<string, unknown>;
};

export type TeamActiveInvite = {
  id: string;
  email: string;
  invitedBy?: string;
  createdAt?: string;
  expiresAt?: string;
  raw: Record<string, unknown>;
};

export type TeamProjectsPayload = {
  myRole?: string;
  projects: Project[];
  raw: Record<string, unknown>;
};

export type TeamInvitePreview = {
  teamName: string;
  inviterName?: string;
  email?: string;
  expiresAt?: string;
  acceptedAt?: string;
  valid?: boolean;
  raw: Record<string, unknown>;
};

export type ApiToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
};

export type CreatedApiToken = {
  id: string;
  name: string;
  token: string;
  tokenPrefix: string;
  expiresAt?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
};

export type WorkflowType = 'stages' | 'flat';
export type TaskType = 'task' | 'bug' | 'feature' | 'improvement' | 'chore';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type Project = {
  id: string;
  projectName: string;
  description?: string;
  teamId?: string;
  status?: 'active' | 'completed';
  workflowType: WorkflowType;
  workLink?: string;
  shareLink?: string;
  raw: Record<string, unknown>;
};

export type Stage = {
  id: string;
  stageName: string;
  description?: string;
  workLink?: string;
  status?: 'active' | 'waiting' | 'review' | 'completed';
  reviewRequested?: boolean;
  raw: Record<string, unknown>;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  issueKey?: string;
  stageId?: string;
  done: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  directionIds: string[];
  assigneeUserId?: string;
  raw: Record<string, unknown>;
};

export type PublicSharePayload = {
  shareToken: string;
  project?: Project;
  workflowType: WorkflowType;
  stages: Stage[];
  tasks: Task[];
  approved?: boolean;
  raw: Record<string, unknown>;
};

export type ShareLinkResponse = {
  shareLink: string;
};

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'canceled'
  | 'unknown';

export type AgentCreatedTask = {
  id?: string;
  issueKey?: string;
  title: string;
};

export type AgentRun = {
  id: string;
  status: AgentRunStatus;
  prompt: string;
  model?: string;
  createTasks?: boolean;
  taskLimit?: number;
  targetStageId?: string;
  createdTasksCount?: number;
  createdTasks: AgentCreatedTask[];
  outputText?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

export type GitHubInstallation = {
  id: string;
  accountLogin: string;
  accountType: string;
  appSlug?: string;
  raw: Record<string, unknown>;
};

export type GitHubRepo = {
  externalId: string;
  fullName: string;
  name: string;
  isPrivate: boolean;
  htmlUrl: string;
  raw: Record<string, unknown>;
};

export type BoundRepository = {
  id: string;
  repositoryExternalId: string;
  installationId: string;
  fullName: string;
  htmlUrl: string;
  autoCloseOnMerge: boolean;
  raw: Record<string, unknown>;
};

export type TelegramUserLink = {
  linked: boolean;
  telegramUsername: string | null;
  raw: Record<string, unknown>;
};

export type TelegramConnectLink = {
  token: string;
  deepLink: string;
  expiresAt: string;
  raw: Record<string, unknown>;
};

export type TelegramBinding = {
  id: string;
  chatTitle: string;
  chatId?: string;
  topicTitle?: string;
  topicId?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
};

export type TelegramBindToken = {
  token: string;
  command: string;
  botUsername: string;
  expiresAt: string;
  instructions: string[];
  raw: Record<string, unknown>;
};

export type WebhookEvent = {
  id: string;
  eventType: string;
  branch: string;
  closedTasks: string[];
  status: string;
  createdAt: string;
  raw: Record<string, unknown>;
};

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};
