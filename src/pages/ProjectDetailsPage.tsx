import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { ErrorState } from '../components/feedback/ErrorState';
import { EmptyState } from '../components/feedback/EmptyState';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';
import { FRONTEND_BASE_URL } from '../lib/config/env';

type StageForm = {
  stage_name: string;
  description: string;
};

export const ProjectDetailsPage = () => {
  const { projectId = '' } = useParams();
  const project = useProjectsStore((state) => state.currentProject);
  const stages = useProjectsStore((state) => state.stages);
  const shareLink = useProjectsStore((state) => state.shareLink);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProject = useProjectsStore((state) => state.fetchProject);
  const fetchStages = useProjectsStore((state) => state.fetchStages);
  const createStage = useProjectsStore((state) => state.createStage);
  const createShareLink = useProjectsStore((state) => state.createShareLink);
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageForm>();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void fetchProject(projectId);
    void fetchStages(projectId);
  }, [fetchProject, fetchStages, projectId]);

  const resolvedShare = useMemo(() => {
    if (shareLink) {
      return shareLink;
    }

    return project?.shareLink || '';
  }, [project?.shareLink, shareLink]);

  const sharePath = useMemo(() => {
    if (!resolvedShare) {
      return '';
    }

    if (resolvedShare.startsWith('/p/')) {
      return resolvedShare;
    }

    try {
      const parsed = new URL(resolvedShare);
      if (parsed.pathname.startsWith('/p/')) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return '';
    }

    return '';
  }, [resolvedShare]);

  const frontendShareUrl = useMemo(() => {
    if (!sharePath) {
      return resolvedShare;
    }

    const base = FRONTEND_BASE_URL || window.location.origin;

    try {
      return new URL(sharePath, base).toString();
    } catch {
      return `${base}${sharePath}`;
    }
  }, [resolvedShare, sharePath]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createStage(projectId, values);
      pushToast('Стадия добавлена', 'success');
      reset();
    } catch {
      pushToast('Ошибка создания стадии', 'error');
    }
  });

  const onShare = async () => {
    try {
      await createShareLink(projectId);
      pushToast('Ссылка создана', 'success');
    } catch {
      pushToast('Не удалось создать ссылку', 'error');
    }
  };

  const onCopy = async () => {
    if (!frontendShareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(frontendShareUrl);
      pushToast('Ссылка скопирована', 'success');
    } catch {
      pushToast('Не удалось скопировать ссылку', 'error');
    }
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

  return (
    <PageShell
      title={project ? `Проект: ${project.projectName}` : 'Проект'}
      subtitle="Управление стадиями и клиентской ссылкой."
    >
      <div className="content-grid">
        <GlassPanel>
          <h2>Добавить стадию</h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <TextInput
              label="Название стадии"
              error={errors.stage_name?.message}
              inputProps={{
                placeholder: 'MVP фронт',
                ...register('stage_name', { required: 'Введите название стадии' }),
              }}
            />
            <TextInput
              label="Описание"
              error={errors.description?.message}
              inputProps={{
                placeholder: 'Что должно быть сделано',
                ...register('description'),
              }}
            />

            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем...' : 'Создать стадию'}
            </GradientButton>
          </form>
        </GlassPanel>

        <GlassPanel>
          <h2>Клиентская ссылка</h2>
          <div className="actions-row">
            <GradientButton type="button" onClick={onShare}>
              Сгенерировать ссылку
            </GradientButton>
            {frontendShareUrl ? (
              <button type="button" className="ghost-link" onClick={onCopy}>
                Копировать
              </button>
            ) : null}
            {sharePath ? (
              <Link className="ghost-link" to={sharePath}>
                Открыть страницу клиента
              </Link>
            ) : null}
          </div>
          {frontendShareUrl ? (
            <a className="mono break-all ghost-link" href={frontendShareUrl} target="_blank" rel="noreferrer">
              {frontendShareUrl}
            </a>
          ) : (
            <p>Ссылка пока не создана</p>
          )}
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2>Стадии проекта</h2>
        {loading ? <p>Загрузка...</p> : null}
        {error ? <ErrorState message={error.message} /> : null}
        {!loading && stages.length === 0 ? (
          <EmptyState title="Стадий нет" description="Добавьте первую стадию в форме выше." />
        ) : null}

        <div className="cards-grid">
          {stages.map((stage) => (
            <article className="card-item" key={stage.id}>
              <h3>{stage.stageName}</h3>
              <p className="muted">
                Статус: <span className={`status-badge status-${stage.status ?? 'unknown'}`}>{statusLabel(stage.status)}</span>
              </p>
              {stage.description ? <p>{stage.description}</p> : null}
              <Link className="cta" to={`/projects/${projectId}/stages/${stage.id}`}>
                Открыть стадию
              </Link>
            </article>
          ))}
        </div>
      </GlassPanel>
    </PageShell>
  );
};
