import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../lib/api/service';
import { APP_TITLE } from '../lib/config/env';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { useAuthStore } from '../store/auth.store';

export const LandingPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const meLoading = useAuthStore((state) => state.meLoading);
  const meLoaded = useAuthStore((state) => state.meLoaded);
  const loadMe = useAuthStore((state) => state.loadMe);
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    if (isAuthenticated && !user && !meLoading && !meLoaded) {
      void loadMe();
    }
  }, [isAuthenticated, user, meLoading, meLoaded, loadMe]);

  const liveLabel = health === 'online' ? 'v1.0.4 Онлайн' : 'v1.0.4 Проверка';
  const healthClass = `health-${health}`;
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let cancelled = false;
    apiService
      .health()
      .then(() => { if (!cancelled) setHealth('online'); })
      .catch(() => { if (!cancelled) setHealth('offline'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="stitch-landing">
      {/* ── Nav ── */}
      <UnifiedHeader
        as="nav"
        className="stitch-nav"
        containerClassName="stitch-container stitch-nav-row"
        brandClassName="stitch-brand"
        brandContent={<span>unit-labs<em>_</em></span>}
        centerClassName="stitch-nav-links"
        centerContent={
          <>
            <a href="#features">Возможности</a>
            <a href="#how">Как работает</a>
            <a href="#integrations">Интеграции</a>
          </>
        }
        rightClassName="stitch-nav-actions"
        rightContent={
          isAuthenticated ? (
            <>
              <div className="stitch-user-info">
                <strong>{user?.username || 'Загрузка...'}</strong>
                <span>{user?.email || ''}</span>
              </div>
              <Link to="/projects" className="stitch-solid-button">Перейти к проектам</Link>
            </>
          ) : (
            <>
              <Link to="/signin" className="stitch-link-button">Войти</Link>
              <Link to="/signup" className="stitch-solid-button">Начать</Link>
            </>
          )
        }
      />

      {/* ── 1. Hero ── */}
      <main className="stitch-main">
        <div className="stitch-main-bg" />
        <div className="stitch-main-glow" />

        <section className="stitch-container stitch-hero">
          <div className="stitch-live-badge">
            <span className={`stitch-live-dot ${healthClass}`} />
            <span>{liveLabel}</span>
          </div>

          <h1 className="stitch-title">
            Релиз-менеджмент<br />
            <span>для dev-команд.</span>
          </h1>

          <p className="stitch-gradient-title">Задачи. Этапы. GitHub. Апрув клиента.</p>

          <p className="stitch-subtitle">
            Создайте проект, разбейте на задачи, привяжите репозиторий.
            Клиент видит прогресс и апрувит сборку по ссылке.
          </p>

          <p className="stitch-subtitle stitch-subtitle-agent">
            AI-агент умеет декомпозировать задачи за вас — опишите что нужно сделать,
            остальное он разложит сам.
          </p>

          <div className="stitch-hero-actions">
            <Link to="/signup" className="stitch-ghost-cta">Начать бесплатно</Link>
          </div>

          <div className="stitch-showcase">
            <div className="stitch-showcase-head">
              <span /><span /><span />
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
                    <div className="task-left"><span className="box" /><div className="line w72" /></div>
                    <span className="badge ok">одобрено</span>
                  </article>
                  <article>
                    <div className="task-left"><span className="box" /><div className="line w56" /></div>
                    <span className="badge review">ревью</span>
                  </article>
                  <article>
                    <div className="task-left"><span className="box" /><div className="line w64" /></div>
                    <span className="badge wait">активно</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 2. Для кого ── */}
      <section className="stitch-audience" id="audience">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Для кого это</h2>
            <p>Каждый участник процесса получает то, что ему нужно.</p>
          </div>
          <div className="stitch-audience-grid">
            <article className="stitch-audience-card">
              <div className="stitch-audience-icon">D</div>
              <h3>Разработчики</h3>
              <p>CLI, MCP-сервер, API-токены. Работайте из терминала и агентов, без лишних вкладок.</p>
            </article>
            <article className="stitch-audience-card">
              <div className="stitch-audience-icon">L</div>
              <h3>Тимлиды</h3>
              <p>Полная картина: кто над чем работает, на каком этапе релиз, что блокирует деплой.</p>
            </article>
            <article className="stitch-audience-card">
              <div className="stitch-audience-icon">C</div>
              <h3>Клиенты</h3>
              <p>Публичная страница релиза. Смотрят прогресс и апрувят сборку в один клик.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3. Возможности ── */}
      <section className="stitch-section" id="features">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Возможности</h2>
            <p>Всё что нужно для управления релизным пайплайном.</p>
          </div>
          <div className="stitch-features-grid">
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">B</div>
              <h3>Структурный бэклог</h3>
              <p>Задачи, баги, фичи в одном месте. Типизация, направления, фильтры.</p>
              <div className="stitch-feature-visual list"><span /><span /></div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">S</div>
              <h3>Этапы релиза</h3>
              <p>Разработка, предпрод, продакшн. Каждый этап со своим статусом и задачами.</p>
              <div className="stitch-feature-visual flow"><span /><span /><span /></div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">A</div>
              <h3>Апрув клиента</h3>
              <p>Публичная ссылка на релиз. Клиент видит что готово и подтверждает.</p>
              <div className="stitch-feature-visual approve"><span>Одобрено</span></div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon stitch-feature-icon-ai">AI</div>
              <h3>AI-агент</h3>
              <p>Генерация задач по промпту. Выберите модель, задайте лимит — агент разложит работу на задачи.</p>
              <div className="stitch-feature-visual agent">
                <span>7 задач</span>
                <span>gemini-2.5</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 4. Как это работает ── */}
      <section className="stitch-how" id="how">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Как это работает</h2>
            <p>Четыре шага от идеи до подтверждения клиента.</p>
          </div>
          <div className="stitch-steps-grid">
            <article className="stitch-step">
              <div className="stitch-step-number">01</div>
              <h3>Создайте проект</h3>
              <p>Выберите режим: этапы для сложных релизов или плоский список для быстрых задач.</p>
            </article>
            <article className="stitch-step">
              <div className="stitch-step-number">02</div>
              <h3>Добавьте задачи</h3>
              <p>Вручную, через CLI, MCP-агента или автогенерацию. Типизируйте и назначайте.</p>
            </article>
            <article className="stitch-step">
              <div className="stitch-step-number">03</div>
              <h3>Привяжите репозиторий</h3>
              <p>GitHub App отслеживает push и merge. Задачи закрываются автоматически.</p>
            </article>
            <article className="stitch-step">
              <div className="stitch-step-number">04</div>
              <h3>Отправьте клиенту</h3>
              <p>Сгенерируйте публичную ссылку. Клиент видит прогресс и апрувит сборку.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── 5. Интеграции ── */}
      <section className="stitch-integrations" id="integrations">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Интеграции</h2>
            <p>Подключайтесь к unit-labs из любого инструмента.</p>
          </div>

          <div className="stitch-integrations-grid">
            {/* GitHub */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>GitHub Sync</h3>
                <span className="stitch-integration-badge">App</span>
              </div>
              <p>Привяжите репозитории. Merge закрывает задачи. Все события в webhook-логе.</p>
              <div className="stitch-github-demo">
                <div className="stitch-github-demo-row">
                  <span className="stitch-github-dot connected" />
                  <span>acme/web-frontend</span>
                  <span className="stitch-github-badge">auto-close</span>
                </div>
                <div className="stitch-github-demo-row">
                  <span className="stitch-github-dot connected" />
                  <span>acme/api-server</span>
                  <span className="stitch-github-badge">auto-close</span>
                </div>
                <div className="stitch-github-demo-row pending">
                  <span className="stitch-github-dot" />
                  <span>acme/shared-utils</span>
                  <span className="stitch-github-badge-outline">привязать</span>
                </div>
              </div>
            </article>

            {/* CLI */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>CLI</h3>
                <span className="stitch-integration-badge">npm</span>
              </div>
              <p>Управляйте проектами и задачами из терминала. Никаких вкладок.</p>
              <pre className="stitch-integration-code">{`npm i -g @yokio42/unit-labs-cli
unit-labs auth login
unit-labs projects list`}</pre>
              <a
                className="stitch-dev-doc-link"
                href="https://www.npmjs.com/package/@yokio42/unit-labs-cli?activeTab=readme"
                target="_blank"
                rel="noreferrer"
              >
                Документация CLI
              </a>
            </article>

            {/* MCP */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>MCP Server</h3>
                <span className="stitch-integration-badge">npx</span>
              </div>
              <p>Подключите unit-labs к Claude, Cursor или любому MCP-клиенту.</p>
              <pre className="stitch-integration-code">{`{
  "unit-labs": {
    "command": "npx",
    "args": ["-y", "@yokio42/unit-labs-mcp"],
    "env": {
      "UNIT_LABS_TOKEN": "ul_..."
    }
  }
}`}</pre>
              <a
                className="stitch-dev-doc-link"
                href="https://www.npmjs.com/package/@yokio42/unit-labs-mcp"
                target="_blank"
                rel="noreferrer"
              >
                Документация MCP
              </a>
            </article>

            {/* Telegram */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>Telegram Bot</h3>
                <span className="stitch-integration-badge stitch-integration-badge-live">Bot</span>
              </div>
              <p>
                Упомяни бота в чате — он прочитает код и сам заведёт задачу со ссылками на файлы.
              </p>
              <div className="stitch-tg-chat">
                <div className="stitch-tg-msg user">
                  <div className="stitch-tg-avatar">Я</div>
                  <div className="stitch-tg-bubble">
                    <b>@unit_duck_bot</b> проанализируй авторизацию на фронте и заведи задачу по безопасности
                  </div>
                </div>
                <div className="stitch-tg-msg bot">
                  <div className="stitch-tg-avatar bot-avatar">🦆</div>
                  <div className="stitch-tg-bubble bot-bubble">
                    <div className="stitch-tg-task">
                      <span className="stitch-tg-check">✓</span>
                      <span className="stitch-tg-task-key">POPU-87</span>
                      <span className="stitch-tg-task-title">Улучшить защиту авторизации</span>
                    </div>
                    <div className="stitch-tg-sources">
                      📁 LoginPage.tsx · authClient.ts · middleware/auth.js
                    </div>
                  </div>
                </div>
              </div>
              <div className="stitch-tg-commands">
                <span className="stitch-tg-cmd">/tasks</span>
                <span className="stitch-tg-cmd">/mine</span>
                <span className="stitch-tg-cmd">/task POPU-15</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 6. CTA ── */}
      <section className="stitch-final-cta">
        <div className="stitch-container stitch-final-cta-inner">
          <h2>Начните за 2 минуты</h2>
          <p>Бесплатно. Без карты. Создайте первый проект и пригласите команду.</p>
          <div className="stitch-final-cta-actions">
            <Link to="/signup" className="stitch-ghost-cta">Создать аккаунт</Link>
            <a
              href="https://www.npmjs.com/package/@yokio42/unit-labs-cli?activeTab=readme"
              target="_blank"
              rel="noreferrer"
              className="stitch-link-button"
            >
              Или начните из CLI
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="stitch-footer">
        <div className="stitch-container stitch-footer-row">
          <p>© {year} {APP_TITLE}</p>
          <div className="stitch-footer-links">
            <a href="#features">Возможности</a>
            <a href="#how">Как работает</a>
            <a href="#integrations">Интеграции</a>
            <a
              href="https://www.npmjs.com/package/@yokio42/unit-labs-cli"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
            <a
              href="https://github.com/apps/popuitkav2"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
