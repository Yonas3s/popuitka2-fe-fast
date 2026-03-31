import { http, HttpResponse } from 'msw';

type ProjectRecord = {
  _id: string;
  project_name: string;
  team_id?: string;
  status?: 'active' | 'completed';
  workflow_type?: 'stages' | 'flat';
  share_link?: string;
};

type StageRecord = {
  _id: string;
  stage_name: string;
  description?: string;
  work_link?: string;
  review_requested?: boolean;
  status?: 'active' | 'waiting' | 'review' | 'completed';
};

type TaskRecord = {
  _id: string;
  title: string;
  issue_key?: string;
  description?: string;
  done: boolean;
  task_type: 'task' | 'bug' | 'feature' | 'improvement' | 'chore';
  direction_ids: string[];
  assignee_user_id?: string | null;
};

type AgentRunRecord = {
  _id: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output_text?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  poll_count: number;
  finish_status: 'completed' | 'failed';
};

type DirectionRecord = {
  _id: string;
  project_id: string;
  name: string;
};

type TeamRecord = {
  _id: string;
  name: string;
  role?: string;
  owner_id?: string;
};

type TeamInviteRecord = {
  id: string;
  teamId: string;
  email: string;
  inviterName: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
};

type TeamMemberRecord = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type ApiTokenRecord = {
  _id: string;
  name: string;
  token_prefix: string;
  token?: string;
  last_used_at?: string;
  expires_at?: string;
  revoked_at?: string;
  created_at: string;
};

type ActionLogRecord = {
  _id: string;
  created_at: string;
  source: 'web' | 'cli' | 'mcp' | 'unknown';
  auth_type: 'jwt' | 'pat';
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  ip?: string;
  user_agent?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  } | null;
  token?: {
    id: string;
    name: string;
    token_prefix: string;
  } | null;
};

