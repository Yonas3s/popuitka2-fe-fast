import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { useProjectsStore } from '../store/projects.store';
import { useUiStore } from '../store/ui.store';

type ProjectForm = {
  project_name: string;
};

export const ProjectsPage = () => {
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const createProject = useProjectsStore((state) => state.createProject);
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>();

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createProject(values);
      pushToast('Проект создан', 'success');
      reset();
    } catch {
      pushToast('Не удалось создать проект', 'error');
    }
  });

  return (
    <PageShell title="Проекты" subtitle="Создавайте проекты и переходите к управлению стадиями.">
      <div className="content-grid">
        <GlassPanel>
          <h2>Новый проект</h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <TextInput
              label="Название проекта"
              error={errors.project_name?.message}
              inputProps={{
                placeholder: 'popuitka2 frontend',
                ...register('project_name', {
                  required: 'Введите название проекта',
                  minLength: { value: 2, message: 'Минимум 2 символа' },
                }),
              }}
            />
            <GradientButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создаем...' : 'Создать проект'}
            </GradientButton>
          </form>
        </GlassPanel>

        <GlassPanel>
          <h2>Список проектов</h2>
          {loading ? <p>Загрузка...</p> : null}
          {error ? <ErrorState message={error.message} /> : null}
          {!loading && projects.length === 0 ? (
            <EmptyState title="Пока пусто" description="Создайте первый проект слева." />
          ) : null}

          <div className="cards-grid">
            {projects.map((project) => (
              <article key={project.id} className="card-item">
                <h3>{project.projectName}</h3>
                <p className="muted">ID: {project.id}</p>
                {project.description ? <p>{project.description}</p> : null}
                <Link className="cta" to={`/projects/${project.id}`}>
                  Открыть проект
                </Link>
              </article>
            ))}
          </div>
        </GlassPanel>
      </div>
    </PageShell>
  );
};
