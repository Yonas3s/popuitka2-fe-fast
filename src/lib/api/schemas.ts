import { z } from 'zod';
import type {
  AgentRun,
  AdminActionAuthType,
  AdminActionLog,
  AdminActionLogsPayload,
  AdminActionSource,
  AdminStat,
  ApiToken,
  AuthProfile,
  CreatedApiToken,
  DirectionTag,
  Project,
  PublicSharePayload,
  Stage,
  Task,
  TaskType,
  Team,
  TeamActiveInvite,
  TeamDetails,
  TeamMember,
  TeamInvitePreview,
  TeamProjectsPayload,
} from '../../types/models';

const recordSchema = z.record(z.unknown());

const projectSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    project_name: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    team_id: z.string().optional(),
    teamId: z.string().optional(),
    status: z.enum(['active', 'completed']).optional(),
    share_link: z.string().optional(),
    shareLink: z.string().optional(),
    client_url: z.string().optional(),
    clientUrl: z.string().optional(),
    workflow_type: z.enum(['stages', 'flat']).optional(),
    workflowType: z.enum(['stages', 'flat']).optional(),
  })
  .passthrough();

const stageSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    stage_name: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    work_link: z.string().optional(),
    workLink: z.string().optional(),
    review_requested: z.boolean().optional(),
    reviewRequested: z.boolean().optional(),
    status: z.enum(['active', 'waiting', 'review', 'completed']).optional(),
  })
  .passthrough();

const taskSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    title: z.string().optional(),
    issue_key: z.string().optional(),
    issueKey: z.string().optional(),
    done: z.boolean().optional(),
    is_done: z.boolean().optional(),
    isDone: z.boolean().optional(),
    completed: z.boolean().optional(),
    task_type: z.string().optional(),
    taskType: z.string().optional(),
    description: z.string().optional(),
    task_description: z.string().optional(),
    direction_ids: z.array(z.unknown()).optional(),
    directionIds: z.array(z.unknown()).optional(),
    directions: z.array(z.unknown()).optional(),
    assignee_user_id: z.string().nullable().optional(),
    assigneeUserId: z.string().nullable().optional(),
  })
  .passthrough();

const agentRunSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    run_id: z.string().optional(),
    runId: z.string().optional(),
    status: z.string().optional(),
    prompt: z.string().optional(),
    input: z.string().optional(),
    output_text: z.string().optional(),
    outputText: z.string().optional(),
    result: z.string().optional(),
    model: z.string().optional(),
    create_tasks: z.boolean().optional(),
    createTasks: z.boolean().optional(),
    task_limit: z.number().optional(),
    taskLimit: z.number().optional(),
    target_stage_id: z.string().optional(),
    targetStageId: z.string().optional(),
    created_tasks_count: z.number().optional(),
    createdTasksCount: z.number().optional(),
    created_tasks: z.array(z.unknown()).optional(),
    createdTasks: z.array(z.unknown()).optional(),
    error_message: z.string().optional(),
    errorMessage: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    updated_at: z.string().optional(),
    updatedAt: z.string().optional(),
    error: z
      .object({
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const taskTypeValues: TaskType[] = ['task', 'bug', 'feature', 'improvement', 'chore'];

const meSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    auth_provider: z.string().optional(),
    authProvider: z.string().optional(),
    provider: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

const adminStatSchema = z
  .object({
    users: z.number().optional(),
    dev_users: z.number().optional(),
    admin_users: z.number().optional(),
    local_users: z.number().optional(),
    gh_users: z.number().optional(),
    projects: z.number().optional(),
    active_projects: z.number().optional(),
    completed_projects: z.number().optional(),
    stages: z.number().optional(),
    waiting_stages: z.number().optional(),
    active_stages: z.number().optional(),
    review_stages: z.number().optional(),
    completed_stages: z.number().optional(),
    actions_total: z.number().optional(),
    actions_by_source: z
      .array(
        z
          .object({
            source: z.string().optional(),
            count: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    actions_by_auth: z
      .array(
        z
          .object({
            auth_type: z.string().optional(),
            count: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    recent_actions: z.array(z.unknown()).optional(),
  })
  .passthrough();

const adminActionLogSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    source: z.string().optional(),
    auth_type: z.string().optional(),
    authType: z.string().optional(),
    method: z.string().optional(),
    path: z.string().optional(),
    status_code: z.number().optional(),
    statusCode: z.number().optional(),
    duration_ms: z.number().optional(),
    durationMs: z.number().optional(),
    ip: z.string().optional(),
    user_agent: z.string().optional(),
    userAgent: z.string().optional(),
    user: z
      .object({
        _id: z.string().optional(),
        id: z.string().optional(),
        username: z.string().optional(),
        email: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    token: z
      .object({
        _id: z.string().optional(),
        id: z.string().optional(),
        name: z.string().optional(),
        token_prefix: z.string().optional(),
        tokenPrefix: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const teamSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    team_id: z.string().optional(),
    teamId: z.string().optional(),
    name: z.string().optional(),
    team_name: z.string().optional(),
    teamName: z.string().optional(),
    role: z.string().optional(),
    myRole: z.string().optional(),
    my_role: z.string().optional(),
    membership_role: z.string().optional(),
    member_role: z.string().optional(),
    team_role: z.string().optional(),
    team: z.unknown().optional(),
  })
  .passthrough();

const teamInvitePreviewSchema = z
  .object({
    team_name: z.string().optional(),
    teamName: z.string().optional(),
    team: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    inviter_name: z.string().optional(),
    inviterName: z.string().optional(),
    inviter: z
      .object({
        username: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    email: z.string().optional(),
    expires_at: z.string().optional(),
    expiresAt: z.string().optional(),
    accepted_at: z.string().optional(),
    acceptedAt: z.string().optional(),
    valid: z.boolean().optional(),
  })
  .passthrough();

const teamActiveInviteSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    email: z.string().optional(),
    invited_by: z.string().optional(),
    invitedBy: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
    expires_at: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .passthrough();

const teamDetailsSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    owner_id: z.string().optional(),
    ownerId: z.string().optional(),
    myRole: z.string().optional(),
    my_role: z.string().optional(),
    role: z.string().optional(),
    stats: z
      .object({
        members: z.number().optional(),
        projects: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const teamMemberSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    user_id: z.string().optional(),
    userId: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    user: z
      .object({
        _id: z.string().optional(),
        id: z.string().optional(),
        username: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const directionSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const apiTokenSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    token_prefix: z.string().optional(),
    tokenPrefix: z.string().optional(),
    token: z.string().optional(),
    last_used_at: z.string().optional(),
    lastUsedAt: z.string().optional(),
    expires_at: z.string().optional(),
    expiresAt: z.string().optional(),
    revoked_at: z.string().optional(),
    revokedAt: z.string().optional(),
    created_at: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

const isoDateTimeNullableSchema = z.string().datetime({ offset: true }).nullable().optional();

const apiTokenContractSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tokenPrefix: z.string().regex(/^ul_[a-z0-9_-]+$/i),
  lastUsedAt: isoDateTimeNullableSchema,
  expiresAt: isoDateTimeNullableSchema,
  revokedAt: isoDateTimeNullableSchema,
  createdAt: z.string().datetime({ offset: true }).optional(),
});

const createdApiTokenContractSchema = apiTokenContractSchema.extend({
  token: z.string().regex(/^ul_[a-z0-9_-]+$/i),
});

const asRecord = (value: unknown): Record<string, unknown> => {
  const parsed = recordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
};

const pickRecordFromPossibleKeys = (value: Record<string, unknown>, keys: string[]): Record<string, unknown> | null => {
  for (const key of keys) {
    const candidate = value[key];
    const parsed = recordSchema.safeParse(candidate);
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
};

const pickArrayFromPossibleKeys = (value: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const pickFirstArrayValue = (value: Record<string, unknown>): unknown[] => {
  for (const candidate of Object.values(value)) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const normalizeId = (record: Record<string, unknown>, fallback: string): string => {
  const id = record.id ?? record._id;
  return typeof id === 'string' && id.length > 0 ? id : fallback;
};

export const normalizeProject = (value: unknown, index = 0): Project => {
  const parsed = projectSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const projectName =
    (typeof record.projectName === 'string' && record.projectName) ||
    (typeof record.project_name === 'string' && record.project_name) ||
    (typeof record.name === 'string' && record.name) ||
    'Без названия';

  const description = typeof record.description === 'string' ? record.description : undefined;
  const teamId =
    (typeof record.team_id === 'string' && record.team_id) ||
    (typeof record.teamId === 'string' && record.teamId) ||
    undefined;
  const shareLink =
    (typeof record.share_link === 'string' && record.share_link) ||
    (typeof record.shareLink === 'string' && record.shareLink) ||
    (typeof record.client_url === 'string' && record.client_url) ||
    (typeof record.clientUrl === 'string' && record.clientUrl) ||
    undefined;
  const workflowType =
    (record.workflow_type === 'stages' || record.workflow_type === 'flat' ? record.workflow_type : undefined) ||
    (record.workflowType === 'stages' || record.workflowType === 'flat' ? record.workflowType : undefined) ||
    'stages';

  return {
    id: normalizeId(record, `project-${index}`),
    projectName,
    description,
    teamId,
    status:
      typeof record.status === 'string' &&
      ['active', 'completed'].includes(record.status)
        ? (record.status as 'active' | 'completed')
        : undefined,
    workflowType,
    shareLink,
    raw: record,
  };
};

export const normalizeStage = (value: unknown, index = 0): Stage => {
  const parsed = stageSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const stageName =
    (typeof record.stageName === 'string' && record.stageName) ||
    (typeof record.stage_name === 'string' && record.stage_name) ||
    (typeof record.name === 'string' && record.name) ||
    `Стадия ${index + 1}`;

  const workLink =
    (typeof record.work_link === 'string' && record.work_link) ||
    (typeof record.workLink === 'string' && record.workLink) ||
    undefined;

  return {
    id: normalizeId(record, `stage-${index}`),
    stageName,
    description: typeof record.description === 'string' ? record.description : undefined,
    workLink,
    status:
      typeof record.status === 'string' &&
      ['active', 'waiting', 'review', 'completed'].includes(record.status)
        ? (record.status as 'active' | 'waiting' | 'review' | 'completed')
        : undefined,
    reviewRequested:
      (typeof record.review_requested === 'boolean' && record.review_requested) ||
      (typeof record.reviewRequested === 'boolean' && record.reviewRequested) ||
      undefined,
    raw: record,
  };
};

export const normalizeTask = (value: unknown, index = 0): Task => {
  const parsed = taskSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const done =
    (typeof record.isDone === 'boolean' && record.isDone) ||
    (typeof record.done === 'boolean' && record.done) ||
    (typeof record.is_done === 'boolean' && record.is_done) ||
    (typeof record.completed === 'boolean' && record.completed) ||
    false;

  const taskTypeCandidate =
    (typeof record.taskType === 'string' && record.taskType) ||
    (typeof record.task_type === 'string' && record.task_type) ||
    '';
  const normalizedTaskType = taskTypeCandidate.trim().toLowerCase();
  const taskType = taskTypeValues.includes(normalizedTaskType as TaskType)
    ? (normalizedTaskType as TaskType)
    : 'task';

  // Supports three shapes:
  //  1) directions: [{ directionId: '...' }]     — new camelCase format
  //  2) directionIds: ['...']                     — old camelCase fallback
  //  3) direction_ids: ['...' | { id/_id }]       — legacy snake_case fallback
  const directionSource = Array.isArray(record.directions)
    ? record.directions
    : Array.isArray(record.directionIds)
      ? record.directionIds
      : Array.isArray(record.direction_ids)
        ? record.direction_ids
        : [];
  const directionIds = Array.from(
    new Set(
      directionSource
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          const nested = asRecord(item);
          // New shape: { directionId: '...' } (possibly with nested direction object)
          if (typeof nested.directionId === 'string' && nested.directionId) {
            return nested.directionId;
          }
          if (typeof nested.direction_id === 'string' && nested.direction_id) {
            return nested.direction_id;
          }
          if (typeof nested.id === 'string' && nested.id) {
            return nested.id;
          }
          if (typeof nested._id === 'string' && nested._id) {
            return nested._id;
          }
          return '';
        })
        .filter((value): value is string => value.length > 0),
    ),
  );

  return {
    id: normalizeId(record, `task-${index}`),
    title: typeof record.title === 'string' && record.title ? record.title : 'Без названия задачи',
    description:
      (typeof record.description === 'string' && record.description) ||
      (typeof record.task_description === 'string' && record.task_description) ||
      undefined,
    issueKey:
      (typeof record.issueKey === 'string' && record.issueKey) ||
      (typeof record.issue_key === 'string' && record.issue_key) ||
      undefined,
    done,
    taskType,
    directionIds,
    assigneeUserId:
      (typeof record.assigneeUserId === 'string' && record.assigneeUserId) ||
      (typeof record.assignee_user_id === 'string' && record.assignee_user_id) ||
      undefined,
    raw: record,
  };
};

const agentRunStatuses = ['queued', 'running', 'completed', 'failed', 'cancelled', 'canceled'] as const;

const toAgentRunStatus = (value: unknown): AgentRun['status'] => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (agentRunStatuses.includes(normalized as (typeof agentRunStatuses)[number])) {
    return normalized as AgentRun['status'];
  }
  return 'unknown';
};

export const normalizeAgentRun = (value: unknown, index = 0): AgentRun => {
  const parsed = agentRunSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const errorRecord = pickRecordFromPossibleKeys(record, ['error']) ?? {};
  const createdTasksSource = Array.isArray(record.created_tasks)
    ? record.created_tasks
    : Array.isArray(record.createdTasks)
      ? record.createdTasks
      : [];

  const idCandidate = record._id ?? record.id ?? record.run_id ?? record.runId;
  const id = typeof idCandidate === 'string' && idCandidate.length > 0 ? idCandidate : `run-${index}`;

  const prompt =
    (typeof record.prompt === 'string' && record.prompt) ||
    (typeof record.input === 'string' && record.input) ||
    '';
  const outputText =
    (typeof record.output_text === 'string' && record.output_text) ||
    (typeof record.outputText === 'string' && record.outputText) ||
    (typeof record.result === 'string' && record.result) ||
    undefined;
  const errorMessage =
    (typeof record.error_message === 'string' && record.error_message) ||
    (typeof record.errorMessage === 'string' && record.errorMessage) ||
    (typeof errorRecord.message === 'string' && errorRecord.message) ||
    undefined;
  const model = typeof record.model === 'string' ? record.model : undefined;
  const createTasks =
    (typeof record.create_tasks === 'boolean' && record.create_tasks) ||
    (typeof record.createTasks === 'boolean' && record.createTasks) ||
    false;
  const taskLimit =
    (typeof record.task_limit === 'number' && Number.isFinite(record.task_limit) ? record.task_limit : undefined) ||
    (typeof record.taskLimit === 'number' && Number.isFinite(record.taskLimit) ? record.taskLimit : undefined);
  const targetStageId =
    (typeof record.target_stage_id === 'string' && record.target_stage_id) ||
    (typeof record.targetStageId === 'string' && record.targetStageId) ||
    undefined;
  const createdTasksCount =
    (typeof record.created_tasks_count === 'number' && Number.isFinite(record.created_tasks_count)
      ? record.created_tasks_count
      : undefined) ||
    (typeof record.createdTasksCount === 'number' && Number.isFinite(record.createdTasksCount)
      ? record.createdTasksCount
      : undefined);
  const createdTasks = createdTasksSource
    .map((item) => {
      const asObj = asRecord(item);
      const title =
        (typeof asObj.title === 'string' && asObj.title) ||
        (typeof asObj.task_title === 'string' && asObj.task_title) ||
        '';
      if (!title) {
        return null;
      }
      return {
        id:
          (typeof asObj._id === 'string' && asObj._id) ||
          (typeof asObj.id === 'string' && asObj.id) ||
          undefined,
        issueKey:
          (typeof asObj.issue_key === 'string' && asObj.issue_key) ||
          (typeof asObj.issueKey === 'string' && asObj.issueKey) ||
          undefined,
        title,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const createdAt =
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.createdAt === 'string' && record.createdAt) ||
    undefined;
  const updatedAt =
    (typeof record.updated_at === 'string' && record.updated_at) ||
    (typeof record.updatedAt === 'string' && record.updatedAt) ||
    undefined;

  return {
    id,
    status: toAgentRunStatus(record.status),
    prompt,
    model,
    createTasks,
    taskLimit,
    targetStageId,
    createdTasksCount: createdTasksCount ?? createdTasks.length,
    createdTasks,
    outputText,
    errorMessage,
    createdAt,
    updatedAt,
    raw: record,
  };
};

export const normalizeDirection = (value: unknown, index = 0): DirectionTag => {
  const parsed = directionSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const name =
    (typeof record.name === 'string' && record.name.trim()) || `Направление ${index + 1}`;

  return {
    id: normalizeId(record, `direction-${index}`),
    name,
    raw: record,
  };
};

export const normalizeAuthProfile = (value: unknown): AuthProfile => {
  const parsed = meSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const username =
    (typeof record.username === 'string' && record.username) ||
    (typeof record.name === 'string' && record.name) ||
    'User';

  const email = typeof record.email === 'string' ? record.email : '';
  const authProvider =
    (typeof record.auth_provider === 'string' && record.auth_provider) ||
    (typeof record.authProvider === 'string' && record.authProvider) ||
    (typeof record.provider === 'string' && record.provider) ||
    'local';

  const createdAt =
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.createdAt === 'string' && record.createdAt) ||
    undefined;

  const telegramUsername =
    (typeof record.telegramUsername === 'string' && record.telegramUsername) ||
    (typeof record.telegram_username === 'string' && record.telegram_username) ||
    null;

  return {
    id: normalizeId(record, 'me'),
    username,
    email,
    authProvider,
    createdAt,
    telegramUsername,
    raw: record,
  };
};

const getNumber = (record: Record<string, unknown>, key: string): number => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const toAdminActionSource = (value: unknown): AdminActionSource => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  return normalized === 'web' || normalized === 'cli' || normalized === 'mcp' || normalized === 'unknown'
    ? (normalized as AdminActionSource)
    : 'unknown';
};

const toAdminActionAuthType = (value: unknown): AdminActionAuthType => {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  return normalized === 'pat' ? 'pat' : 'jwt';
};

export const normalizeAdminActionLog = (value: unknown, index = 0): AdminActionLog => {
  const parsed = adminActionLogSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const userRecord = pickRecordFromPossibleKeys(record, ['user']);
  const tokenRecord = pickRecordFromPossibleKeys(record, ['token']);

  return {
    id: normalizeId(record, `action-${index}`),
    createdAt:
      (typeof record.created_at === 'string' && record.created_at) ||
      (typeof record.createdAt === 'string' && record.createdAt) ||
      undefined,
    source: toAdminActionSource(record.source),
    authType: toAdminActionAuthType(record.auth_type ?? record.authType),
    method: typeof record.method === 'string' ? record.method : 'GET',
    path: typeof record.path === 'string' ? record.path : '/',
    statusCode:
      (typeof record.status_code === 'number' && Number.isFinite(record.status_code) ? record.status_code : undefined) ||
      (typeof record.statusCode === 'number' && Number.isFinite(record.statusCode) ? record.statusCode : undefined),
    durationMs:
      (typeof record.duration_ms === 'number' && Number.isFinite(record.duration_ms) ? record.duration_ms : undefined) ||
      (typeof record.durationMs === 'number' && Number.isFinite(record.durationMs) ? record.durationMs : undefined),
    ip: typeof record.ip === 'string' ? record.ip : undefined,
    userAgent:
      (typeof record.user_agent === 'string' && record.user_agent) ||
      (typeof record.userAgent === 'string' && record.userAgent) ||
      undefined,
    user: userRecord
      ? {
          id: typeof userRecord.id === 'string' ? userRecord.id : typeof userRecord._id === 'string' ? userRecord._id : undefined,
          email: typeof userRecord.email === 'string' ? userRecord.email : undefined,
          username: typeof userRecord.username === 'string' ? userRecord.username : undefined,
        }
      : null,
    token: tokenRecord
      ? {
          id:
            typeof tokenRecord.id === 'string'
              ? tokenRecord.id
              : typeof tokenRecord._id === 'string'
                ? tokenRecord._id
                : undefined,
          name: typeof tokenRecord.name === 'string' ? tokenRecord.name : undefined,
          tokenPrefix:
            (typeof tokenRecord.token_prefix === 'string' && tokenRecord.token_prefix) ||
            (typeof tokenRecord.tokenPrefix === 'string' && tokenRecord.tokenPrefix) ||
            undefined,
        }
      : null,
    raw: record,
  };
};

export const normalizeAdminStat = (value: unknown): AdminStat => {
  const parsed = adminStatSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const actionsBySourceRaw = Array.isArray(record.actionsBySource) ? record.actionsBySource : Array.isArray(record.actions_by_source) ? record.actions_by_source : [];
  const actionsByAuthRaw = Array.isArray(record.actionsByAuth) ? record.actionsByAuth : Array.isArray(record.actions_by_auth) ? record.actions_by_auth : [];
  const recentActionsRaw = Array.isArray(record.recentActions) ? record.recentActions : Array.isArray(record.recent_actions) ? record.recent_actions : [];

  const num = (camel: string, snake: string) => getNumber(record, camel) || getNumber(record, snake);

  return {
    users: getNumber(record, 'users'),
    devUsers: num('devUsers', 'dev_users'),
    adminUsers: num('adminUsers', 'admin_users'),
    localUsers: num('localUsers', 'local_users'),
    ghUsers: num('ghUsers', 'gh_users'),
    projects: getNumber(record, 'projects'),
    activeProjects: num('activeProjects', 'active_projects'),
    completedProjects: num('completedProjects', 'completed_projects'),
    stages: getNumber(record, 'stages'),
    waitingStages: num('waitingStages', 'waiting_stages'),
    activeStages: num('activeStages', 'active_stages'),
    reviewStages: num('reviewStages', 'review_stages'),
    completedStages: num('completedStages', 'completed_stages'),
    actionsTotal: num('actionsTotal', 'actions_total'),
    actionsBySource: actionsBySourceRaw.map((item) => {
      const asObj = asRecord(item);
      return {
        source: toAdminActionSource(asObj.source),
        count: getNumber(asObj, 'count'),
      };
    }),
    actionsByAuth: actionsByAuthRaw.map((item) => {
      const asObj = asRecord(item);
      return {
        authType: toAdminActionAuthType(asObj.authType ?? asObj.auth_type),
        count: getNumber(asObj, 'count'),
      };
    }),
    recentActions: recentActionsRaw.map(normalizeAdminActionLog),
    raw: record,
  };
};

export const normalizeTeam = (value: unknown, index = 0): Team => {
  const parsed = teamSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const nestedTeam = pickRecordFromPossibleKeys(record, ['team']);

  const name =
    (typeof record.name === 'string' && record.name) ||
    (typeof record.team_name === 'string' && record.team_name) ||
    (typeof record.teamName === 'string' && record.teamName) ||
    (nestedTeam && typeof nestedTeam.name === 'string' && nestedTeam.name) ||
    (nestedTeam && typeof nestedTeam.team_name === 'string' && nestedTeam.team_name) ||
    `Команда ${index + 1}`;

  const role =
    (typeof record.role === 'string' && record.role) ||
    (typeof record.myRole === 'string' && record.myRole) ||
    (typeof record.my_role === 'string' && record.my_role) ||
    (typeof record.membership_role === 'string' && record.membership_role) ||
    (typeof record.member_role === 'string' && record.member_role) ||
    (typeof record.team_role === 'string' && record.team_role) ||
    (nestedTeam && typeof nestedTeam.role === 'string' ? nestedTeam.role : undefined);

  const idCandidate =
    record._id ??
    record.id ??
    record.team_id ??
    record.teamId ??
    nestedTeam?._id ??
    nestedTeam?.id;
  const id = typeof idCandidate === 'string' && idCandidate.length > 0 ? idCandidate : `team-${index}`;

  return {
    id,
    name,
    role,
    raw: record,
  };
};

export const normalizeTeamInvitePreview = (value: unknown): TeamInvitePreview => {
  const parsed = teamInvitePreviewSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const nestedTeam = pickRecordFromPossibleKeys(record, ['team']);
  const nestedInviter = pickRecordFromPossibleKeys(record, ['inviter']);

  const teamName =
    (typeof record.team_name === 'string' && record.team_name) ||
    (typeof record.teamName === 'string' && record.teamName) ||
    (nestedTeam && typeof nestedTeam.name === 'string' ? nestedTeam.name : '') ||
    'Команда';

  const inviterName =
    (typeof record.inviter_name === 'string' && record.inviter_name) ||
    (typeof record.inviterName === 'string' && record.inviterName) ||
    (nestedInviter && typeof nestedInviter.username === 'string' ? nestedInviter.username : undefined) ||
    (nestedInviter && typeof nestedInviter.name === 'string' ? nestedInviter.name : undefined);

  const email = typeof record.email === 'string' ? record.email : undefined;
  const expiresAt =
    (typeof record.expires_at === 'string' && record.expires_at) ||
    (typeof record.expiresAt === 'string' && record.expiresAt) ||
    undefined;
  const acceptedAt =
    (typeof record.accepted_at === 'string' && record.accepted_at) ||
    (typeof record.acceptedAt === 'string' && record.acceptedAt) ||
    undefined;

  return {
    teamName,
    inviterName,
    email,
    expiresAt,
    acceptedAt,
    valid: typeof record.valid === 'boolean' ? record.valid : undefined,
    raw: record,
  };
};

export const normalizeTeamDetails = (value: unknown): TeamDetails => {
  const parsed = teamDetailsSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const nestedStats = pickRecordFromPossibleKeys(record, ['stats']) ?? {};

  const name =
    (typeof record.name === 'string' && record.name) ||
    (typeof record.team_name === 'string' && record.team_name) ||
    'Команда';

  const ownerId =
    (typeof record.owner_id === 'string' && record.owner_id) ||
    (typeof record.ownerId === 'string' && record.ownerId) ||
    undefined;

  const myRole =
    (typeof record.myRole === 'string' && record.myRole) ||
    (typeof record.my_role === 'string' && record.my_role) ||
    (typeof record.role === 'string' && record.role) ||
    undefined;

  const members = typeof nestedStats.members === 'number' ? nestedStats.members : 0;
  const projects = typeof nestedStats.projects === 'number' ? nestedStats.projects : 0;

  return {
    id: normalizeId(record, 'team'),
    name,
    ownerId,
    myRole,
    stats: {
      members,
      projects,
    },
    raw: record,
  };
};

export const normalizeTeamMember = (value: unknown, index = 0): TeamMember => {
  const parsed = teamMemberSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);
  const nestedUser = pickRecordFromPossibleKeys(record, ['user']) ?? {};

  const username =
    (typeof record.username === 'string' && record.username) ||
    (typeof record.name === 'string' && record.name) ||
    (typeof nestedUser.username === 'string' && nestedUser.username) ||
    (typeof nestedUser.name === 'string' && nestedUser.name) ||
    `member-${index + 1}`;

  const email =
    (typeof record.email === 'string' && record.email) ||
    (typeof nestedUser.email === 'string' && nestedUser.email) ||
    '';

  const role = (typeof record.role === 'string' && record.role) || 'member';

  const idCandidate =
    record._id ??
    record.id ??
    record.user_id ??
    record.userId ??
    nestedUser._id ??
    nestedUser.id;
  const id = typeof idCandidate === 'string' && idCandidate.length > 0 ? idCandidate : `member-${index}`;

  const telegramUsername =
    (typeof record.telegramUsername === 'string' && record.telegramUsername) ||
    (typeof record.telegram_username === 'string' && record.telegram_username) ||
    (typeof nestedUser.telegramUsername === 'string' && nestedUser.telegramUsername) ||
    (typeof nestedUser.telegram_username === 'string' && nestedUser.telegram_username) ||
    null;

  return {
    id,
    username,
    email,
    role,
    telegramUsername,
    raw: record,
  };
};

export const normalizeTeamActiveInvite = (value: unknown, index = 0): TeamActiveInvite => {
  const parsed = teamActiveInviteSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const email = typeof record.email === 'string' ? record.email : '';
  const invitedBy =
    (typeof record.invited_by === 'string' && record.invited_by) ||
    (typeof record.invitedBy === 'string' && record.invitedBy) ||
    undefined;
  const createdAt =
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.createdAt === 'string' && record.createdAt) ||
    undefined;
  const expiresAt =
    (typeof record.expires_at === 'string' && record.expires_at) ||
    (typeof record.expiresAt === 'string' && record.expiresAt) ||
    undefined;

  return {
    id: normalizeId(record, `invite-${index}`),
    email,
    invitedBy,
    createdAt,
    expiresAt,
    raw: record,
  };
};

export const normalizeApiToken = (value: unknown, index = 0): ApiToken => {
  const parsed = apiTokenSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const tokenPrefix =
    (typeof record.token_prefix === 'string' && record.token_prefix) ||
    (typeof record.tokenPrefix === 'string' && record.tokenPrefix) ||
    '';
  const lastUsedAt =
    (typeof record.last_used_at === 'string' && record.last_used_at) ||
    (typeof record.lastUsedAt === 'string' && record.lastUsedAt) ||
    undefined;
  const expiresAt =
    (typeof record.expires_at === 'string' && record.expires_at) ||
    (typeof record.expiresAt === 'string' && record.expiresAt) ||
    undefined;
  const revokedAt =
    (typeof record.revoked_at === 'string' && record.revoked_at) ||
    (typeof record.revokedAt === 'string' && record.revokedAt) ||
    undefined;
  const createdAt =
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.createdAt === 'string' && record.createdAt) ||
    undefined;

  return {
    id: normalizeId(record, `token-${index}`),
    name: typeof record.name === 'string' && record.name ? record.name : `Токен ${index + 1}`,
    tokenPrefix,
    lastUsedAt,
    expiresAt,
    revokedAt,
    createdAt,
    raw: record,
  };
};

export const normalizeCreatedApiToken = (value: unknown): CreatedApiToken => {
  const parsed = apiTokenSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const tokenPrefix =
    (typeof record.token_prefix === 'string' && record.token_prefix) ||
    (typeof record.tokenPrefix === 'string' && record.tokenPrefix) ||
    '';
  const expiresAt =
    (typeof record.expires_at === 'string' && record.expires_at) ||
    (typeof record.expiresAt === 'string' && record.expiresAt) ||
    undefined;
  const createdAt =
    (typeof record.created_at === 'string' && record.created_at) ||
    (typeof record.createdAt === 'string' && record.createdAt) ||
    undefined;

  return {
    id: normalizeId(record, 'token'),
    name: typeof record.name === 'string' && record.name ? record.name : 'Новый токен',
    token: typeof record.token === 'string' ? record.token : '',
    tokenPrefix,
    expiresAt,
    createdAt,
    raw: record,
  };
};

const formatContractIssues = (issues: z.ZodIssue[]): string => {
  return issues
    .map((issue) => {
      const field = issue.path.join('.') || 'payload';
      return `${field}: ${issue.message}`;
    })
    .join('; ');
};

export const parseApiTokenContract = (value: unknown): ApiToken => {
  const normalized = normalizeApiToken(value);
  const payload = {
    id: normalized.id,
    name: normalized.name,
    tokenPrefix: normalized.tokenPrefix,
    lastUsedAt: normalized.lastUsedAt ?? null,
    expiresAt: normalized.expiresAt ?? null,
    revokedAt: normalized.revokedAt ?? null,
    createdAt: normalized.createdAt,
  };

  const parsed = apiTokenContractSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid ApiToken payload: ${formatContractIssues(parsed.error.issues)}`);
  }

  return normalized;
};

export const parseCreatedApiTokenContract = (value: unknown): CreatedApiToken => {
  const normalized = normalizeCreatedApiToken(value);
  const payload = {
    id: normalized.id,
    name: normalized.name,
    token: normalized.token,
    tokenPrefix: normalized.tokenPrefix,
    expiresAt: normalized.expiresAt ?? null,
    createdAt: normalized.createdAt,
  };

  const parsed = createdApiTokenContractSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid CreatedApiToken payload: ${formatContractIssues(parsed.error.issues)}`);
  }

  return normalized;
};

const normalizeCollection = <T>(
  value: unknown,
  keys: string[],
  mapper: (item: unknown, index: number) => T,
): T[] => {
  if (Array.isArray(value)) {
    return value.map(mapper);
  }

  const asObj = asRecord(value);
  const directArray = pickArrayFromPossibleKeys(asObj, keys);
  if (directArray.length > 0) {
    return directArray.map(mapper);
  }

  return [];
};

export const extractProjects = (value: unknown): Project[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeProject);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['projects', 'data', 'items']);
  if (directArray.length > 0) {
    return directArray.map(normalizeProject);
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeProject);
  }

  return [];
};

export const extractStages = (value: unknown): Stage[] =>
  normalizeCollection(value, ['stages', 'data', 'items'], normalizeStage);

export const extractTasks = (value: unknown): Task[] =>
  normalizeCollection(value, ['tasks', 'data', 'items'], normalizeTask);

export const extractAgentRuns = (value: unknown): AgentRun[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeAgentRun);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data', 'run', 'item']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['runs', 'data', 'items']);
  if (directArray.length > 0) {
    return directArray.map(normalizeAgentRun);
  }

  const likelySingleRun =
    typeof source._id === 'string' ||
    typeof source.id === 'string' ||
    typeof source.run_id === 'string' ||
    typeof source.runId === 'string';

  if (likelySingleRun) {
    return [normalizeAgentRun(source)];
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeAgentRun);
  }

  return [];
};

export const extractAgentRun = (value: unknown): AgentRun => {
  const items = extractAgentRuns(value);
  if (items.length > 0) {
    return items[0];
  }

  throw new Error('Invalid agent run payload');
};

export const extractDirections = (value: unknown): DirectionTag[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeDirection);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data', 'direction', 'item']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['directions', 'data', 'items']);
  if (directArray.length > 0) {
    return directArray.map(normalizeDirection);
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeDirection);
  }

  const likelySingleDirection =
    typeof source._id === 'string' ||
    typeof source.id === 'string' ||
    typeof source.name === 'string';

  if (likelySingleDirection) {
    return [normalizeDirection(source)];
  }

  return [];
};

export const extractDirection = (value: unknown): DirectionTag => {
  const items = extractDirections(value);
  if (items.length > 0) {
    return items[0];
  }

  throw new Error('Invalid direction payload');
};

export const extractTeams = (value: unknown): Team[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeTeam);
  }

  const asObj = asRecord(value);
  const directArray = pickArrayFromPossibleKeys(
    asObj,
    ['teams', 'data', 'items', 'memberships', 'team_members', 'teamMembers'],
  );

  if (directArray.length > 0) {
    return directArray.map(normalizeTeam);
  }

  const fallbackArray = pickFirstArrayValue(asObj);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeTeam);
  }

  const likelySingleTeam =
    typeof asObj._id === 'string' ||
    typeof asObj.id === 'string' ||
    typeof asObj.team_id === 'string' ||
    typeof asObj.teamId === 'string' ||
    typeof asObj.name === 'string' ||
    typeof asObj.team_name === 'string' ||
    typeof asObj.teamName === 'string';

  if (likelySingleTeam) {
    return [normalizeTeam(asObj)];
  }

  return [];
};