const state = {
  projects: [{ _id: 'p1', project_name: 'Demo Project', status: 'active', workflow_type: 'stages' }] as ProjectRecord[],
  stagesByProject: {
    p1: [{ _id: 's1', stage_name: 'Init', description: 'Start stage', status: 'active' }],
  } as Record<string, StageRecord[]>,
  directionsByProject: {
    p1: [
      { _id: 'dir-1', project_id: 'p1', name: 'Backend' },
      { _id: 'dir-2', project_id: 'p1', name: 'Frontend' },
    ],
  } as Record<string, DirectionRecord[]>,
  tasksByProject: {
    p1: [],
  } as Record<string, TaskRecord[]>,
  agentRunsByProject: {
    p1: [],
  } as Record<string, AgentRunRecord[]>,
  tasksByStage: {
    s1: [
      {
        _id: 't1',
        title: 'First task',
        issue_key: 'ul-1',
        description: 'Первое описание задачи',
        done: false,
        task_type: 'task',
        direction_ids: ['dir-1'],
        assignee_user_id: null,
      },
    ],
  } as Record<string, TaskRecord[]>,
  shareByToken: {
    'public-token-1': { projectId: 'p1', approved: false },
  } as Record<string, { projectId: string; approved: boolean }>,
  teams: [{ _id: 'team-1', name: 'unit-labs', role: 'owner', owner_id: '698b1202cb65b668e76f6c88' }] as TeamRecord[],
  teamMembersByTeam: {
    'team-1': [
      {
        id: '698b1202cb65b668e76f6c88',
        username: 'yokio4242',
        email: 'gud.pro2018@yandex.ru',
        role: 'owner',
      },
      {
        id: 'teammate-1',
        username: 'teammate',
        email: 'teammate@example.com',
        role: 'member',
      },
    ],
  } as Record<string, TeamMemberRecord[]>,
  teamInvites: {} as Record<string, TeamInviteRecord>,
  apiTokens: [
    {
      _id: 'tok-1',
      name: 'Deploy CI',
      token_prefix: 'ul_live_deploy',
      last_used_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as ApiTokenRecord[],
  actionLogs: [
    {
      _id: 'act-1',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      source: 'web',
      auth_type: 'jwt',
      method: 'GET',
      path: '/projects',
      status_code: 200,
      duration_ms: 44,
      ip: '127.0.0.1',
      user_agent: 'Mozilla/5.0',
      user: {
        id: '698b1202cb65b668e76f6c88',
        email: 'gud.pro2018@yandex.ru',
        username: 'yokio4242',
      },
      token: null,
    },
    {
      _id: 'act-2',
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      source: 'cli',
      auth_type: 'pat',
      method: 'POST',
      path: '/projects',
      status_code: 201,
      duration_ms: 89,
      ip: '127.0.0.1',
      user_agent: 'unit-labs-cli/1.0.0',
      user: {
        id: '698b1202cb65b668e76f6c88',
        email: 'gud.pro2018@yandex.ru',
        username: 'yokio4242',
      },
      token: {
        id: 'tok-1',
        name: 'Deploy CI',
        token_prefix: 'ul_live_deploy',
      },
    },
  ] as ActionLogRecord[],
};

const isAuthorized = (request: Request): boolean => Boolean(request.headers.get('authorization'));
const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const getProjectById = (projectId: string) => state.projects.find((project) => project._id === projectId);
const getWorkflowType = (project?: ProjectRecord): 'stages' | 'flat' =>
  project?.workflow_type === 'flat' ? 'flat' : 'stages';

export const handlers = [
  http.get(/.*\/health$/, () => HttpResponse.json('ok')),

  http.post(/.*\/signup$/, async () => HttpResponse.json({ ok: true }, { status: 201 })),
  http.post(/.*\/signin$/, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body?.email) {
      return HttpResponse.json({ message: 'email required' }, { status: 400 });
    }

    return HttpResponse.json({ token: 'jwt-token' });
  }),

  http.get(/.*\/me$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      username: 'yokio4242',
      id: '698b1202cb65b668e76f6c88',
      email: 'gud.pro2018@yandex.ru',
      auth_provider: 'local',
      created_at: '2026-02-10T11:09:54.132Z',
    });
  }),

  http.get(/.*\/stat$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const actionsBySource = ['web', 'cli', 'mcp', 'unknown'].map((source) => ({
      source,
      count: state.actionLogs.filter((log) => log.source === source).length,
    }));
    const actionsByAuth = ['jwt', 'pat'].map((auth_type) => ({
      auth_type,
      count: state.actionLogs.filter((log) => log.auth_type === auth_type).length,
    }));

    return HttpResponse.json({
      users: 2,
      dev_users: 0,
      admin_users: 2,
      local_users: 1,
      gh_users: 1,
      projects: 3,
      active_projects: 3,
      completed_projects: 0,
      stages: 5,
      waiting_stages: 0,
      active_stages: 2,
      review_stages: 0,
      completed_stages: 3,
      actions_total: state.actionLogs.length,
      actions_by_source: actionsBySource,
      actions_by_auth: actionsByAuth,
      recent_actions: state.actionLogs.slice(0, 30),
    });
  }),

  http.get(/.*\/stat\/actions$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const source = url.searchParams.get('source') || '';
    const authType = url.searchParams.get('auth_type') || '';
    const requestedLimit = Number(url.searchParams.get('limit') || 50);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;

    const filtered = state.actionLogs
      .filter((log) => (source ? log.source === source : true))
      .filter((log) => (authType ? log.auth_type === authType : true))
      .slice(0, limit);

    return HttpResponse.json({
      status: 'ok',
      limit,
      count: filtered.length,
      data: filtered,
    });
  }),

  http.post(/.*\/forgot-password$/, async () => HttpResponse.json({ ok: true })),

  http.post(/.*\/verify-reset-code$/, async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body?.code === '000000') {
      return HttpResponse.json({ message: 'invalid code' }, { status: 400 });
    }

    return HttpResponse.json({ ok: true });
  }),

  http.post(/.*\/reset-password$/, async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (!body?.code) {
      return HttpResponse.json({ message: 'code required' }, { status: 400 });
    }

    return HttpResponse.json({ ok: true });
  }),

  http.get(/.*\/settings\/tokens$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      status: 'ok',
      data: state.apiTokens.map((token) => ({
        _id: token._id,
        name: token.name,
        token_prefix: token.token_prefix,
        last_used_at: token.last_used_at,
        expires_at: token.expires_at,
        revoked_at: token.revoked_at,
        created_at: token.created_at,
      })),
    });
  }),

  http.post(/.*\/settings\/tokens$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; expires_at?: string };
    const name = body.name?.trim();
    if (!name) {
      return HttpResponse.json({ message: 'name required' }, { status: 400 });
    }

    const createdAt = new Date().toISOString();
    const suffix = Math.random().toString(36).slice(2, 10);
    const tokenPrefix = `ul_${suffix.slice(0, 6)}`;
    const token: ApiTokenRecord = {
      _id: randomId('tok'),
      name,
      token_prefix: tokenPrefix,
      token: `ul_${suffix}${Math.random().toString(36).slice(2, 14)}`,
      expires_at: body.expires_at,
      created_at: createdAt,
    };

    state.apiTokens.unshift(token);

    return HttpResponse.json(
      {
        status: 'ok',
        data: {
          _id: token._id,
          name: token.name,
          token_prefix: token.token_prefix,
          token: token.token,
          expires_at: token.expires_at,
          created_at: token.created_at,
        },
      },
      { status: 201 },
    );
  }),

  http.delete(/.*\/settings\/tokens\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const tokenId = String(params[0]);
    const tokenIndex = state.apiTokens.findIndex((token) => token._id === tokenId);
    if (tokenIndex < 0) {
      return HttpResponse.json({ message: 'token not found' }, { status: 404 });
    }

    state.apiTokens[tokenIndex] = {
      ...state.apiTokens[tokenIndex],
      revoked_at: new Date().toISOString(),
    };

    return HttpResponse.json({ status: 'ok' });
  }),

  http.post(/.*\/teams$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string };
    const team: TeamRecord = {
      _id: randomId('team'),
      name: body.name || 'New Team',
      role: 'owner',
      owner_id: '698b1202cb65b668e76f6c88',
    };

    state.teams.unshift(team);
    state.teamMembersByTeam[team._id] = [
      {
        id: '698b1202cb65b668e76f6c88',
        username: 'yokio4242',
        email: 'gud.pro2018@yandex.ru',
        role: 'owner',
      },
    ];
    return HttpResponse.json(team, { status: 201 });
  }),

  http.get(/.*\/teams$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    return HttpResponse.json(state.teams);
  }),

  http.get(/.*\/teams\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const team = state.teams.find((item) => item._id === teamId);
    if (!team) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    return HttpResponse.json({
      status: 'ok',
      data: {
        id: team._id,
        name: team.name,
        owner_id: team.owner_id || '698b1202cb65b668e76f6c88',
        myRole: team.role || 'member',
        stats: {
          members: (state.teamMembersByTeam[teamId] || []).length,
          projects: 1,
        },
      },
    });
  }),

  http.get(/.*\/teams\/([^/]+)\/members$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const members = state.teamMembersByTeam[teamId];
    if (!members) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    return HttpResponse.json({
      status: 'ok',
      data: {
        members,
      },
    });
  }),

  http.get(/.*\/teams\/([^/]+)\/projects$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const team = state.teams.find((item) => item._id === teamId);
    if (!team) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    const projects = state.projects.filter((project) => project.team_id === teamId);
    return HttpResponse.json({
      status: 'ok',
      data: {
        myRole: team.role || 'member',
        projects,
      },
    });
  }),

  http.delete(/.*\/teams\/([^/]+)\/members\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const userId = String(params[1]);
    const team = state.teams.find((item) => item._id === teamId);
    if (!team) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    if (team.owner_id === userId) {
      return HttpResponse.json({ message: 'owner cannot remove self' }, { status: 400 });
    }

    const members = state.teamMembersByTeam[teamId] || [];
    state.teamMembersByTeam[teamId] = members.filter((member) => member.id !== userId);

    return HttpResponse.json({ status: 'ok' });
  }),

  http.post(/.*\/teams\/([^/]+)\/invite$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const team = state.teams.find((item) => item._id === teamId);
    if (!team) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return HttpResponse.json({ message: 'email required' }, { status: 400 });
    }

    const token = `invite-${Math.random().toString(16).slice(2, 14)}`;
    const createdAt = new Date().toISOString();
    state.teamInvites[token] = {
      id: token,
      teamId,
      email: body.email,
      inviterName: 'Yonas3s',
      invitedBy: '698b1202cb65b668e76f6c88',
      createdAt,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    return HttpResponse.json({
      invite_url: `https://unit-labs.ru/team-invite?token=${token}`,
    });
  }),

  http.get(/.*\/teams\/([^/]+)\/invites$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const team = state.teams.find((item) => item._id === teamId);
    if (!team) {
      return HttpResponse.json({ message: 'team not found' }, { status: 404 });
    }

    const now = Date.now();
    const invites = Object.values(state.teamInvites)
      .filter((invite) => invite.teamId === teamId)
      .filter((invite) => !invite.acceptedAt)
      .filter((invite) => new Date(invite.expiresAt).getTime() > now)
      .map((invite) => ({
        id: invite.id,
        email: invite.email,
        invited_by: invite.invitedBy,
        expires_at: invite.expiresAt,
        created_at: invite.createdAt,
      }));

    return HttpResponse.json({
      status: 'ok',
      data: invites,
    });
  }),

  http.post(/.*\/teams\/([^/]+)\/invites\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const teamId = String(params[0]);
    const inviteId = String(params[1]);
    const invite = state.teamInvites[inviteId];
    if (!invite || invite.teamId !== teamId) {
      return HttpResponse.json({ message: 'invite not found' }, { status: 404 });
    }

    delete state.teamInvites[inviteId];
    return HttpResponse.json({ status: 'ok' });
  }),

  http.get(/.*\/team-invites\/([^/]+)$/, async ({ params }) => {
    const token = String(params[0]);
    const invite = state.teamInvites[token];
    if (!invite) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const team = state.teams.find((item) => item._id === invite.teamId);

    return HttpResponse.json({
      team_name: team?.name || 'Команда',
      inviter_name: invite.inviterName,
      email: invite.email,
      expires_at: invite.expiresAt,
      accepted_at: invite.acceptedAt,
    });
  }),

  http.post(/.*\/team-invites\/([^/]+)\/accept$/, async ({ params }) => {
    const token = String(params[0]);
    const invite = state.teamInvites[token];
    if (!invite) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    state.teamInvites[token] = {
      ...invite,
      acceptedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ ok: true });
  }),

  http.get(/.*\/projects$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    return HttpResponse.json(state.projects);
  }),

  http.post(/.*\/projects$/, async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      project_name?: string;
      team_id?: string;
      workflow_type?: 'stages' | 'flat';
    };
    const workflowType = body.workflow_type === 'flat' ? 'flat' : 'stages';
    const project: ProjectRecord = {
      _id: randomId('p'),
      project_name: body.project_name || 'New project',
      team_id: body.team_id,
      status: 'active',
      workflow_type: workflowType,
    };

    state.projects.push(project);
    state.stagesByProject[project._id] = [];
    state.directionsByProject[project._id] = [];
    state.tasksByProject[project._id] = [];
    state.agentRunsByProject[project._id] = [];
    return HttpResponse.json(project, { status: 201 });
  }),

  http.get(/.*\/projects\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    return HttpResponse.json(project);
  }),

  http.get(/.*\/projects\/([^/]+)\/directions$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    return HttpResponse.json(state.directionsByProject[projectId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/directions$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const body = (await request.json()) as { name?: string };
    const name = String(body.name || '').trim();
    if (!name) {
      return HttpResponse.json({ message: 'name required' }, { status: 400 });
    }

    const existing = state.directionsByProject[projectId] || [];
    if (existing.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json({ message: 'direction already exists' }, { status: 409 });
    }

    const direction: DirectionRecord = {
      _id: randomId('dir'),
      project_id: projectId,
      name,
    };
    state.directionsByProject[projectId] = [...existing, direction];
    return HttpResponse.json(direction, { status: 201 });
  }),

  http.get(/.*\/projects\/([^/]+)\/stages$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }
    return HttpResponse.json(state.stagesByProject[projectId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/stages$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }
    const body = (await request.json()) as { stage_name?: string; description?: string };

    const stage: StageRecord = {
      _id: randomId('s'),
      stage_name: body.stage_name || 'Stage',
      description: body.description,
      status: 'waiting',
    };

    state.stagesByProject[projectId] = [...(state.stagesByProject[projectId] || []), stage];
    state.tasksByStage[stage._id] = [];
    return HttpResponse.json(stage, { status: 201 });
  }),

  http.get(/.*\/projects\/([^/]+)\/stages\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }
    const stageId = String(params[1]);
    const stage = (state.stagesByProject[projectId] || []).find((item) => item._id === stageId);

    if (!stage) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    return HttpResponse.json(stage);
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }
    const stageId = String(params[1]);
    const patch = (await request.json()) as Partial<StageRecord>;
    const stages = state.stagesByProject[projectId] || [];
    const index = stages.findIndex((item) => item._id === stageId);

    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    stages[index] = { ...stages[index], ...patch };
    state.stagesByProject[projectId] = stages;

    return HttpResponse.json(stages[index]);
  }),

  http.post(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/request-review$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }
    const stageId = String(params[1]);
    const stages = state.stagesByProject[projectId] || [];
    const stageIndex = stages.findIndex((stage) => stage._id === stageId);
    if (stageIndex >= 0) {
      stages[stageIndex] = { ...stages[stageIndex], status: 'review', review_requested: true };
      state.stagesByProject[projectId] = stages;
    }

    return HttpResponse.json({ ok: true });
  }),

  http.get(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    return HttpResponse.json(state.tasksByStage[stageId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const body = (await request.json()) as { title?: string };
    const task: TaskRecord = {
      _id: randomId('t'),
      title: body.title || 'Task',
      issue_key: `ul-${(state.tasksByStage[stageId] || []).length + 1}`,
      description: '',
      done: false,
      task_type: 'task',
      direction_ids: [],
      assignee_user_id: null,
    };

    state.tasksByStage[stageId] = [...(state.tasksByStage[stageId] || []), task];
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)\/toggle$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const tasks = state.tasksByStage[stageId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);

    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = { ...tasks[index], done: !tasks[index].done };
    state.tasksByStage[stageId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)\/title$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const body = (await request.json()) as { title?: string };

    const tasks = state.tasksByStage[stageId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);

    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = { ...tasks[index], title: body.title || tasks[index].title };
    state.tasksByStage[stageId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)\/assign$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const body = (await request.json()) as { assignee_user_id?: string | null; user_id?: string | null };
    const tasks = state.tasksByStage[stageId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = {
      ...tasks[index],
      assignee_user_id:
        (typeof body.user_id === 'string' && body.user_id) ||
        (typeof body.assignee_user_id === 'string' && body.assignee_user_id) ||
        null,
    };
    state.tasksByStage[stageId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)\/meta$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const body = (await request.json()) as {
      task_type?: TaskRecord['task_type'];
      direction_ids?: string[];
      description?: string;
    };
    const tasks = state.tasksByStage[stageId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const nextTaskType =
      typeof body.task_type === 'string' &&
      ['task', 'bug', 'feature', 'improvement', 'chore'].includes(body.task_type)
        ? (body.task_type as TaskRecord['task_type'])
        : tasks[index].task_type;
    const nextDirectionIds = Array.isArray(body.direction_ids)
      ? body.direction_ids.filter((id) => typeof id === 'string')
      : tasks[index].direction_ids;
    const nextDescription =
      typeof body.description === 'string'
        ? body.description
        : tasks[index].description ?? '';

    tasks[index] = {
      ...tasks[index],
      task_type: nextTaskType,
      direction_ids: nextDirectionIds,
      description: nextDescription,
    };
    state.tasksByStage[stageId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.delete(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const tasks = state.tasksByStage[stageId] || [];
    state.tasksByStage[stageId] = tasks.filter((task) => task._id !== taskId);

    return HttpResponse.json({ ok: true });
  }),

  http.get(/.*\/projects\/([^/]+)\/tasks$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    return HttpResponse.json(state.tasksByProject[projectId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/tasks$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const body = (await request.json()) as { title?: string };
    const task: TaskRecord = {
      _id: randomId('pt'),
      title: body.title || 'Task',
      issue_key: `ul-${(state.tasksByProject[projectId] || []).length + 1}`,
      description: '',
      done: false,
      task_type: 'task',
      direction_ids: [],
      assignee_user_id: null,
    };
    state.tasksByProject[projectId] = [...(state.tasksByProject[projectId] || []), task];
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch(/.*\/projects\/([^/]+)\/tasks\/([^/]+)\/toggle$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const taskId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const tasks = state.tasksByProject[projectId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = { ...tasks[index], done: !tasks[index].done };
    state.tasksByProject[projectId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/tasks\/([^/]+)\/title$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const taskId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const body = (await request.json()) as { title?: string };
    const tasks = state.tasksByProject[projectId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = { ...tasks[index], title: body.title || tasks[index].title };
    state.tasksByProject[projectId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/tasks\/([^/]+)\/assign$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const taskId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const body = (await request.json()) as { assignee_user_id?: string | null; user_id?: string | null };
    const tasks = state.tasksByProject[projectId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    tasks[index] = {
      ...tasks[index],
      assignee_user_id:
        (typeof body.user_id === 'string' && body.user_id) ||
        (typeof body.assignee_user_id === 'string' && body.assignee_user_id) ||
        null,
    };
    state.tasksByProject[projectId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.patch(/.*\/projects\/([^/]+)\/tasks\/([^/]+)\/meta$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const taskId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const body = (await request.json()) as {
      task_type?: TaskRecord['task_type'];
      direction_ids?: string[];
      description?: string;
    };
    const tasks = state.tasksByProject[projectId] || [];
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const nextTaskType =
      typeof body.task_type === 'string' &&
      ['task', 'bug', 'feature', 'improvement', 'chore'].includes(body.task_type)
        ? (body.task_type as TaskRecord['task_type'])
        : tasks[index].task_type;
    const nextDirectionIds = Array.isArray(body.direction_ids)
      ? body.direction_ids.filter((id) => typeof id === 'string')
      : tasks[index].direction_ids;
    const nextDescription =
      typeof body.description === 'string'
        ? body.description
        : tasks[index].description ?? '';

    tasks[index] = {
      ...tasks[index],
      task_type: nextTaskType,
      direction_ids: nextDirectionIds,
      description: nextDescription,
    };
    state.tasksByProject[projectId] = tasks;
    return HttpResponse.json(tasks[index]);
  }),

  http.delete(/.*\/projects\/([^/]+)\/tasks\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const taskId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (getWorkflowType(project) === 'stages') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const tasks = state.tasksByProject[projectId] || [];
    state.tasksByProject[projectId] = tasks.filter((task) => task._id !== taskId);

    return HttpResponse.json({ ok: true });
  }),

  http.get(/.*\/projects\/([^/]+)\/agent\/runs$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const runs = state.agentRunsByProject[projectId] || [];
    return HttpResponse.json({
      data: runs,
    });
  }),

  http.post(/.*\/projects\/([^/]+)\/agent\/runs$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const body = (await request.json()) as { prompt?: string };
    const prompt = String(body.prompt || '').trim();
    if (!prompt) {
      return HttpResponse.json({ message: 'prompt required' }, { status: 400 });
    }

    const shouldFail = /fail|ошиб/i.test(prompt);
    const now = new Date().toISOString();
    const run: AgentRunRecord = {
      _id: randomId('run'),
      prompt,
      status: 'running',
      created_at: now,
      updated_at: now,
      poll_count: 0,
      finish_status: shouldFail ? 'failed' : 'completed',
      output_text: shouldFail ? '' : `Агент выполнил задачу: ${prompt}`,
      error_message: shouldFail ? 'Агент не смог выполнить задачу' : '',
    };

    state.agentRunsByProject[projectId] = [run, ...(state.agentRunsByProject[projectId] || [])];
    return HttpResponse.json({
      data: run,
    }, { status: 201 });
  }),

  http.get(/.*\/projects\/([^/]+)\/agent\/runs\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const runId = String(params[1]);
    const project = getProjectById(projectId);
    if (!project) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const runs = state.agentRunsByProject[projectId] || [];
    const runIndex = runs.findIndex((item) => item._id === runId);
    if (runIndex < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const current = runs[runIndex];
    if (current.status === 'queued' || current.status === 'running') {
      const nextPollCount = current.poll_count + 1;
      if (nextPollCount >= 2) {
        runs[runIndex] = {
          ...current,
          poll_count: nextPollCount,
          status: current.finish_status,
          updated_at: new Date().toISOString(),
        };
      } else {
        runs[runIndex] = {
          ...current,
          poll_count: nextPollCount,
          status: 'running',
          updated_at: new Date().toISOString(),
        };
      }
      state.agentRunsByProject[projectId] = runs;
    }

    return HttpResponse.json({
      data: state.agentRunsByProject[projectId][runIndex],
    });
  }),

  http.post(/.*\/projects\/([^/]+)\/share-link$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    const token = `public-${projectId}`;
    state.shareByToken[token] = { projectId, approved: false };

    return HttpResponse.json({
      client_token: token,
      client_url: `/p/${token}`,
    });
  }),

  http.get(/.*\/p\/([^/]+)$/, async ({ params }) => {
    const token = String(params[0]);
    const entry = state.shareByToken[token];
    if (!entry) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const project = getProjectById(entry.projectId);
    const workflowType = getWorkflowType(project);
    const stages = workflowType === 'stages' ? state.stagesByProject[entry.projectId] || [] : [];
    const tasks = workflowType === 'flat' ? state.tasksByProject[entry.projectId] || [] : [];
    return HttpResponse.json({
      project,
      workflow_type: workflowType,
      stages,
      tasks,
      approved: entry.approved,
    });
  }),

  http.post(/.*\/p\/([^/]+)\/approve$/, async ({ params }) => {
    const token = String(params[0]);
    const entry = state.shareByToken[token];
    if (!entry) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    const project = getProjectById(entry.projectId);
    if (getWorkflowType(project) === 'flat') {
      return HttpResponse.json({ message: 'workflow mismatch' }, { status: 409 });
    }

    const stages = state.stagesByProject[entry.projectId] || [];
    const reviewStageIndex = stages.findIndex((stage) => stage.status === 'review');
    if (reviewStageIndex >= 0) {
      stages[reviewStageIndex] = { ...stages[reviewStageIndex], status: 'completed' };
      state.stagesByProject[entry.projectId] = stages;
    }

    state.shareByToken[token] = { ...entry, approved: true };
    return HttpResponse.json({ ok: true });
  }),
];
