import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { normalizeApiError } from '../lib/api/errors';
import { API_BASE_URL } from '../lib/config/env';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';

type SignInForm = {
  email: string;
  password: string;
};

const GitHubIcon = () => (
  <svg className="github-oauth-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.66 7.66 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

export const SignInPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const pushToast = useUiStore((state) => state.pushToast);
  const githubAuthUrl = `${API_BASE_URL}/auth/github`;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      pushToast('Вход выполнен', 'success');
      navigate('/projects');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Вход" subtitle="Авторизуйтесь для доступа к рабочему кабинету.">
      <GlassPanel className="auth-panel">
        <a className="github-oauth" href={githubAuthUrl}>
          <GitHubIcon />
          <span>Войти через GitHub</span>
        </a>

        <div className="oauth-divider" role="separator" aria-label="или войти через email">
          <span>или</span>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={errors.email?.message}
            inputProps={{
              placeholder: 'mail@example.com',
              type: 'email',
              autoComplete: 'email',
              ...register('email', { required: 'Введите email' }),
            }}
          />

          <TextInput
            label="Пароль"
            error={errors.password?.message}
            inputProps={{
              placeholder: '********',
              type: 'password',
              autoComplete: 'current-password',
              ...register('password', { required: 'Введите пароль' }),
            }}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Проверяем...' : 'Войти'}
          </GradientButton>
        </form>

        <div className="actions-row" style={{ marginTop: 12 }}>
          <Link className="ghost-link" to="/forgot-password">
            Забыли пароль?
          </Link>
          <Link className="ghost-link" to="/signup">
            Создать аккаунт
          </Link>
        </div>
      </GlassPanel>
    </PageShell>
  );
};
