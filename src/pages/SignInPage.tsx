import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { normalizeApiError } from '../lib/api/errors';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';

type SignInForm = {
  email: string;
  password: string;
};

export const SignInPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const pushToast = useUiStore((state) => state.pushToast);

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