export const extractTeam = (value: unknown): Team => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['team', 'data']);
  return normalizeTeam(nested ?? asObj);
};

export const extractTeamDetails = (value: unknown): TeamDetails => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data', 'team']);
  return normalizeTeamDetails(nested ?? asObj);
};

export const extractTeamMembers = (value: unknown): TeamMember[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeTeamMember);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['members', 'items', 'data']);
  if (directArray.length > 0) {
    return directArray.map(normalizeTeamMember);
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeTeamMember);
  }

  return [];
};

export const extractTeamActiveInvites = (value: unknown): TeamActiveInvite[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeTeamActiveInvite);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['invites', 'items', 'data']);
  if (directArray.length > 0) {
    return directArray.map(normalizeTeamActiveInvite);
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeTeamActiveInvite);
  }

  return [];
};

export const extractApiTokens = (value: unknown): ApiToken[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeApiToken);
  }

  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const source = nested ?? asObj;

  const directArray = pickArrayFromPossibleKeys(source, ['tokens', 'items', 'data']);
  if (directArray.length > 0) {
    return directArray.map(normalizeApiToken);
  }

  const fallbackArray = pickFirstArrayValue(source);
  if (fallbackArray.length > 0) {
    return fallbackArray.map(normalizeApiToken);
  }

  return [];
};

