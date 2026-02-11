import { http, HttpResponse } from 'msw';

type ProjectRecord = {
  _id: string;
  project_name: string;
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
  done: boolean;
};

const state = {
  projects: [{ _id: 'p1', project_name: 'Demo Project' }] as ProjectRecord[],
  stagesByProject: {
    p1: [{ _id: 's1', stage_name: 'Init', description: 'Start stage', status: 'active' }],
  } as Record<string, StageRecord[]>,
  tasksByStage: {
    s1: [{ _id: 't1', title: 'First task', done: false }],
  } as Record<string, TaskRecord[]>,
  shareByToken: {
    'public-token-1': { projectId: 'p1', approved: false },
  } as Record<string, { projectId: string; approved: boolean }>,
};

const isAuthorized = (request: Request): boolean => Boolean(request.headers.get('authorization'));
const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const getProjectById = (projectId: string) => state.projects.find((project) => project._id === projectId);

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

    const body = (await request.json()) as { project_name?: string };
    const project: ProjectRecord = {
      _id: randomId('p'),
      project_name: body.project_name || 'New project',
    };

    state.projects.push(project);
    state.stagesByProject[project._id] = [];
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

  http.get(/.*\/projects\/([^/]+)\/stages$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
    return HttpResponse.json(state.stagesByProject[projectId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/stages$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const projectId = String(params[0]);
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

    const stageId = String(params[1]);
    return HttpResponse.json(state.tasksByStage[stageId] || []);
  }),

  http.post(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const stageId = String(params[1]);
    const body = (await request.json()) as { title?: string };
    const task: TaskRecord = {
      _id: randomId('t'),
      title: body.title || 'Task',
      done: false,
    };

    state.tasksByStage[stageId] = [...(state.tasksByStage[stageId] || []), task];
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)\/toggle$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
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

  http.delete(/.*\/projects\/([^/]+)\/stages\/([^/]+)\/tasks\/([^/]+)$/, async ({ params, request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const stageId = String(params[1]);
    const taskId = String(params[2]);
    const tasks = state.tasksByStage[stageId] || [];
    state.tasksByStage[stageId] = tasks.filter((task) => task._id !== taskId);

    return HttpResponse.json({ ok: true });
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
    const stages = state.stagesByProject[entry.projectId] || [];
    return HttpResponse.json({
      project,
      stages,
      approved: entry.approved,
    });
  }),

  http.post(/.*\/p\/([^/]+)\/approve$/, async ({ params }) => {
    const token = String(params[0]);
    const entry = state.shareByToken[token];
    if (!entry) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
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
