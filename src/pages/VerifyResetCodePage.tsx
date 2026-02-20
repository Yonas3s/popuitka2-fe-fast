import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { OtpCodeInput } from '../components/ui/OtpCodeInput';
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
  const [resendLeft, setResendLeft] = useState(59);
  const [resending, setResending] = useState(false);
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

  useEffect(() => {
    if (resendLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [resendLeft]);

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

  const onResend = async () => {
    if (!effectiveEmail || resendLeft > 0 || resending) {
      return;
    }

    setResending(true);
    try {
      await apiService.forgotPassword({ email: effectiveEmail });
      setResendLeft(59);
      pushToast('Новый код отправлен', 'success');
    } catch (error) {
      const normalized = normalizeApiError(error);
      pushToast(normalized.message, 'error');
    } finally {
      setResending(false);
    }
  };

  const timerLabel = `00:${String(resendLeft).padStart(2, '0')}`;

  return (
    <div className="signin-v2-page">
      <div className="signin-v2-grid-bg" />
      <div className="signin-v2-overlay">
        <span className="signin-v2-marker marker-a">A1 :: SYS_RECOVER</span>
        <span className="signin-v2-marker marker-b">B2 :: VERIFY_GATE</span>
        <span className="signin-v2-marker marker-c">C3 :: VER_2.4.1</span>
        <span className="signin-v2-dot dot-a" />
        <span className="signin-v2-dot dot-b" />
      </div>

      <nav className="signin-v2-nav">
        <div className="signin-v2-nav-wrap">
          <Link to="/" className="signin-v2-brand">
            <span className="signin-v2-brand-text">
              unit-labs<em>_</em>
            </span>
          </Link>
          <span className="signin-v2-env">env: production</span>
        </div>
      </nav>

      <main className="signin-v2-main">
        <section className="signin-v2-card signin-v2-card-wide">
          <div className="signin-v2-strip" />
          <div className="signin-v2-body">
            <header className="signin-v2-head">
              <h1>Введите код</h1>
              <p>security.verify_code(sent_to_email)</p>
            </header>

            <form className="signin-v2-form" onSubmit={onSubmit}>
              <div className="signin-v2-otp-wrap">
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
              </div>

              <button className="signin-v2-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Проверяем...' : 'Подтвердить'}
              </button>
            </form>

            <div className="signin-v2-resend">
              <button type="button" onClick={onResend} disabled={resendLeft > 0 || resending}>
                {resendLeft > 0 ? (
                  <>
                    Отправить код повторно (через <span>{timerLabel}</span>)
                  </>
                ) : resending ? (
                  'Отправляем...'
                ) : (
                  'Отправить код повторно'
                )}
              </button>
            </div>
          </div>

          <footer className="signin-v2-card-footer">
            <div className="signin-v2-indicator-warning">
              <span />
              <span />
              <span />
            </div>
            <small>TOKEN: REQ-2024-X8</small>
          </footer>
        </section>

        <div className="signin-v2-bottom-links">
          <Link to="/signin">← Вернуться ко входу</Link>
          <p className="signin-v2-copyright">© 2024 unit-labs inc. All protocols secure.</p>
        </div>
      </main>
    </div>
  );
};
