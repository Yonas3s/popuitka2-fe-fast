import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { useResetFlowStore } from '../store/reset-flow.store';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';

type ResetForm = {
  password: string;
  confirmPassword: string;
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const storeEmail = useResetFlowStore((state) => state.email);
  const storeCode = useResetFlowStore((state) => state.code);
  const setFlow = useResetFlowStore((state) => state.setFlow);
  const clearFlow = useResetFlowStore((state) => state.clearFlow);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const tokenFromUrl = searchParams.get('reset_token') || searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const email = storeEmail || emailFromUrl;
  const code = storeCode || tokenFromUrl;

  useEffect(() => {
    if (!storeEmail && emailFromUrl && tokenFromUrl) {
      setFlow(emailFromUrl, tokenFromUrl);
    }
  }, [emailFromUrl, tokenFromUrl, storeEmail, setFlow]);

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

    setServerError(null);
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
      setServerError(normalized.message);
    }
  });

  return (
    <div className="signin-v2-page">
      <div className="signin-v2-grid-bg" />
      <div className="signin-v2-overlay">
        <span className="signin-v2-marker marker-a">A1 :: SYS_RECOVERY</span>
        <span className="signin-v2-marker marker-b">B2 :: SECURE_UPDATE</span>
        <span className="signin-v2-marker marker-c">C3 :: VER_2.4.1</span>
        <span className="signin-v2-dot dot-a" />
        <span className="signin-v2-dot dot-b" />
      </div>

      <UnifiedHeader
        as="nav"
        className="signin-v2-nav"
        containerClassName="signin-v2-nav-wrap"
        brandClassName="signin-v2-brand"
        brandContent={
          <span className="signin-v2-brand-text">
            unit-labs<em>_</em>
          </span>
        }
        envLabel="окружение: прод"
        envClassName="signin-v2-env"
      />

      <main className="signin-v2-main">
        <section className="signin-v2-card">
          <div className="signin-v2-strip" />
          <div className="signin-v2-body">
            <header className="signin-v2-head">
              <h1>Новый пароль</h1>
              <p>система.обновление_данных(учетные_данные)</p>
            </header>

            <form className="signin-v2-form" onSubmit={onSubmit}>
              <label className="signin-v2-field">
                <span>Новый пароль</span>
                <div className="signin-v2-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Введите новый пароль',
                      minLength: { value: 8, message: 'Минимум 8 символов' },
                      validate: {
                        hasUpper: (v) => /[A-ZА-ЯЁ]/.test(v) || 'Нужна хотя бы одна заглавная буква',
                        hasDigit: (v) => /\d/.test(v) || 'Нужна хотя бы одна цифра',
                      },
                    })}
                  />
                  <button
                    className="signin-v2-eye"
                    type="button"
                    onClick={() => {
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <svg className="signin-v2-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M12 5c-5.6 0-9.5 4.3-10.7 6 .9 1.5 4.4 8 10.7 8 6.2 0 9.8-6.4 10.7-8C21.4 9.2 17.6 5 12 5Zm0 12c-3 0-5.5-2.5-5.5-5.5S9 6 12 6s5.5 2.5 5.5 5.5S15 17 12 17Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                    </svg>
                  </button>
                </div>
                {errors.password?.message ? <small>{errors.password.message}</small> : null}
              </label>

              <label className="signin-v2-field">
                <span>Повтор пароля</span>
                <div className="signin-v2-password-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Повторите новый пароль',
                      validate: (value) => value === passwordValue || 'Пароли не совпадают',
                    })}
                  />
                  <button
                    className="signin-v2-eye"
                    type="button"
                    onClick={() => {
                      setShowConfirmPassword((prev) => !prev);
                    }}
                    aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <svg className="signin-v2-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M12 5c-5.6 0-9.5 4.3-10.7 6 .9 1.5 4.4 8 10.7 8 6.2 0 9.8-6.4 10.7-8C21.4 9.2 17.6 5 12 5Zm0 12c-3 0-5.5-2.5-5.5-5.5S9 6 12 6s5.5 2.5 5.5 5.5S15 17 12 17Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                    </svg>
                  </button>
                </div>
                {errors.confirmPassword?.message ? <small>{errors.confirmPassword.message}</small> : null}
              </label>

              {serverError ? <p className="signin-v2-server-error">{serverError}</p> : null}

              <button className="signin-v2-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохраняем...' : 'Изменить пароль'}
              </button>
            </form>

            <div className="signin-v2-back-link">
              <Link to="/signin">← Вернуться ко входу</Link>
            </div>
          </div>

          <footer className="signin-v2-card-footer">
            <div className="signin-v2-indicator-warning signin-v2-indicator-pulse">
              <span />
              <span />
              <span />
            </div>
            <small>Шаг 3/3</small>
          </footer>
        </section>

        <p className="signin-v2-copyright">© 2024 unit-labs inc. Все протоколы защищены.</p>
      </main>
    </div>
  );
};
