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
  raw: Record<string, unknown>;
};

export type Project = {
  id: string;
  projectName: string;
  description?: string;
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
  raw: Record<string, unknown>;
};

export type PublicSharePayload = {
  shareToken: string;
  project?: Project;
  stages: Stage[];
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
