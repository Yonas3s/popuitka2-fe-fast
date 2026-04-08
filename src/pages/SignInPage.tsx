import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { normalizeApiError } from '../lib/api/errors';
import {
  OAUTH_POST_LOGIN_REDIRECT_KEY,
  getRedirectFromSearch,
  sanitizeRedirectPath,
  withRedirectQuery,
} from '../lib/auth/redirect';
import { API_BASE_URL } from '../lib/config/env';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';

type SignInForm = {
  email: string;
  password: string;
};

const GitHubIcon = () => (
  <svg className="signin-v2-github-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.66 7.66 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="signin-v2-eye-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {open ? (
      <path d="M12 5c-5.6 0-9.5 4.3-10.7 6 .9 1.5 4.4 8 10.7 8 6.2 0 9.8-6.4 10.7-8C21.4 9.2 17.6 5 12 5Zm0 12c-3 0-5.5-2.5-5.5-5.5S9 6 12 6s5.5 2.5 5.5 5.5S15 17 12 17Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    ) : (
      <path d="M3.3 2.3 2 3.6l3 3C2.8 8.3 1.4 10.8 1 11.5c.8 1.3 4.1 7.5 11 7.5 2 0 3.8-.5 5.3-1.2l3.5 3.5 1.4-1.4L3.3 2.3Zm8.7 14.2c-3 0-5.5-2.5-5.5-5.5 0-1 .3-1.8.7-2.6l7.4 7.4c-.8.4-1.6.7-2.6.7Zm.2-10.5c5.4 0 9 5.2 9.8 6.5-.4.7-1.6 2.9-3.6 4.6L15.8 14a3.5 3.5 0 0 0-4.8-4.8L8.6 6.8c1-.4 2.2-.8 3.6-.8Z" />
    )}
  </svg>
);

export const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const pushToast = useUiStore((state) => state.pushToast);
  const githubAuthUrl = `${API_BASE_URL}/auth/github`;
  const redirectFromQuery = getRedirectFromSearch(location.search);
  const redirectFromState = sanitizeRedirectPath((location.state as { from?: string } | null)?.from);
  const postLoginPath = redirectFromQuery || redirectFromState || '/projects';
  const signUpHref = withRedirectQuery('/signup', postLoginPath);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      pushToast('Вход выполнен', 'success');
      sessionStorage.removeItem(OAUTH_POST_LOGIN_REDIRECT_KEY);
      navigate(postLoginPath, { replace: true });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setServerError(normalized.message);
    }
  });

  return (
    <div className="signin-v2-page">
      <div className="signin-v2-grid-bg" />
      <div className="signin-v2-overlay">
        <span className="signin-v2-marker marker-a">A1 :: SYS_INIT</span>
        <span className="signin-v2-marker marker-b">B2 :: SECURE_GATE</span>
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
              <h1>Вход в аккаунт</h1>
              <p>система.доступ(пользователь)</p>
            </header>

            <a
              className="signin-v2-github"
              href={githubAuthUrl}
              onClick={() => {
                sessionStorage.setItem(OAUTH_POST_LOGIN_REDIRECT_KEY, postLoginPath);
              }}
            >
              <GitHubIcon />
              <span>Продолжить через GitHub</span>
            </a>

            <div className="signin-v2-divider" role="separator" aria-label="или">
              <span>или</span>
            </div>

            <form className="signin-v2-form" onSubmit={onSubmit}>
              <label className="signin-v2-field">
                <span>Почта</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Введите email',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Некорректный формат email' },
                  })}
                />
                {errors.email?.message ? <small>{errors.email.message}</small> : null}
              </label>

              <label className="signin-v2-field">
                <span>Пароль</span>
                <div className="signin-v2-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', { required: 'Введите пароль' })}
                  />
                  <button
                    type="button"
                    className="signin-v2-eye"
                    onClick={() => {
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password?.message ? <small>{errors.password.message}</small> : null}
              </label>

              <div className="signin-v2-row">
                <label className="signin-v2-remember">
                  <input type="checkbox" />
                  <span>Запомнить меня</span>
                </label>
                <Link to="/forgot-password">Забыли пароль?</Link>
              </div>

              {serverError ? <p className="signin-v2-server-error">{serverError}</p> : null}

              <button className="signin-v2-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Проверяем...' : 'Войти'}
              </button>
            </form>

            <div className="signin-v2-signup">
              <p>
                Нет аккаунта?
                <Link to={signUpHref}>Зарегистрироваться</Link>
              </p>
            </div>
          </div>

          <footer className="signin-v2-card-footer">
            <div>
              <span />
              <span />
              <span />
            </div>
            <small>ID: 524-88-AB</small>
          </footer>
        </section>
        <p className="signin-v2-copyright">© 2024 unit-labs inc. Все протоколы защищены.</p>
      </main>
    </div>
  );
};
