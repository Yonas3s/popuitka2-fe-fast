import { apiService } from './service';
import { useAuthStore } from '../../store/auth.store';

describe('api service flow', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, isAuthenticated: false });
  });

  it('passes complete auth and project/stage/task flow', async () => {
    await apiService.signup({
      username: 'test',
      email: 'test@example.com',
      password: 'password123',
    });

    const token = await apiService.signin({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(token).toBeTruthy();

    useAuthStore.getState().setToken(token);

    const me = await apiService.getMe();
    expect(me.email).toContain('@');
    const stat = await apiService.getAdminStat();
    expect(stat.projects).toBeGreaterThanOrEqual(0);
    expect(stat.actionsTotal).toBeGreaterThanOrEqual(0);
    const actions = await apiService.getAdminActionLogs({ limit: 10 });
    expect(actions.data.length).toBeGreaterThan(0);
    const patActions = await apiService.getAdminActionLogs({ authType: 'pat', limit: 10 });
    expect(patActions.data.every((item) => item.authType === 'pat')).toBe(true);

    const createdTeam = await apiService.createTeam({ name: 'unit-labs' });
    expect(createdTeam.name).toContain('unit-labs');

    const teams = await apiService.getTeams();
    expect(teams.length).toBeGreaterThan(0);
    const teamDetails = await apiService.getTeamById(createdTeam.id);
    expect(teamDetails.name).toContain('unit-labs');
    const teamMembers = await apiService.getTeamMembers(createdTeam.id);
    expect(teamMembers.length).toBeGreaterThan(0);
    const teamProjectsPayload = await apiService.getTeamProjects(createdTeam.id);
    expect(teamProjectsPayload.projects.length).toBeGreaterThanOrEqual(0);
    const membersForDeletion = await apiService.getTeamMembers('team-1');
    const removableMember = membersForDeletion.find((member) => member.role !== 'owner');
    expect(removableMember).toBeTruthy();
    if (!removableMember) {
      throw new Error('Expected removable team member');
    }
    await apiService.removeTeamMember('team-1', removableMember.id);
    const teamMembersAfterDelete = await apiService.getTeamMembers('team-1');
    expect(teamMembersAfterDelete.length).toBe(membersForDeletion.length - 1);

    const inviteLink = await apiService.inviteToTeam(createdTeam.id, { email: 'teammate@example.com' });
    expect(inviteLink).toContain('token=');
    const activeInvites = await apiService.getTeamActiveInvites(createdTeam.id);
    expect(activeInvites.length).toBeGreaterThan(0);
    expect(activeInvites[0].email).toContain('@');
    await apiService.inviteToTeam(createdTeam.id, { email: 'revoke@example.com' });
    const activeInvitesBeforeRevoke = await apiService.getTeamActiveInvites(createdTeam.id);
    const inviteToRevoke = activeInvitesBeforeRevoke.find((invite) => invite.email === 'revoke@example.com');
    expect(inviteToRevoke).toBeTruthy();
    if (!inviteToRevoke) {
      throw new Error('Expected invite for revoke');
    }

    await apiService.revokeTeamInvite(createdTeam.id, inviteToRevoke.id);
    const activeInvitesAfterRevoke = await apiService.getTeamActiveInvites(createdTeam.id);
    expect(activeInvitesAfterRevoke.find((invite) => invite.id === inviteToRevoke.id)).toBeFalsy();

    const inviteToken = new URL(inviteLink).searchParams.get('token');
    expect(inviteToken).toBeTruthy();
    const inviteInfo = await apiService.getTeamInvite(inviteToken || '');
    expect(inviteInfo.teamName).toContain('unit-labs');

    await apiService.acceptTeamInvite(inviteToken || '');

    const beforeProjects = await apiService.getProjects();
    expect(beforeProjects.length).toBeGreaterThan(0);

    const createdProject = await apiService.createProject({ project_name: 'A New Project' });
    expect(createdProject.projectName).toContain('A New Project');

    const teamProject = await apiService.createProject({
      project_name: 'Team Project',
      team_id: createdTeam.id,
    });
    expect(teamProject.projectName).toContain('Team Project');

    const fullProject = await apiService.getProject(createdProject.id);
    expect(fullProject.id).toBe(createdProject.id);

    const createdStage = await apiService.createStage(createdProject.id, {
      stage_name: 'Frontend MVP',
      description: 'All routes connected',
    });
    expect(createdStage.stageName).toContain('Frontend MVP');

    const stages = await apiService.getStages(createdProject.id);
    expect(stages.length).toBeGreaterThan(0);
    expect(stages[0].status).toBeTruthy();

    const stageDetails = await apiService.getStage(createdProject.id, createdStage.id);
    expect(stageDetails.id).toBe(createdStage.id);

    const patched = await apiService.patchStage(createdProject.id, createdStage.id, {
      work_link: 'https://example.com/work',
    });
    expect(patched.workLink).toBe('https://example.com/work');

    await apiService.requestReview(createdProject.id, createdStage.id);
    const stageAfterReview = await apiService.getStage(createdProject.id, createdStage.id);
    expect(stageAfterReview.status).toBe('review');

    await apiService.createTask(createdProject.id, createdStage.id, {
      title: 'Implement tasks page',
    });

    const tasks = await apiService.getTasks(createdProject.id, createdStage.id);
    expect(tasks.length).toBeGreaterThan(0);

    const firstTask = tasks[0];
    await apiService.assignTask(createdProject.id, createdStage.id, firstTask.id, {
      assignee_user_id: 'teammate-1',
    });
    const tasksAfterAssign = await apiService.getTasks(createdProject.id, createdStage.id);
    expect(tasksAfterAssign[0]?.assigneeUserId).toBe('teammate-1');
    await apiService.assignTask(createdProject.id, createdStage.id, firstTask.id, {
      assignee_user_id: null,
    });
    await apiService.toggleTask(createdProject.id, createdStage.id, firstTask.id);
    await apiService.editTaskTitle(createdProject.id, createdStage.id, firstTask.id, {
      title: 'Updated title',
    });
    await apiService.deleteTask(createdProject.id, createdStage.id, firstTask.id);

    const link = await apiService.createShareLink(createdProject.id);
    expect(link.shareLink).toContain('/p/public-');

    const tokenFromLink = link.shareLink.split('/p/')[1];
    const publicPayload = await apiService.getPublicProject(tokenFromLink);
    expect(publicPayload.shareToken).toBe(tokenFromLink);

    await apiService.approvePublicProject(tokenFromLink);
    const approvedPayload = await apiService.getPublicProject(tokenFromLink);
    expect(approvedPayload.approved).toBe(true);

    const stageAfterApprove = await apiService.getStage(createdProject.id, createdStage.id);
    expect(stageAfterApprove.status).toBe('completed');
  });

  it('supports forgot/verify/reset and rejects invalid code', async () => {
    await apiService.forgotPassword({ email: 'test@example.com' });

    await expect(
      apiService.verifyResetCode({
        email: 'test@example.com',
        code: '000000',
      }),
    ).rejects.toBeTruthy();

    await apiService.verifyResetCode({
      email: 'test@example.com',
      code: '123456',
    });

    await apiService.resetPassword({
      email: 'test@example.com',
      code: '123456',
      password: 'new-password',
    });
  });

  it('supports settings api tokens flow (list/create/copy-source/revoke)', async () => {
    const token = await apiService.signin({
      email: 'test@example.com',
      password: 'password123',
    });
    useAuthStore.getState().setToken(token);

    const beforeCreate = await apiService.getApiTokens();
    expect(beforeCreate.length).toBeGreaterThan(0);

    const created = await apiService.createApiToken({
      name: 'MCP token',
      expires_at: '2026-12-31T23:59:59.000Z',
    });

    // Plaintext token is shown once in UI and then copied to clipboard.
    expect(created.token).toMatch(/^ul_/);
    expect(created.tokenPrefix).toMatch(/^ul_/);
    expect(created.name).toBe('MCP token');

    const afterCreate = await apiService.getApiTokens();
    const createdInList = afterCreate.find((item) => item.id === created.id);
    expect(createdInList).toBeTruthy();
    expect(createdInList?.tokenPrefix).toBe(created.tokenPrefix);

    await apiService.revokeApiToken(created.id);

    const afterRevoke = await apiService.getApiTokens();
    const revoked = afterRevoke.find((item) => item.id === created.id);
    expect(revoked).toBeTruthy();
    expect(revoked?.revokedAt).toBeTruthy();
  });

  it('supports flat workflow project tasks and mode mismatch responses', async () => {
    const token = await apiService.signin({
      email: 'test@example.com',
      password: 'password123',
    });
    useAuthStore.getState().setToken(token);

    const flatProject = await apiService.createProject({
      project_name: 'Flat Project',
      workflow_type: 'flat',
    });
    expect(flatProject.workflowType).toBe('flat');

    await expect(apiService.getStages(flatProject.id)).rejects.toBeTruthy();

    const createdTask = await apiService.createProjectTask(flatProject.id, {
      title: 'Prepare flat-mode task',
    });
    expect(createdTask.title).toContain('flat-mode');

    const tasks = await apiService.getProjectTasks(flatProject.id);
    expect(tasks.length).toBeGreaterThan(0);

    const firstTask = tasks[0];
    await apiService.assignProjectTask(flatProject.id, firstTask.id, {
      assignee_user_id: 'teammate-1',
    });
    const tasksAfterAssign = await apiService.getProjectTasks(flatProject.id);
    expect(tasksAfterAssign[0]?.assigneeUserId).toBe('teammate-1');
    await apiService.assignProjectTask(flatProject.id, firstTask.id, {
      assignee_user_id: null,
    });
    await apiService.toggleProjectTask(flatProject.id, firstTask.id);
    await apiService.editProjectTaskTitle(flatProject.id, firstTask.id, {
      title: 'Updated flat task',
    });
    await apiService.deleteProjectTask(flatProject.id, firstTask.id);

    const share = await apiService.createShareLink(flatProject.id);
    const shareToken = share.shareLink.split('/p/')[1];
    const publicPayload = await apiService.getPublicProject(shareToken);
    expect(publicPayload.workflowType).toBe('flat');
    expect(publicPayload.stages).toHaveLength(0);

    await expect(apiService.approvePublicProject(shareToken)).rejects.toBeTruthy();
  });
});
