import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { GradientButton } from '../components/ui/GradientButton';
import { OtpCodeInput } from '../components/ui/OtpCodeInput';
import { TextInput } from '../components/ui/TextInput';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { useResetFlowStore } from '../store/reset-flow.store';

const CODE_LENGTH = 6;

export const VerifyResetCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);
  const email = useResetFlowStore((state) => state.email);
  const setEmail = useResetFlowStore((state) => state.setEmail);
  const setCode = useResetFlowStore((state) => state.setCode);
  const [code, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const emailFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('email')?.trim() || '';
  }, [location.search]);
  const effectiveEmail = email || emailFromQuery;

  useEffect(() => {
    if (!email && emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [email, emailFromQuery, setEmail]);

  useEffect(() => {
    if (!effectiveEmail) {
      pushToast('Сначала укажите email для восстановления', 'info');
      navigate('/forgot-password', { replace: true });
    }
  }, [effectiveEmail, navigate, pushToast]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!effectiveEmail) {
      return;
    }

    const normalizedCode = code.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (normalizedCode.length < CODE_LENGTH) {
      setCodeError(`Введите код из ${CODE_LENGTH} цифр`);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.verifyResetCode({ email: effectiveEmail, code: normalizedCode });
      setCode(normalizedCode);
      pushToast('Код подтвержден', 'success');
      navigate('/reset-password');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Подтвердите код" subtitle="Проверьте почту и введите код из 6 цифр.">
      <GlassPanel className="auth-panel">
        <form className="form-grid" onSubmit={onSubmit}>
          <TextInput
            label="Email"
            error={undefined}
            inputProps={{
              type: 'email',
              value: effectiveEmail,
              readOnly: true,
              disabled: true,
            }}
          />

          <OtpCodeInput
            label="Код подтверждения"
            value={code}
            onChange={(nextCode) => {
              setCodeValue(nextCode);
              if (codeError) {
                setCodeError('');
              }
            }}
            error={codeError}
            length={CODE_LENGTH}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Проверяем...' : 'Подтвердить'}
          </GradientButton>
        </form>
      </GlassPanel>
    </PageShell>
  );
};
