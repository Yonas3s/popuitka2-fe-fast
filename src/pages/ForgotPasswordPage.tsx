import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { APP_COPYRIGHT_TEXT } from '../lib/config/env';
import { useUiStore } from '../store/ui.store';
import { useResetFlowStore } from '../store/reset-flow.store';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { SupportMailLink } from '../components/support/SupportMailLink';

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
    <div className="signin-v2-page">
      <div className="signin-v2-grid-bg" />
      <div className="signin-v2-overlay">
        <span className="signin-v2-marker marker-a">A1 :: SYS_INIT</span>
        <span className="signin-v2-marker marker-b">B2 :: RECOVERY_MOD</span>
        <span className="signin-v2-marker marker-c">C3 :: VER_2.4.0</span>
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
              <h1>Восстановление пароля</h1>
              <p>система.запрос_восстановления(почта)</p>
            </header>

            <form className="signin-v2-form" onSubmit={onSubmit}>
              <label className="signin-v2-field">
                <span>Почта</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register('email', { required: 'Введите email' })}
                />
                {errors.email?.message ? <small>{errors.email.message}</small> : null}
              </label>

              <button className="signin-v2-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Отправляем...' : 'Отправить код'}
              </button>
            </form>

            <div className="signin-v2-back-link">
              <Link to="/signin">← Вернуться ко входу</Link>
            </div>
          </div>

          <footer className="signin-v2-card-footer">
            <div className="signin-v2-indicator-warning">
              <span />
              <span />
              <span />
            </div>
            <small>
              ID: REC-99-XZ • <SupportMailLink>Помощь</SupportMailLink>
            </small>
          </footer>
        </section>

        <p className="signin-v2-copyright">{APP_COPYRIGHT_TEXT}</p>
      </main>
    </div>
  );
};
