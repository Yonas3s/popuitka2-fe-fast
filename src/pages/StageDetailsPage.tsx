import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { useStageStore } from '../store/stage.store';
import { useUiStore } from '../store/ui.store';

type StagePatchForm = {
  work_link: string;
};

type TaskForm = {
  title: string;
};

type EditState = {
  [taskId: string]: string;
};

export const StageDetailsPage = () => {
  const { projectId = '', stageId = '' } = useParams();
  const currentStage = useStageStore((state) => state.currentStage);
  const tasks = useStageStore((state) => state.tasks);
  const loading = useStageStore((state) => state.loading);
  const error = useStageStore((state) => state.error);
  const fetchStage = useStageStore((state) => state.fetchStage);
  const patchStage = useStageStore((state) => state.patchStage);
  const requestReview = useStageStore((state) => state.requestReview);
  const fetchTasks = useStageStore((state) => state.fetchTasks);
  const createTask = useStageStore((state) => state.createTask);
  const toggleTask = useStageStore((state) => state.toggleTask);
  const editTaskTitle = useStageStore((state) => state.editTaskTitle);
  const deleteTask = useStageStore((state) => state.deleteTask);

  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [editValues, setEditValues] = useState<EditState>({});

  const {
    register: registerStage,
    handleSubmit: handleStageSubmit,
    formState: { isSubmitting: isStageSubmitting },
    reset: resetStageForm,
  } = useForm<StagePatchForm>();

  const {
    register: registerTask,
    handleSubmit: handleTaskSubmit,
    formState: { errors: taskErrors, isSubmitting: isTaskSubmitting },
    reset: resetTaskForm,
  } = useForm<TaskForm>();

  useEffect(() => {
    if (!projectId || !stageId) {
      return;
    }

    void fetchStage(projectId, stageId);
    void fetchTasks(projectId, stageId);
  }, [fetchStage, fetchTasks, projectId, stageId]);

  useEffect(() => {
    if (currentStage?.workLink) {
      resetStageForm({ work_link: currentStage.workLink });
    }
  }, [currentStage?.workLink, resetStageForm]);

  const onPatchStage = handleStageSubmit(async (values) => {
    try {
      await patchStage(projectId, stageId, values);
      pushToast('Стадия обновлена', 'success');
    } catch {
      pushToast('Ошибка при обновлении стадии', 'error');
    }
  });

  const onRequestReview = async () => {
    try {
      await requestReview(projectId, stageId);
      pushToast('Запрос на ревью отправлен', 'success');
    } catch {
      pushToast('Не удалось запросить ревью', 'error');
    }
  };

  const onCreateTask = handleTaskSubmit(async (values) => {
    try {
      await createTask(projectId, stageId, values);
      pushToast('Задача добавлена', 'success');
      resetTaskForm();
    } catch {
      pushToast('Ошибка при создании задачи', 'error');
    }
  });

  const onToggleTask = async (taskId: string) => {
    try {
      await toggleTask(projectId, stageId, taskId);
    } catch {
      pushToast('Не удалось переключить статус задачи', 'error');
    }
  };

  const onSaveTaskTitle = async (taskId: string) => {
    const title = editValues[taskId]?.trim();
    if (!title) {
      return;
    }

    try {
      await editTaskTitle(projectId, stageId, taskId, { title });
      pushToast('Заголовок задачи обновлен', 'success');
    } catch {
      pushToast('Не удалось обновить задачу', 'error');
    }
  };

  const onDeleteTask = (taskId: string) => {
    openConfirm({
      title: 'Удалить задачу?',
      description: 'Операция необратима.',
      onConfirm: async () => {
        try {
          await deleteTask(projectId, stageId, taskId);
          pushToast('Задача удалена', 'success');
        } catch {
          pushToast('Не удалось удалить задачу', 'error');
        }
      },
    });
  };

  const statusLabel = (status?: string): string => {
    if (!status) {
      return 'unknown';
    }

    const labels: Record<string, string> = {
      active: 'active',
      waiting: 'waiting',
      review: 'review',
      completed: 'completed',
    };

    return labels[status] ?? status;
  };

  const canRequestReview = currentStage?.status !== 'completed';

  return (
    <PageShell
      title={currentStage ? `Стадия: ${currentStage.stageName}` : 'Стадия'}
      subtitle="Управляйте ссылкой работы, review и задачами."
    >
      {currentStage ? (
        <div className="status-row">
          <span className={`status-badge status-${currentStage.status ?? 'unknown'}`}>
            Статус: {statusLabel(currentStage.status)}
          </span>
        </div>
      ) : null}
      <div className="content-grid">
        <GlassPanel>
          <h2>Параметры стадии</h2>
          <form className="form-grid" onSubmit={onPatchStage}>
            <TextInput
              label="Ссылка на работу"
              inputProps={{
                placeholder: 'https://...',
                ...registerStage('work_link'),
              }}
            />
            <GradientButton type="submit" disabled={isStageSubmitting}>
              {isStageSubmitting ? 'Сохраняем...' : 'Сохранить'}
            </GradientButton>
          </form>

          {canRequestReview ? (
            <button type="button" className="ghost-link" onClick={onRequestReview}>
              Запросить ревью у клиента
            </button>
          ) : (
            <p className="muted">Стадия завершена, повторный запрос ревью недоступен.</p>
          )}
        </GlassPanel>

        <GlassPanel>
          <h2>Новая задача</h2>
          <form className="form-grid" onSubmit={onCreateTask}>
            <TextInput
              label="Заголовок"
              error={taskErrors.title?.message}
              inputProps={{
                placeholder: 'Реализовать страницу stages',
                ...registerTask('title', {
                  required: 'Введите заголовок задачи',
                }),
              }}
            />
            <GradientButton type="submit" disabled={isTaskSubmitting}>
              {isTaskSubmitting ? 'Добавляем...' : 'Добавить задачу'}
            </GradientButton>
          </form>
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2>Задачи</h2>
        {loading ? <p>Загрузка...</p> : null}
        {error ? <ErrorState message={error.message} /> : null}
        {!loading && tasks.length === 0 ? (
          <EmptyState title="Задач нет" description="Добавьте первую задачу в форме выше." />
        ) : null}

        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <input type="checkbox" checked={task.done} onChange={() => void onToggleTask(task.id)} />

              <input
                className={`input task-input ${task.done ? 'task-done' : ''}`}
                value={editValues[task.id] ?? task.title}
                onChange={(event) => {
                  setEditValues((prev) => ({
                    ...prev,
                    [task.id]: event.target.value,
                  }));
                }}
              />

              <button type="button" className="ghost-link" onClick={() => void onSaveTaskTitle(task.id)}>
                Сохранить
              </button>
              <button type="button" className="ghost-link danger" onClick={() => onDeleteTask(task.id)}>
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </PageShell>
  );
};