export const extractCreatedApiToken = (value: unknown): CreatedApiToken => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data', 'token']);
  return normalizeCreatedApiToken(nested ?? asObj);
};

export const extractTeamProjects = (value: unknown): TeamProjectsPayload => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const source = nested ?? asObj;

  const myRole =
    (typeof source.myRole === 'string' && source.myRole) ||
    (typeof source.my_role === 'string' && source.my_role) ||
    (typeof source.role === 'string' && source.role) ||
    (typeof asObj.myRole === 'string' && asObj.myRole) ||
    (typeof asObj.my_role === 'string' && asObj.my_role) ||
    (typeof asObj.role === 'string' && asObj.role) ||
    undefined;

  return {
    myRole,
    projects: extractProjects(source),
    raw: source,
  };
};

export const extractProject = (value: unknown): Project => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['project', 'data']);
  return normalizeProject(nested ?? asObj);
};

export const extractStage = (value: unknown): Stage => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['stage', 'data']);
  return normalizeStage(nested ?? asObj);
};

export const extractShareLink = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  const asObj = asRecord(value);
  const candidates = [
    asObj.share_link,
    asObj.shareLink,
    asObj.client_url,
    asObj.clientUrl,
    asObj.link,
    asObj.url,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      if (candidate.startsWith('/p/')) {
        return candidate;
      }

      try {
        const parsed = new URL(candidate);
        if (parsed.pathname.startsWith('/p/')) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // Keep original string if it is not a valid absolute URL.
      }

      return candidate;
    }
  }

  return '';
};

