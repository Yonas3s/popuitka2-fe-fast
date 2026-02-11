import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { TextInput } from '../components/ui/TextInput';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { useResetFlowStore } from '../store/reset-flow.store';

type ResetForm = {
  password: string;
  confirmPassword: string;
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const email = useResetFlowStore((state) => state.email);
  const code = useResetFlowStore((state) => state.code);
  const clearFlow = useResetFlowStore((state) => state.clearFlow);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  useEffect(() => {
    if (!email || !code) {
      pushToast('Повторите процесс восстановления: email и код не найдены', 'info');
      navigate('/forgot-password', { replace: true });
    }
  }, [code, email, navigate, pushToast]);

  const passwordValue = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    if (!email || !code) {
      return;
    }

    try {
      await apiService.resetPassword({
        email,
        code,
        password: values.password,
      });
      clearFlow();
      pushToast('Пароль обновлен. Выполните вход.', 'success');
      navigate('/signin');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Новый пароль" subtitle="Укажите новый пароль и подтвердите его.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={undefined}
            inputProps={{
              type: 'email',
              value: email,
              readOnly: true,
              disabled: true,
            }}
          />

          <TextInput
            label="Новый пароль"
            error={errors.password?.message}
            withPasswordToggle
            inputProps={{
              type: 'password',
              autoComplete: 'new-password',
              ...register('password', {
                required: 'Введите новый пароль',
                minLength: { value: 6, message: 'Минимум 6 символов' },
              }),
            }}
          />

          <TextInput
            label="Повторите пароль"
            error={errors.confirmPassword?.message}
            withPasswordToggle
            inputProps={{
              type: 'password',
              autoComplete: 'new-password',
              ...register('confirmPassword', {
                required: 'Повторите новый пароль',
                validate: (value) => value === passwordValue || 'Пароли не совпадают',
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
