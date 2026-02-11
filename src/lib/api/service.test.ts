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

    const beforeProjects = await apiService.getProjects();
    expect(beforeProjects.length).toBeGreaterThan(0);

    const createdProject = await apiService.createProject({ project_name: 'A New Project' });
    expect(createdProject.projectName).toContain('A New Project');

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
});