export const extractToken = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  const asObj = asRecord(value);
  const tokenCandidates = [asObj.token, asObj.jwt, asObj.accessToken];
  for (const candidate of tokenCandidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return '';
};

export const extractAuthProfile = (value: unknown): AuthProfile => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['user', 'data', 'profile']);
  return normalizeAuthProfile(nested ?? asObj);
};

export const extractAdminStat = (value: unknown): AdminStat => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['stats', 'data', 'stat']);
  return normalizeAdminStat(nested ?? asObj);
};

export const extractAdminActionLogs = (value: unknown): AdminActionLogsPayload => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['data']);
  const dataSource = nested ?? asObj;
  const rows = Array.isArray(dataSource.data)
    ? dataSource.data
    : Array.isArray(asObj.data)
      ? asObj.data
      : [];

  return {
    limit: getNumber(asObj, 'limit') || 50,
    count: getNumber(asObj, 'count') || rows.length,
    data: rows.map(normalizeAdminActionLog),
    raw: asObj,
  };
};

export const extractTeamInvitePreview = (value: unknown): TeamInvitePreview => {
  const asObj = asRecord(value);
  const nested = pickRecordFromPossibleKeys(asObj, ['invite', 'data', 'team_invite']);
  return normalizeTeamInvitePreview(nested ?? asObj);
};

