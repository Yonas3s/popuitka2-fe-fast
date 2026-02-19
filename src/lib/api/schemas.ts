import { z } from 'zod';
import type {
  AdminStat,
  AuthProfile,
  Project,
  PublicSharePayload,
  Stage,
  Task,
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
    done: z.boolean().optional(),
    is_done: z.boolean().optional(),
    completed: z.boolean().optional(),
  })
  .passthrough();

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
  const id = record._id ?? record.id;
  return typeof id === 'string' && id.length > 0 ? id : fallback;
};

export const normalizeProject = (value: unknown, index = 0): Project => {
  const parsed = projectSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const projectName =
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
    shareLink,
    raw: record,
  };
};

export const normalizeStage = (value: unknown, index = 0): Stage => {
  const parsed = stageSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  const stageName =
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
    (typeof record.done === 'boolean' && record.done) ||
    (typeof record.is_done === 'boolean' && record.is_done) ||
    (typeof record.completed === 'boolean' && record.completed) ||
    false;

  return {
    id: normalizeId(record, `task-${index}`),
    title: typeof record.title === 'string' && record.title ? record.title : 'Без названия задачи',
    done,
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

  return {
    id: normalizeId(record, 'me'),
    username,
    email,
    authProvider,
    createdAt,
    raw: record,
  };
};

const getNumber = (record: Record<string, unknown>, key: string): number => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

export const normalizeAdminStat = (value: unknown): AdminStat => {
  const parsed = adminStatSchema.safeParse(value);
  const record = parsed.success ? (parsed.data as Record<string, unknown>) : asRecord(value);

  return {
    users: getNumber(record, 'users'),
    devUsers: getNumber(record, 'dev_users'),
    adminUsers: getNumber(record, 'admin_users'),
    localUsers: getNumber(record, 'local_users'),
    ghUsers: getNumber(record, 'gh_users'),
    projects: getNumber(record, 'projects'),
    activeProjects: getNumber(record, 'active_projects'),
    completedProjects: getNumber(record, 'completed_projects'),
    stages: getNumber(record, 'stages'),
    waitingStages: getNumber(record, 'waiting_stages'),
    activeStages: getNumber(record, 'active_stages'),
    reviewStages: getNumber(record, 'review_stages'),
    completedStages: getNumber(record, 'completed_stages'),
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

  return {
    id,
    username,
    email,
    role,
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
  const projectCandidate = pickRecordFromPossibleKeys(asObj, ['project', 'data']);

  const stages = extractStages(value);
  const approved = typeof asObj.approved === 'boolean' ? asObj.approved : undefined;

  return {
    shareToken,
    project: projectCandidate ? normalizeProject(projectCandidate) : undefined,
    stages,
    approved,
    raw: asObj,
  };
};
