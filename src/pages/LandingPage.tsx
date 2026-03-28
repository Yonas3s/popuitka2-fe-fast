import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../lib/api/service';
import { APP_TITLE } from '../lib/config/env';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';

export const LandingPage = () => {
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');
  const liveLabel = health === 'online' ? 'v1.0.4 Онлайн' : 'v1.0.4 Проверка';
  const healthClass = `health-${health}`;
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let cancelled = false;

    apiService
      .health()
      .then(() => {
        if (!cancelled) {
          setHealth('online');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth('offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stitch-landing">
      <UnifiedHeader
        as="nav"
        className="stitch-nav"
        containerClassName="stitch-container stitch-nav-row"
        brandClassName="stitch-brand"
        brandContent={
          <span>
            unit-labs
            <em>_</em>
          </span>
        }
        centerClassName="stitch-nav-links"
        centerContent={
          <>
            <a href="#features">Возможности</a>
            <a href="#workflow">Процесс</a>
            <a href="#workflow">CLI</a>
            <a href="#mcp">MCP</a>
          </>
        }
        rightClassName="stitch-nav-actions"
        rightContent={
          <>
            <Link to="/signin" className="stitch-link-button">
              Войти
            </Link>
            <Link to="/signup" className="stitch-solid-button">
              Начать
            </Link>
          </>
        }
      />

      <main className="stitch-main">
        <div className="stitch-main-bg" />
        <div className="stitch-main-glow" />

        <section className="stitch-container stitch-hero">
          <div className="stitch-live-badge">
            <span className={`stitch-live-dot ${healthClass}`} />
            <span>{liveLabel}</span>
          </div>

          <h1 className="stitch-title">
            Управляйте релизом,
            <br />
            <span>а не хаосом.</span>
          </h1>

          <p className="stitch-gradient-title">От бэклога до апрува клиента.</p>

          <p className="stitch-subtitle">
            Unit-labs наводит порядок в цикле поставки. Минималистичный инструмент для инженерных команд, которым
            важны прозрачность и контроль.
          </p>

          <div className="stitch-hero-actions">
            <Link to="/signup" className="stitch-ghost-cta">
              Начать
            </Link>
          </div>

          <div className="stitch-showcase">
            <div className="stitch-showcase-head">
              <span />
              <span />
              <span />
            </div>
            <div className="stitch-showcase-grid">
              <aside className="stitch-showcase-side">
                <div className="line w40" />
                <div className="line w80" />
                <div className="line w68" />
                <div className="line w76" />
              </aside>
              <div className="stitch-showcase-main">
                <div className="line w34" />
                <div className="stitch-showcase-tasks">
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w72" />
                    </div>
                    <span className="badge ok">одобрено</span>
                  </article>
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w56" />
                    </div>
                    <span className="badge review">ревью</span>
                  </article>
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w64" />
                    </div>
                    <span className="badge wait">активно</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="stitch-section" id="features">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Управляйте процессом</h2>
            <p>Три простых этапа, чтобы держать релизный пайплайн под контролем.</p>
          </div>
          <div className="stitch-features-grid">
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">B</div>
              <h3>Структурный бэклог</h3>
              <p>Фиксируйте задачи и фичи в чистом списке. Приоритизируйте быстро и без лишнего шума.</p>
              <div className="stitch-feature-visual list">
                <span />
                <span />
              </div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">S</div>
              <h3>Этапы релиза</h3>
              <p>Проводите работу через настраиваемые среды: разработка, предпрод и продакшн с понятной визуализацией.</p>
              <div className="stitch-feature-visual flow">
                <span />
                <span />
                <span />
              </div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">A</div>
              <h3>Апрув клиента</h3>
              <p>Приглашайте клиентов смотреть нужные сборки и собирайте подтверждения с фидбеком в одном месте.</p>
              <div className="stitch-feature-visual approve">
                <span>Одобрено</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="stitch-dev" id="workflow">
        <div className="stitch-container stitch-dev-grid">
          <div className="stitch-dev-copy">
            <h2>
              <span>&lt;</span>Разработчик<span>/&gt;</span> в фокусе.
            </h2>
            <p>Собрано на привычном стеке. Работайте через CLI и ускоряйте ежедневные действия без лишних переходов.</p>
            <div className="stitch-dev-tags">
              <span>npm i -g @yokio42/unit-labs-cli</span>
              <span>unit-labs auth login</span>
              <span>unit-labs auth whoami</span>
            </div>
            <a
              className="stitch-dev-doc-link"
              href="https://www.npmjs.com/package/@yokio42/unit-labs-cli?activeTab=readme"
              target="_blank"
              rel="noreferrer"
            >
              Открыть документацию CLI
            </a>
          </div>
          <pre className="stitch-dev-code">{`# Установка
npm install -g @yokio42/unit-labs-cli

# Быстрый старт
unit-labs auth login
unit-labs auth whoami`}</pre>
        </div>
      </section>

      <section className="stitch-cli" id="mcp">
        <div className="stitch-container stitch-cli-grid">
          <div className="stitch-cli-copy">
            <h2>MCP сервер для Unit Labs</h2>
            <p>Подключайте Unit Labs в любой MCP-совместимый клиент и работайте с проектами/задачами прямо из агента.</p>
            <p className="stitch-cli-subtitle">Что это дает</p>
            <ul className="stitch-cli-list">
              <li>единый доступ к данным проекта через MCP-инструменты</li>
              <li>без ручных запросов к API в повседневной работе</li>
              <li>быстрое подключение через `npx` и PAT из настроек</li>
            </ul>
            <div className="stitch-cli-pills">
              <span>npx -y @yokio42/unit-labs-mcp</span>
              <span>UNIT_LABS_API</span>
              <span>UNIT_LABS_TOKEN</span>
            </div>
            <a
              className="stitch-dev-doc-link"
              href="https://www.npmjs.com/package/@yokio42/unit-labs-mcp"
              target="_blank"
              rel="noreferrer"
            >
              Открыть документацию MCP
            </a>
          </div>

          <div className="stitch-cli-side">
            <article className="stitch-cli-card">
              <h3>Конфиг MCP</h3>
              <pre>{`{
  "mcpServers": {
    "unit-labs": {
      "command": "npx",
      "args": ["-y", "@yokio42/unit-labs-mcp"],
      "env": {
        "UNIT_LABS_API": "https://popuitka2-be.onrender.com",
        "UNIT_LABS_TOKEN": "ul_..."
      }
    }
  }
}`}</pre>
            </article>

            <article className="stitch-cli-card">
              <h3>Где взять токен</h3>
              <pre>{`Настройки → API токены
1) Создать токен
2) Скопировать (показывается один раз)
3) Подставить в UNIT_LABS_TOKEN`}</pre>
            </article>
          </div>
        </div>
      </section>

      <footer className="stitch-footer" id="pricing">
        <div className="stitch-container stitch-footer-row">
          <p>
            © {year} {APP_TITLE}
          </p>
          <div>
            <a href="#features">Возможности</a>
            <a href="#workflow">Процесс</a>
            <a href="#mcp">MCP</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