export const extractInviteUrl = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  const asObj = asRecord(value);
  const candidates = [asObj.invite_url, asObj.inviteUrl, asObj.url, asObj.link];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  return '';
};

export const extractPublicShare = (value: unknown, shareToken: string): PublicSharePayload => {
  const asObj = asRecord(value);
  const isProjectLike = (record: Record<string, unknown>): boolean =>
    typeof record.project_name === 'string' ||
    typeof record.name === 'string' ||
    typeof record._id === 'string' ||
    typeof record.id === 'string' ||
    typeof record.workflow_type === 'string' ||
    typeof record.workflowType === 'string';

  const directProject = pickRecordFromPossibleKeys(asObj, ['project']);
  const dataCandidate = pickRecordFromPossibleKeys(asObj, ['data']);
  const nestedProject = dataCandidate ? pickRecordFromPossibleKeys(dataCandidate, ['project']) : null;
  const projectSource = directProject ?? nestedProject ?? (dataCandidate && isProjectLike(dataCandidate) ? dataCandidate : null);
  const project = projectSource ? normalizeProject(projectSource) : undefined;
  const rootWorkflowType =
    asObj.workflow_type === 'stages' || asObj.workflow_type === 'flat'
      ? asObj.workflow_type
      : asObj.workflowType === 'stages' || asObj.workflowType === 'flat'
        ? asObj.workflowType
        : undefined;
  const workflowType = rootWorkflowType || project?.workflowType || 'stages';
  const collectionSource = dataCandidate ?? asObj;
  const stages = workflowType === 'stages' ? extractStages(collectionSource) : [];
  const tasks = workflowType === 'flat' ? extractTasks(collectionSource) : [];
  const approved =
    typeof asObj.approved === 'boolean'
      ? asObj.approved
      : typeof collectionSource.approved === 'boolean'
        ? collectionSource.approved
        : undefined;

  return {
    shareToken,
    project,
    workflowType,
    stages,
    tasks,
    approved,
    raw: asObj,
  };
};
