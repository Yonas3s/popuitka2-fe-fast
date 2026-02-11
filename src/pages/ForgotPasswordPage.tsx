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

type ForgotForm = {
  email: string;
};

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const setEmail = useResetFlowStore((state) => state.setEmail);
  const clearFlow = useResetFlowStore((state) => state.clearFlow);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiService.forgotPassword(values);
      clearFlow();
      setEmail(values.email);
      pushToast('Код отправлен на email', 'success');
      navigate('/verify-reset-code');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Восстановление пароля" subtitle="Отправьте email, чтобы получить код сброса.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={errors.email?.message}
            inputProps={{
              type: 'email',
              placeholder: 'mail@example.com',
              autoComplete: 'email',
              ...register('email', { required: 'Введите email' }),
            }}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Отправляем...' : 'Отправить код'}
          </GradientButton>
        </form>
      </GlassPanel>
    </PageShell>
  );
};
