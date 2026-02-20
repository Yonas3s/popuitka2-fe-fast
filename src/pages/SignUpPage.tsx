import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api/service';
import {
  OAUTH_POST_LOGIN_REDIRECT_KEY,
  getRedirectFromSearch,
  withRedirectQuery,
} from '../lib/auth/redirect';
import { normalizeApiError } from '../lib/api/errors';
import { API_BASE_URL } from '../lib/config/env';
import { useUiStore } from '../store/ui.store';

type SignUpForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pushToast = useUiStore((state) => state.pushToast);
  const redirectPath = getRedirectFromSearch(location.search);
  const signInHref = withRedirectQuery('/signin', redirectPath);
  const githubAuthUrl = `${API_BASE_URL}/auth/github`;
  const postLoginPath = redirectPath || '/projects';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>();

  const passwordValue = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiService.signup({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      pushToast('Регистрация успешна. Теперь можно войти.', 'success');
      navigate(withRedirectQuery('/signin', redirectPath), { replace: true });
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
        <span className="signin-v2-marker marker-b">B2 :: SECURE_GATE</span>
        <span className="signin-v2-marker marker-c">C3 :: VER_2.4.0</span>
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

      <main className="signin-v2-main signin-v2-main-scroll">
        <section className="signin-v2-card">
          <div className="signin-v2-strip" />
          <div className="signin-v2-body">
            <header className="signin-v2-head">
              <h1>Создать аккаунт</h1>
              <p>system.create(user)</p>
            </header>

            <a
              className="signin-v2-github"
              href={githubAuthUrl}
              onClick={() => {
                sessionStorage.setItem(OAUTH_POST_LOGIN_REDIRECT_KEY, postLoginPath);
              }}
            >
              <svg className="signin-v2-github-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.66 7.66 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              <span>Continue with GitHub</span>
            </a>

            <div className="signin-v2-divider" role="separator" aria-label="or">
              <span>or</span>
            </div>

            <form className="signin-v2-form signin-v2-form-compact" onSubmit={onSubmit}>
              <label className="signin-v2-field">
                <span>Имя</span>
                <input
                  placeholder="John Doe"
                  autoComplete="username"
                  {...register('username', { required: 'Введите имя пользователя' })}
                />
                {errors.username?.message ? <small>{errors.username.message}</small> : null}
              </label>

              <label className="signin-v2-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register('email', { required: 'Введите email' })}
                />
                {errors.email?.message ? <small>{errors.email.message}</small> : null}
              </label>

              <label className="signin-v2-field">
                <span>Пароль</span>
                <div className="signin-v2-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('password', {
                      required: 'Введите пароль',
                      minLength: { value: 6, message: 'Минимум 6 символов' },
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
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Повторите пароль',
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

              <button className="signin-v2-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Создаем...' : 'Создать аккаунт'}
              </button>
            </form>

            <div className="signin-v2-signup">
              <p>
                Уже есть аккаунт?
                <Link to={signInHref}>Войти</Link>
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

        <p className="signin-v2-copyright">© 2024 unit-labs inc. All protocols secure.</p>
      </main>
    </div>
  );
};
