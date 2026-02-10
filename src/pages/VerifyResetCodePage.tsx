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

type VerifyForm = {
  email: string;
  code: string;
};

export const VerifyResetCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyForm>();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    if (email) {
      setValue('email', email);
    }
  }, [location.search, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiService.verifyResetCode(values);
      pushToast('Код подтвержден', 'success');
      const query = `email=${encodeURIComponent(values.email)}&code=${encodeURIComponent(values.code)}`;
      navigate(`/reset-password?${query}`);
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    }
  });

  return (
    <PageShell title="Подтвердите код" subtitle="Введите email и код из письма.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={errors.email?.message}
            inputProps={{
              type: 'email',
              placeholder: 'mail@example.com',
              ...register('email', { required: 'Введите email' }),
            }}
          />

          <TextInput
            label="Код"
            error={errors.code?.message}
            inputProps={{
              placeholder: '123456',
              ...register('code', {
                required: 'Введите код',
                minLength: { value: 4, message: 'Слишком короткий код' },
              }),
            }}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Проверяем...' : 'Подтвердить'}
          </GradientButton>
        </form>
      </GlassPanel>
    </PageShell>
  );
};
