import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import type { PublicSharePayload, Stage, Task } from '../types/models';
import { useUiStore } from '../store/ui.store';

type Status = 'idle' | 'loading' | 'error';
type StageStatus = NonNullable<Stage['status']> | 'unknown';

const stageStatusLabel: Record<StageStatus, string> = {
  active: 'в работе',
  waiting: 'ожидание',
  review: 'ожидает ревью',
  completed: 'завершено',
  unknown: 'неизвестно',
};

const stagePriority: Record<StageStatus, number> = {
  review: 0,
  active: 1,
  waiting: 2,
  completed: 3,
  unknown: 4,
};

const formatIssueKey = (value?: string) => (value ? value.toUpperCase() : null);

export const PublicClientPage = () => {
  const { shareToken = '' } = useParams();
  const [status, setStatus] = useState<Status>('idle');
  const [payload, setPayload] = useState<PublicSharePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pushToast = useUiStore((state) => state.pushToast);

  const loadPublicData = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await apiService.getPublicProject(shareToken);
      setPayload(response);
      setStatus('idle');
    } catch (error) {
      const normalized = normalizeApiError(error);
      setErrorMessage(normalized.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!shareToken) {
      setStatus('error');
      setErrorMessage('Неверный публичный токен');
      return;
    }

    void loadPublicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const onApprove = async () => {
    try {
      await apiService.approvePublicProject(shareToken);
      pushToast('Стадия подтверждена', 'success');
      await loadPublicData();
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  };

  const sortStages = (stages: Stage[]): Stage[] => {
    return [...stages].sort((a, b) => {
      const aStatus: StageStatus = a.status ?? 'unknown';
      const bStatus: StageStatus = b.status ?? 'unknown';
      return stagePriority[aStatus] - stagePriority[bStatus];
    });
  };

  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => Number(a.done) - Number(b.done));
  };

  const getProjectStatus = (data: PublicSharePayload): StageStatus => {
    if (data.approved) {
      return 'completed';
    }

    if (data.stages.some((stage) => stage.status === 'review')) {
      return 'review';
    }

    if (data.stages.some((stage) => stage.status === 'active')) {
      return 'active';
    }

    if (data.stages.every((stage) => stage.status === 'completed')) {
      return 'completed';
    }

    return 'waiting';
  };

  const getFlatProjectStatus = (data: PublicSharePayload): StageStatus => {
    if (data.approved) {
      return 'completed';
    }

    if (data.tasks.length === 0) {
      return 'waiting';
    }

    if (data.tasks.every((task) => task.done)) {
      return 'completed';
    }

    return 'active';
  };

  return (
    <PageShell title="Клиентский просмотр" subtitle="Публичная ссылка для проверки и подтверждения стадии.">
      <GlassPanel className="client-panel">
        {status === 'loading' ? <p>Загрузка...</p> : null}

        {status === 'error' ? (
          <ErrorState title="Ссылка недоступна" message={errorMessage || 'Не удалось загрузить данные'} />
        ) : null}

        {status === 'idle' && payload ? (
          <div className="client-canvas">
            <p className="client-caption">Для заказчика</p>
            <div className="client-flow">
              <p className="client-breadcrumb">
                {(payload.project?.projectName || 'Название проекта') + ' -> Заказчик'}
              </p>

              {payload.workflowType === 'flat' ? (
                (() => {
                  const projectStatus = getFlatProjectStatus(payload);
                  const sortedTasks = sortTasks(payload.tasks);

                  return (
                    <div className="client-column">
                      <article className="client-card client-project-card">
                        <h3>{payload.project?.projectName || 'Название проекта'}</h3>
                        <p className={`client-state state-${projectStatus}`}>
                          <span className="state-dot" />
                          {stageStatusLabel[projectStatus]}
                        </p>
                        <p className="client-description">Режим flat: отображается общий список задач проекта.</p>
                      </article>

                      {sortedTasks.length === 0 ? (
                        <EmptyState title="Задачи не найдены" description="Для этой ссылки нет задач проекта." />
                      ) : (
                        sortedTasks.map((task) => {
                          const taskStatus: StageStatus = task.done ? 'completed' : 'active';
                          return (
                            <article key={task.id} className={`client-card client-stage-card stage-${taskStatus}`}>
                              {task.issueKey ? <p className="client-issue-key">{formatIssueKey(task.issueKey)}</p> : null}
                              <p className="client-stage-title">{task.title}</p>
                              <p className={`client-state state-${taskStatus}`}>
                                <span className="state-dot" />
                                {task.done ? 'выполнено' : 'в работе'}
                              </p>
                            </article>
                          );
                        })
                      )}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const projectStatus = getProjectStatus(payload);
                  const sortedStages = sortStages(payload.stages);

                  return (
                    <div className="client-column">
                      <article className="client-card client-project-card">
                        <h3>{payload.project?.projectName || 'Название проекта'}</h3>
                        <p className={`client-state state-${projectStatus}`}>
                          <span className="state-dot" />
                          {stageStatusLabel[projectStatus]}
                        </p>
                      </article>

                      {sortedStages.length === 0 ? (
                        <EmptyState title="Стадии не найдены" description="Для этой ссылки нет доступных стадий." />
                      ) : (
                        sortedStages.map((stage) => {
                          const stageStatus: StageStatus = stage.status ?? 'unknown';
                          const showApprove = stage.status === 'review' && !payload.approved;

                          return (
                            <article key={stage.id} className={`client-card client-stage-card stage-${stageStatus}`}>
                              <p className="client-stage-title">{stage.stageName}</p>
                              <p className={`client-state state-${stageStatus}`}>
                                <span className="state-dot" />
                                {stageStatusLabel[stageStatus]}
                              </p>

                              {stage.description ? <p className="client-description">{stage.description}</p> : null}

                              {stage.workLink ? (
                                <a href={stage.workLink} className="client-link-pill" target="_blank" rel="noreferrer">
                                  {stage.workLink}
                                </a>
                              ) : null}

                              {showApprove ? (
                                <GradientButton type="button" onClick={onApprove}>
                                  Подтвердить этап -&gt;
                                </GradientButton>
                              ) : null}

                              {payload.approved && stage.status === 'completed' ? (
                                <p className="success-text">Одобрено</p>
                              ) : null}
                            </article>
                          );
                        })
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        ) : null}
      </GlassPanel>
    </PageShell>
  );
};
