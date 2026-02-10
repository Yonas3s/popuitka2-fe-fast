import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';

type SignUpForm = {
  username: string;
  email: string;
  password: string;
};

export const SignUpPage = () => {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiService.signup(values);
      pushToast('Регистрация успешна. Теперь можно войти.', 'success');
      navigate('/signin');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Регистрация" subtitle="Создайте аккаунт для доступа к проектам.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Имя пользователя"
            error={errors.username?.message}
            inputProps={{
              placeholder: 'yokio',
              autoComplete: 'username',
              ...register('username', { required: 'Введите имя пользователя' }),
            }}
          />

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
              autoComplete: 'new-password',
              ...register('password', {
                required: 'Введите пароль',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              }),
            }}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаем...' : 'Зарегистрироваться'}
          </GradientButton>
        </form>
      </GlassPanel>
    </PageShell>
  );
};
