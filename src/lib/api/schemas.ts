import { z } from 'zod';
import type { Project, PublicSharePayload, Stage, Task } from '../../types/models';

const recordSchema = z.record(z.unknown());

const projectSchema = z
  .object({
    _id: z.string().optional(),
    id: z.string().optional(),
    project_name: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
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

export const extractProjects = (value: unknown): Project[] =>
  normalizeCollection(value, ['projects', 'data', 'items'], normalizeProject);

export const extractStages = (value: unknown): Stage[] =>
  normalizeCollection(value, ['stages', 'data', 'items'], normalizeStage);

export const extractTasks = (value: unknown): Task[] =>
  normalizeCollection(value, ['tasks', 'data', 'items'], normalizeTask);

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
