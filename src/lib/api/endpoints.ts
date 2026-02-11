export const endpoints = {
  health: () => '/health',
  me: () => '/me',
  signup: () => '/signup',
  signin: () => '/signin',
  forgotPassword: () => '/forgot-password',
  verifyResetCode: () => '/verify-reset-code',
  resetPassword: () => '/reset-password',
  projects: () => '/projects',
  projectById: (projectId: string) => `/projects/${projectId}`,
  stages: (projectId: string) => `/projects/${projectId}/stages`,
  stageById: (projectId: string, stageId: string) => `/projects/${projectId}/stages/${stageId}`,
  tasks: (projectId: string, stageId: string) => `/projects/${projectId}/stages/${stageId}/tasks`,
  toggleTask: (projectId: string, stageId: string, taskId: string) =>
    `/projects/${projectId}/stages/${stageId}/tasks/${taskId}/toggle`,
  editTaskTitle: (projectId: string, stageId: string, taskId: string) =>
    `/projects/${projectId}/stages/${stageId}/tasks/${taskId}/title`,
  deleteTask: (projectId: string, stageId: string, taskId: string) =>
    `/projects/${projectId}/stages/${stageId}/tasks/${taskId}`,
  shareLink: (projectId: string) => `/projects/${projectId}/share-link`,
  requestReview: (projectId: string, stageId: string) =>
    `/projects/${projectId}/stages/${stageId}/request-review`,
  publicProject: (shareToken: string) => `/p/${shareToken}`,
  approvePublicProject: (shareToken: string) => `/p/${shareToken}/approve`,
};
