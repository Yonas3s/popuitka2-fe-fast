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

export type Project = {
  id: string;
  projectName: string;
  description?: string;
  teamId?: string;
  status?: 'active' | 'completed';
  workflowType: WorkflowType;
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
  done: boolean;
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

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};
