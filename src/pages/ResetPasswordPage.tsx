import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';

type ResetForm = {
  email: string;
  code: string;
  password: string;
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const code = params.get('code');

    if (email) {
      setValue('email', email);
    }

    if (code) {
      setValue('code', code);
    }
  }, [location.search, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiService.resetPassword(values);
      pushToast('Пароль обновлен. Выполните вход.', 'success');
      navigate('/signin');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Новый пароль" subtitle="Укажите код и новый пароль.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={errors.email?.message}
            inputProps={{
              type: 'email',
              ...register('email', { required: 'Введите email' }),
            }}
          />

          <TextInput
            label="Код"
            error={errors.code?.message}
            inputProps={{
              ...register('code', { required: 'Введите код' }),
            }}
          />

          <TextInput
            label="Новый пароль"
            error={errors.password?.message}
            inputProps={{
              type: 'password',
              autoComplete: 'new-password',
              ...register('password', {
                required: 'Введите новый пароль',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              }),
            }}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Сохранить пароль'}
          </GradientButton>
        </form>
      </GlassPanel>
    </PageShell>
  );
};
