import { describe, expect, it } from 'vitest';
import {
  extractAgentRun,
  extractAgentRuns,
  extractAdminActionLogs,
  extractAdminStat,
  extractApiTokens,
  extractCreatedApiToken,
  extractDirection,
  extractDirections,
  extractPublicShare,
  extractProjects,
  extractTasks,
  extractTeamActiveInvites,
  extractTeamDetails,
  extractTeamMembers,
  extractTeamProjects,
  extractTeams,
  parseApiTokenContract,
  parseCreatedApiTokenContract,
} from './schemas';

describe('extractTeams', () => {
  it('parses plain teams array', () => {
    const teams = extractTeams([
      { _id: 't1', name: 'unit-labs', role: 'owner' },
      { _id: 't2', name: 'pixel-core', role: 'member' },
    ]);

    expect(teams).toHaveLength(2);
    expect(teams[0].id).toBe('t1');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('owner');
  });

  it('parses memberships with nested team object', () => {
    const teams = extractTeams({
      memberships: [{ role: 'member', team: { _id: 'nested-1', name: 'unit-labs' } }],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('nested-1');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('member');
  });

  it('falls back to first array key for unknown wrapper', () => {
    const teams = extractTeams({
      results: [{ team_id: 'fallback-1', team_name: 'alpha-team' }],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('fallback-1');
    expect(teams[0].name).toBe('alpha-team');
  });

  it('supports single team object response', () => {
    const teams = extractTeams({ _id: 'one-1', name: 'solo-team' });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('one-1');
    expect(teams[0].name).toBe('solo-team');
  });

  it('parses backend teams payload with nested team and myRole', () => {
    const teams = extractTeams({
      status: 'ok',
      teams: [
        {
          team: {
            _id: '69931f174f0a4440fdc468d6',
            name: 'unit-labs',
            owner_id: '698ce609f96e6dd5d2e34de5',
            createdAt: '2026-02-16T13:43:51.417Z',
            updatedAt: '2026-02-16T13:43:51.417Z',
          },
          myRole: 'owner',
        },
      ],
    });

    expect(teams).toHaveLength(1);
    expect(teams[0].id).toBe('69931f174f0a4440fdc468d6');
    expect(teams[0].name).toBe('unit-labs');
    expect(teams[0].role).toBe('owner');
  });
});

describe('team details and members extractors', () => {
  it('parses team details payload', () => {
    const details = extractTeamDetails({
      status: 'ok',
      data: {
        id: 'team-1',
        name: 'unit-labs',
        owner_id: 'owner-1',
        myRole: 'owner',
        stats: {
          members: 4,
          projects: 7,
        },
      },
    });

    expect(details.id).toBe('team-1');
    expect(details.name).toBe('unit-labs');
    expect(details.ownerId).toBe('owner-1');
    expect(details.myRole).toBe('owner');
    expect(details.stats.members).toBe(4);
    expect(details.stats.projects).toBe(7);
  });

  it('parses team members payload', () => {
    const members = extractTeamMembers({
      status: 'ok',
      data: {
        members: [
          { id: 'u1', username: 'yonas', email: 'yonas@example.com', role: 'owner' },
          { id: 'u2', username: 'dev1', email: 'dev1@example.com', role: 'member' },
        ],
      },
    });

    expect(members).toHaveLength(2);
    expect(members[0].id).toBe('u1');
    expect(members[0].username).toBe('yonas');
    expect(members[0].role).toBe('owner');
  });

  it('parses active invites payload', () => {
    const invites = extractTeamActiveInvites({
      status: 'ok',
      data: [
        {
          id: 'inv-1',
          email: 'user@example.com',
          invited_by: 'owner-1',
          expires_at: '2026-02-19T12:00:00.000Z',
          created_at: '2026-02-18T12:00:00.000Z',
        },
      ],
    });

    expect(invites).toHaveLength(1);
    expect(invites[0].id).toBe('inv-1');
    expect(invites[0].email).toBe('user@example.com');
    expect(invites[0].invitedBy).toBe('owner-1');
  });

  it('parses team projects payload with nested data wrapper', () => {
    const payload = extractTeamProjects({
      status: 'ok',
      data: {
        myRole: 'owner',
        projects: [
          { _id: 'p1', project_name: 'Website Revamp', status: 'active', team_id: 'team-1' },
          { _id: 'p2', project_name: 'CRM', status: 'completed', team_id: 'team-1' },
        ],
      },
    });

    expect(payload.myRole).toBe('owner');
    expect(payload.projects).toHaveLength(2);
    expect(payload.projects[0].id).toBe('p1');
    expect(payload.projects[0].teamId).toBe('team-1');
    expect(payload.projects[0].status).toBe('active');
  });

  it('parses projects from generic nested data response', () => {
    const projects = extractProjects({
      status: 'ok',
      data: {
        projects: [{ _id: 'p5', project_name: 'Nested Project' }],
      },
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('p5');
    expect(projects[0].projectName).toBe('Nested Project');
  });
});

describe('public share extractor', () => {
  it('keeps tasks for stages workflow and preserves task stage id', () => {
    const payload = extractPublicShare({
      workflow_type: 'stages',
      project: {
        _id: 'project-1',
        project_name: 'Client Portal',
      },
      stages: [
        { _id: 'stage-1', stage_name: 'Discovery', status: 'completed' },
        { _id: 'stage-2', stage_name: 'Build', status: 'review' },
      ],
      tasks: [
        { _id: 'task-1', title: 'Collect requirements', stage_id: 'stage-1', status: 'done' },
        { _id: 'task-2', title: 'Prepare release notes', stage_id: 'stage-2', status: 'review' },
      ],
    }, 'share-1');

    expect(payload.workflowType).toBe('stages');
    expect(payload.stages).toHaveLength(2);
    expect(payload.tasks).toHaveLength(2);
    expect(payload.tasks[0].stageId).toBe('stage-1');
    expect(payload.tasks[1].stageId).toBe('stage-2');
  });

  it('reads project name from the top-level public payload when nested project is absent', () => {
    const payload = extractPublicShare({
      _id: 'project-7',
      project_name: 'Release Portal',
      workflow_type: 'flat',
      tasks: [
        { _id: 'task-1', title: 'Ship changelog', status: 'todo' },
      ],
    }, 'share-2');

    expect(payload.project?.projectName).toBe('Release Portal');
    expect(payload.project?.id).toBe('project-7');
    expect(payload.workflowType).toBe('flat');
  });
});

describe('admin extractors', () => {
  it('parses admin stat with action audit blocks', () => {
    const stat = extractAdminStat({
      users: 10,
      dev_users: 6,
      admin_users: 2,
      local_users: 5,
      gh_users: 5,
      projects: 7,
      active_projects: 4,
      completed_projects: 3,
      stages: 12,
      waiting_stages: 3,
      active_stages: 4,
      review_stages: 2,
      completed_stages: 3,
      actions_total: 25,
      actions_by_source: [
        { source: 'web', count: 10 },
        { source: 'cli', count: 7 },
      ],
      actions_by_auth: [
        { auth_type: 'jwt', count: 15 },
        { auth_type: 'pat', count: 10 },
      ],
      recent_actions: [
        {
          id: 'act-1',
          source: 'web',
          auth_type: 'jwt',
          method: 'GET',
          path: '/projects',
        },
      ],
    });

    expect(stat.actionsTotal).toBe(25);
    expect(stat.actionsBySource[0].source).toBe('web');
    expect(stat.actionsByAuth[1].authType).toBe('pat');
    expect(stat.recentActions[0].id).toBe('act-1');
  });

  it('parses /stat/actions payload with filters metadata', () => {
    const payload = extractAdminActionLogs({
      status: 'ok',
      limit: 20,
      count: 2,
      data: [
        { id: 'act-1', source: 'web', auth_type: 'jwt', method: 'GET', path: '/projects' },
        { id: 'act-2', source: 'cli', auth_type: 'pat', method: 'POST', path: '/projects' },
      ],
    });

    expect(payload.limit).toBe(20);
    expect(payload.count).toBe(2);
    expect(payload.data).toHaveLength(2);
    expect(payload.data[1].authType).toBe('pat');
    expect(payload.data[1].source).toBe('cli');
  });
});

describe('task extractors', () => {
  it('parses assignee_user_id for task records', () => {
    const tasks = extractTasks({
      tasks: [
        {
          _id: 'task-1',
          title: 'Assigned',
          issue_key: 'ul-101',
          is_done: false,
          assignee_user_id: 'user-1',
          task_type: 'bug',
          direction_ids: ['dir-1', 'dir-2'],
        },
        { _id: 'task-2', title: 'Legacy key', done: true, assigneeUserId: 'user-2', taskType: 'feature' },
        { _id: 'task-3', title: 'Unassigned', done: false, assignee_user_id: null, task_type: 'wrong' },
      ],
    });

    expect(tasks).toHaveLength(3);
    expect(tasks[0].issueKey).toBe('ul-101');
    expect(tasks[0].assigneeUserId).toBe('user-1');
    expect(tasks[0].taskType).toBe('bug');
    expect(tasks[0].directionIds).toEqual(['dir-1', 'dir-2']);
    expect(tasks[1].assigneeUserId).toBe('user-2');
    expect(tasks[1].taskType).toBe('feature');
    expect(tasks[2].assigneeUserId).toBeUndefined();
    expect(tasks[2].taskType).toBe('task');
  });

  it('parses new camelCase task format with directions[{directionId}] and isDone', () => {
    const tasks = extractTasks({
      tasks: [
        {
          id: 'task-new-1',
          title: 'New format',
          issueKey: 'ul-201',
          isDone: true,
          assigneeUserId: 'user-7',
          taskType: 'feature',
          directions: [{ directionId: 'dir-a' }, { directionId: 'dir-b' }],
        },
      ],
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-new-1');
    expect(tasks[0].issueKey).toBe('ul-201');
    expect(tasks[0].done).toBe(true);
    expect(tasks[0].assigneeUserId).toBe('user-7');
    expect(tasks[0].taskType).toBe('feature');
    expect(tasks[0].directionIds).toEqual(['dir-a', 'dir-b']);
  });
});

describe('agent run extractors', () => {
  it('parses runs list from nested payload', () => {
    const runs = extractAgentRuns({
      status: 'ok',
      data: [
        {
          _id: 'run-1',
          status: 'running',
          prompt: 'Сделай задачу',
          model: 'gpt-5.2',
          create_tasks: true,
          task_limit: 3,
          target_stage_id: 'st-1',
          created_tasks_count: 1,
          created_tasks: [{ _id: 't-1', issue_key: 'popu-100', title: 'Task 1' }],
          created_at: '2026-03-31T10:00:00.000Z',
        },
      ],
    });

    expect(runs).toHaveLength(1);
    expect(runs[0].id).toBe('run-1');
    expect(runs[0].status).toBe('running');
    expect(runs[0].prompt).toBe('Сделай задачу');
    expect(runs[0].model).toBe('gpt-5.2');
    expect(runs[0].createTasks).toBe(true);
    expect(runs[0].taskLimit).toBe(3);
    expect(runs[0].targetStageId).toBe('st-1');
    expect(runs[0].createdTasksCount).toBe(1);
    expect(runs[0].createdTasks[0]?.issueKey).toBe('popu-100');
  });

  it('parses single run payload', () => {
    const run = extractAgentRun({
      data: {
        _id: 'run-2',
        status: 'failed',
        prompt: 'fail this',
        error_message: 'Boom',
      },
    });

    expect(run.id).toBe('run-2');
    expect(run.status).toBe('failed');
    expect(run.errorMessage).toBe('Boom');
  });
});

describe('direction extractors', () => {
  it('parses project directions payload', () => {
    const directions = extractDirections({
      data: [{ _id: 'dir-1', name: 'Backend' }, { _id: 'dir-2', name: 'Frontend' }],
    });

    expect(directions).toHaveLength(2);
    expect(directions[0].id).toBe('dir-1');
    expect(directions[0].name).toBe('Backend');
  });

  it('parses single direction object response', () => {
    const direction = extractDirection({
      _id: 'dir-single',
      name: 'Mobile',
    });

    expect(direction.id).toBe('dir-single');
    expect(direction.name).toBe('Mobile');
  });

  it('parses wrapped single direction response', () => {
    const direction = extractDirection({
      data: {
        _id: 'dir-wrapped',
        name: 'Security',
      },
    });

    expect(direction.id).toBe('dir-wrapped');
    expect(direction.name).toBe('Security');
  });
});

describe('api token schemas', () => {
  it('parses token list payload from settings endpoint', () => {
    const tokens = extractApiTokens({
      status: 'ok',
      data: [
        {
          _id: 'tok-1',
          name: 'MCP token',
          token_prefix: 'ul_live_123',
          last_used_at: '2026-03-28T10:20:00.000Z',
          created_at: '2026-03-28T10:00:00.000Z',
        },
      ],
    });

    expect(tokens).toHaveLength(1);
    expect(tokens[0].id).toBe('tok-1');
    expect(tokens[0].name).toBe('MCP token');
    expect(tokens[0].tokenPrefix).toBe('ul_live_123');
  });

  it('parses created token payload (token shown once for copy)', () => {
    const created = extractCreatedApiToken({
      status: 'ok',
      data: {
        _id: 'tok-created',
        name: 'CLI token',
        token: 'ul_live_once_123',
        token_prefix: 'ul_live_once',
        expires_at: '2026-12-31T23:59:59.000Z',
        created_at: '2026-03-28T10:00:00.000Z',
      },
    });

    expect(created.id).toBe('tok-created');
    expect(created.token).toBe('ul_live_once_123');
    expect(created.tokenPrefix).toBe('ul_live_once');
    expect(created.expiresAt).toBe('2026-12-31T23:59:59.000Z');
  });

  it('accepts nullable datetime fields in ApiToken contract', () => {
    const token = parseApiTokenContract({
      _id: 'tok-nullable',
      name: 'Nullable token',
      token_prefix: 'ul_nullable_1',
      last_used_at: null,
      expires_at: null,
      revoked_at: null,
      created_at: '2026-03-28T10:00:00.000Z',
    });

    expect(token.id).toBe('tok-nullable');
    expect(token.lastUsedAt).toBeUndefined();
    expect(token.expiresAt).toBeUndefined();
    expect(token.revokedAt).toBeUndefined();
  });

  it('throws clear error for invalid ApiToken contract data', () => {
    expect(() =>
      parseApiTokenContract({
        _id: 'tok-invalid',
        name: '',
        token_prefix: 'bad-prefix',
      }),
    ).toThrowError(/Invalid ApiToken payload/i);
  });

  it('throws clear error for invalid CreatedApiToken contract data', () => {
    expect(() =>
      parseCreatedApiTokenContract({
        _id: 'tok-created-invalid',
        name: 'Broken',
        token_prefix: 'ul_ok',
        token: '',
      }),
    ).toThrowError(/Invalid CreatedApiToken payload/i);
  });
});
