import { Link, useNavigate } from 'react-router-dom';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { SEO } from '../components/seo/SEO';
import { useAuthStore } from '../store/auth.store';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="notfound-page">
      <SEO
        title="404 — страница не найдена"
        description="Страница не найдена. Вернитесь на главную unit-labs."
        noindex
      />
      <UnifiedHeader
        as="nav"
        className="stitch-nav"
        containerClassName="stitch-container stitch-nav-row"
        brandClassName="stitch-brand"
        brandContent={<span>unit-labs<em>_</em></span>}
        rightClassName="stitch-nav-actions"
        rightContent={
          isAuthenticated ? (
            <Link to="/projects" className="stitch-solid-button">Перейти к проектам</Link>
          ) : (
            <>
              <Link to="/signin" className="stitch-link-button">Войти</Link>
              <Link to="/signup" className="stitch-solid-button">Начать</Link>
            </>
          )
        }
      />

      <main className="notfound-main">
        <div className="notfound-grid-bg" />

        <section className="notfound-content">
          <div className="notfound-badge">
            <span className="notfound-badge-dot" />
            <span>ERR_404 :: NOT_FOUND</span>
          </div>

          <h1 className="notfound-code">404</h1>

          <p className="notfound-title">Страница не найдена</p>

          <p className="notfound-description">
            Похоже, URL неверный или ресурс уже удалён. Проверьте адрес
            или вернитесь на главную.
          </p>

          <div className="notfound-actions">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => navigate(-1)}
            >
              ← Назад
            </button>
            <Link to={isAuthenticated ? '/projects' : '/'} className="ui-btn ui-btn-primary">
              {isAuthenticated ? 'К проектам' : 'На главную'}
            </Link>
          </div>

          <pre className="notfound-terminal">
{`$ unit-labs fetch
> GET ${typeof window !== 'undefined' ? window.location.pathname : '/unknown'}
> status: 404
> error: resource not found`}
          </pre>
        </section>
      </main>
    </div>
  );
};
