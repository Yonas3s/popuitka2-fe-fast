import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../lib/api/service';
import { APP_TITLE } from '../lib/config/env';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { SEO } from '../components/seo/SEO';
import { useAuthStore } from '../store/auth.store';

/**
 * Placeholder for an actual product screenshot. Renders a skeleton frame
 * with an explicit label describing what goes there — so we know exactly
 * which screenshot to drop in later. Keep `ratio` close to the real asset
 * aspect ratio so the layout doesn't jump when the image swaps in.
 */
const MockupSlot = ({
  label,
  ratio = '16 / 10',
  minHeight,
  tone = 'light',
}: {
  label: string;
  ratio?: string;
  minHeight?: number;
  tone?: 'light' | 'dark';
}) => (
  <div
    className={`landing-mockup landing-mockup--${tone}`}
    style={{ aspectRatio: ratio, minHeight }}
    aria-label={`Скрин: ${label}`}
  >
    <div className="landing-mockup-chrome">
      <span />
      <span />
      <span />
    </div>
    <div className="landing-mockup-grid">
      <div className="lm-line lm-line-60" />
      <div className="lm-line lm-line-85" />
      <div className="lm-line lm-line-70" />
      <div className="lm-line lm-line-50" />
      <div className="lm-line lm-line-80" />
    </div>
    <div className="landing-mockup-label">
      <span className="landing-mockup-label-kicker">Место под скрин</span>
      <span className="landing-mockup-label-text">{label}</span>
    </div>
  </div>
);

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

  const liveLabel = health === 'online' ? 'API v1 · онлайн' : 'API · проверка';
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
      <SEO
        title="unit-labs — трекер задач, который закрывается сам"
        rawTitle
        description="Релиз-менеджмент для dev-команд: задачи, этапы, GitHub auto-close, апрув клиента по ссылке, Telegram-бот, который читает код. Работайте из UI, CLI, Cursor или Claude."
        canonicalPath="/"
      />

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
            <a href="#product">Продукт</a>
            <a href="#how">Как работает</a>
            <a href="#integrations">Интеграции</a>
            <a href="#pricing">Цена</a>
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
              <Link to="/projects" className="stitch-solid-button">К проектам</Link>
            </>
          ) : (
            <>
              <Link to="/signin" className="stitch-link-button">Войти</Link>
              <Link to="/signup" className="stitch-solid-button">Начать</Link>
            </>
          )
        }
      />

      {/* ── 1. Hero — объясняет за 5 секунд ── */}
      <main className="stitch-main">
        <div className="stitch-main-bg" />
        <div className="stitch-main-glow" />

        <section className="stitch-container landing-hero">
          <div className="landing-hero-badge">
            <span className={`stitch-live-dot ${healthClass}`} />
            <span>{liveLabel}</span>
          </div>

          <h1 className="landing-hero-title">
            Трекер задач,<br />
            <span>который закрывается сам.</span>
          </h1>

          <p className="landing-hero-lead">
            Мерджите PR — задача <b>уходит в done</b>. Клиент открывает ссылку — <b>апрувит релиз</b>. Упоминаете бота в Telegram — <b>задача создаётся со ссылками на файлы</b>.
          </p>

          <p className="landing-hero-sub">
            unit-labs — платформа релиз-менеджмента для dev-команд. Единое пространство для задач, этапов и согласования с клиентом. Работает из веб-интерфейса, терминала, Cursor и Claude.
          </p>

          <div className="landing-hero-actions">
            <Link to="/signup" className="stitch-ghost-cta">Создать проект — бесплатно</Link>
            <a
              href="https://www.npmjs.com/package/@yokio42/unit-labs-cli"
              className="stitch-link-button"
              target="_blank"
              rel="noreferrer"
            >
              npm i -g @yokio42/unit-labs-cli
            </a>
          </div>

          <div className="landing-hero-proof">
            <span>Работает с</span>
            <div className="landing-proof-logos">
              <span className="landing-proof-chip">GitHub</span>
              <span className="landing-proof-chip">Telegram</span>
              <span className="landing-proof-chip">Cursor (MCP)</span>
              <span className="landing-proof-chip">Claude Code</span>
              <span className="landing-proof-chip">CLI</span>
            </div>
          </div>

          {/* Большой скрин продукта */}
          <div className="landing-hero-mockup">
            <MockupSlot
              label="Страница этапа: List/Board, задачи с приоритетами и направлениями, drawer задачи"
              ratio="16 / 10"
              tone="light"
            />
          </div>
        </section>
      </main>

      {/* ── 2. Три ключевых сценария ── */}
      <section className="landing-killers" id="product">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Три сценария, которые экономят часы</h2>
            <p>Первый создаёт задачи по обращению в Telegram, второй согласует релиз с клиентом, третий закрывает задачи при merge в GitHub.</p>
          </div>

          <div className="landing-killers-grid">
            {/* Killer 1: Telegram research bot */}
            <article className="landing-killer">
              <div className="landing-killer-head">
                <span className="landing-killer-num">01</span>
                <span className="landing-killer-tag">AI · Telegram</span>
              </div>
              <h3>Бот читает код и создаёт задачу.</h3>
              <p>
                Упомяните <code>@unit_duck_bot</code> в чате команды — он читает репозиторий через GitHub Contents API, собирает контекст, делает один LLM-вызов и предлагает драфт задачи с приоритетом и блоком «Источники» — прямыми ссылками на файлы. Нажимаете «Создать» — задача появляется в проекте.
              </p>
              <div className="landing-tg-demo">
                <div className="stitch-tg-msg user">
                  <div className="stitch-tg-avatar">Я</div>
                  <div className="stitch-tg-bubble">
                    <b>@unit_duck_bot</b> посмотри, как реализован rate-limit на signin, и заведи задачу, если что-то не так
                  </div>
                </div>
                <div className="stitch-tg-msg bot">
                  <div className="stitch-tg-avatar bot-avatar">🦆</div>
                  <div className="stitch-tg-bubble bot-bubble">
                    <div className="stitch-tg-task">
                      <span className="landing-prio high" />
                      <span className="stitch-tg-task-key">POPU-103</span>
                      <span className="stitch-tg-task-title">Ужесточить rate-limit на /signin до 5/мин</span>
                    </div>
                    <div className="stitch-tg-sources">
                      📁 <a>routes/auth.js</a> · <a>middleware/rateLimit.js</a>
                    </div>
                    <div className="landing-tg-actions">
                      <span className="landing-tg-btn">✓ Создать</span>
                      <span className="landing-tg-btn ghost">Изменить</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Killer 2: Client approve */}
            <article className="landing-killer">
              <div className="landing-killer-head">
                <span className="landing-killer-num">02</span>
                <span className="landing-killer-tag">Client Link</span>
              </div>
              <h3>Клиент апрувит релиз по ссылке.</h3>
              <p>
                Генерируете <code>/p/&lt;token&gt;</code> — клиент открывает публичную страницу с этапами и статусами. Нажимает Approve — этап уходит в <b>completed</b>, следующий автоматически становится <b>active</b>. Без звонков и писем.
              </p>
              <MockupSlot
                label="Публичная страница клиента — список этапов + кнопка Approve"
                ratio="16 / 10"
                tone="light"
              />
            </article>

            {/* Killer 3: GitHub auto-close */}
            <article className="landing-killer">
              <div className="landing-killer-head">
                <span className="landing-killer-num">03</span>
                <span className="landing-killer-tag">GitHub Sync</span>
              </div>
              <h3>Merge PR — задача уходит в done.</h3>
              <p>
                Привязываете репозиторий через GitHub App. В имени ветки или теле PR указываете <code>POPU-42</code> — webhook парсит ключ, закрывает задачу и переводит статус. Обработка асинхронная, полный лог — в панели webhook-событий проекта.
              </p>
              <div className="landing-killer-visual">
                <div className="landing-flow-step">
                  <span className="landing-flow-chip gh">git push feat/popu-87-login</span>
                </div>
                <div className="landing-flow-arrow">→</div>
                <div className="landing-flow-step">
                  <span className="landing-flow-chip pr">PR merged</span>
                </div>
                <div className="landing-flow-arrow">→</div>
                <div className="landing-flow-step">
                  <span className="landing-flow-chip done">POPU-87 · done ✓</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3. Как работает — flow на скринах ── */}
      <section className="stitch-how" id="how">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>От идеи до апрува — 4 шага</h2>
            <p>Никаких долгих онбордингов. Сетап проекта — 2 минуты.</p>
          </div>

          <div className="landing-how-grid">
            <article className="landing-how-step">
              <div className="landing-how-step-head">
                <span className="stitch-step-number">01</span>
                <h3>Создай проект</h3>
              </div>
              <p>
                Режим <b>stages</b> — для релизов с этапами (dev → staging → prod). Режим <b>flat</b> — если задачи плоским списком. Переключается при создании.
              </p>
              <MockupSlot label="Модалка создания проекта (имя + workflow_type)" ratio="4 / 3" />
            </article>

            <article className="landing-how-step">
              <div className="landing-how-step-head">
                <span className="stitch-step-number">02</span>
                <h3>Добавь задачи</h3>
              </div>
              <p>
                Вручную, через CLI <code>unit-labs task new</code>, из Cursor через MCP или попроси <b>AI-агента</b> разложить промпт на задачи — 5-10 штук за пару секунд.
              </p>
              <MockupSlot label="Список задач + запуск Agent run с промптом" ratio="4 / 3" />
            </article>

            <article className="landing-how-step">
              <div className="landing-how-step-head">
                <span className="stitch-step-number">03</span>
                <h3>Привяжи репозиторий</h3>
              </div>
              <p>
                Один клик — устанавливаешь GitHub App, выбираешь репо, включаешь <b>auto-close on merge</b>. Дальше merge → done происходит сам.
              </p>
              <MockupSlot label="Панель привязки репо + список webhook-событий" ratio="4 / 3" />
            </article>

            <article className="landing-how-step">
              <div className="landing-how-step-head">
                <span className="stitch-step-number">04</span>
                <h3>Отправь клиенту</h3>
              </div>
              <p>
                Сгенерируй <code>/p/&lt;token&gt;</code>, отправь в мессенджер. Клиент смотрит прогресс, ставит Approve — этап закрыт, следующий активен.
              </p>
              <MockupSlot label="Кнопка «Запросить ревью» + копирование клиент-ссылки" ratio="4 / 3" />
            </article>
          </div>
        </div>
      </section>

      {/* ── 4. Три аудитории — с конкретикой, а не D/L/C ── */}
      <section className="stitch-audience" id="audience">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Для кого</h2>
            <p>У каждой роли — своя точка входа и своя ценность.</p>
          </div>
          <div className="landing-audience-grid">
            <article className="landing-audience-card">
              <div className="landing-audience-role">Разработчик</div>
              <h3>Не выходи из терминала.</h3>
              <p>
                CLI и MCP-сервер. Команды <code>task new</code>, <code>task done</code>, <code>task ls --priority urgent</code>. В Cursor/Claude — подключаешь MCP и все эндпоинты становятся tools.
              </p>
              <ul className="landing-audience-list">
                <li>PAT-токены в /settings/tokens</li>
                <li>Issue keys автогенерятся (<code>POPU-42</code>)</li>
                <li>Merge PR закрывает задачу</li>
              </ul>
            </article>

            <article className="landing-audience-card">
              <div className="landing-audience-role">Тимлид</div>
              <h3>Вижу всё. Ничего не теряю.</h3>
              <p>
                Доска по статусам (backlog/todo/in progress/review/done). Фильтры по приоритету и направлению. Webhook-лог показывает какой merge закрыл какую задачу.
              </p>
              <ul className="landing-audience-list">
                <li>Board-вью с drag-n-drop</li>
                <li>Приоритеты: urgent → high → medium → low</li>
                <li>Запрос ревью — один клик</li>
              </ul>
            </article>

            <article className="landing-audience-card">
              <div className="landing-audience-role">Клиент</div>
              <h3>Один линк. Один клик.</h3>
              <p>
                Клиенту не нужен аккаунт. Даёшь ссылку <code>unit-labs.ru/p/&lt;token&gt;</code> — он видит этапы, статусы и задачи. Кликает Approve — этап завершён.
              </p>
              <ul className="landing-audience-list">
                <li>Публичный вью без регистрации</li>
                <li>Прогресс в реальном времени</li>
                <li>Апрув в один клик</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── 5. Интеграции ── */}
      <section className="stitch-integrations" id="integrations">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Работай откуда удобно</h2>
            <p>Четыре точки входа в одну и ту же модель данных.</p>
          </div>

          <div className="stitch-integrations-grid">
            {/* CLI */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>CLI</h3>
                <span className="stitch-integration-badge">npm</span>
              </div>
              <p>Управляй проектами и задачами из терминала. PAT или JWT — без разницы.</p>
              <pre className="stitch-integration-code">{`npm i -g @yokio42/unit-labs-cli
unit-labs auth login
unit-labs task new "фикс роутинга" --priority high
unit-labs task done POPU-42`}</pre>
              <a
                className="stitch-dev-doc-link"
                href="https://www.npmjs.com/package/@yokio42/unit-labs-cli?activeTab=readme"
                target="_blank"
                rel="noreferrer"
              >
                Документация CLI →
              </a>
            </article>

            {/* MCP */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>MCP Server</h3>
                <span className="stitch-integration-badge">npx</span>
              </div>
              <p>Подключи unit-labs к Claude, Cursor, или любому MCP-клиенту. Все эндпоинты — как tools.</p>
              <pre className="stitch-integration-code">{`{
  "unit-labs": {
    "command": "npx",
    "args": ["-y", "@yokio42/unit-labs-mcp"],
    "env": { "UNIT_LABS_TOKEN": "ul_..." }
  }
}`}</pre>
              <a
                className="stitch-dev-doc-link"
                href="https://www.npmjs.com/package/@yokio42/unit-labs-mcp"
                target="_blank"
                rel="noreferrer"
              >
                Документация MCP →
              </a>
            </article>

            {/* GitHub */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>GitHub App</h3>
                <span className="stitch-integration-badge">App</span>
              </div>
              <p>Привяжи репо — webhook'и приходят на <code>/webhooks/github</code>. Merge PR с issue-key в ветке = задача done.</p>
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
              <a
                className="stitch-dev-doc-link"
                href="https://github.com/apps/popuitkav2"
                target="_blank"
                rel="noreferrer"
              >
                Установить App →
              </a>
            </article>

            {/* Telegram */}
            <article className="stitch-integration-card">
              <div className="stitch-integration-head">
                <h3>Telegram Bot</h3>
                <span className="stitch-integration-badge stitch-integration-badge-live">@unit_duck_bot</span>
              </div>
              <p>
                Команды <code>/tasks</code>, <code>/mine</code>, <code>/task POPU-15</code>. Или просто упомяни бота — прочитает код и заведёт задачу.
              </p>
              <div className="stitch-tg-commands">
                <span className="stitch-tg-cmd">/tasks</span>
                <span className="stitch-tg-cmd">/mine</span>
                <span className="stitch-tg-cmd">/task POPU-15</span>
                <span className="stitch-tg-cmd">@unit_duck_bot &lt;промпт&gt;</span>
              </div>
              <MockupSlot label="Реальный скрин ТГ-чата с командой + меню бота" ratio="16 / 9" />
            </article>
          </div>
        </div>
      </section>

      {/* ── 6. Pricing hint ── */}
      <section className="landing-pricing" id="pricing">
        <div className="stitch-container landing-pricing-inner">
          <div className="landing-pricing-head">
            <h2>Цена</h2>
            <p>Сейчас — бесплатно. Сразу, без карты. Пиши фичи — добавим.</p>
          </div>
          <div className="landing-pricing-card">
            <div className="landing-pricing-big">$0</div>
            <ul className="landing-pricing-list">
              <li>Неограничено проектов и команд</li>
              <li>GitHub App, Telegram-бот, CLI, MCP</li>
              <li>AI-агент (Groq / Gemini / OpenAI)</li>
              <li>Публичные клиент-ссылки</li>
            </ul>
            <Link to="/signup" className="stitch-ghost-cta">Получить доступ</Link>
          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ── */}
      <section className="stitch-final-cta">
        <div className="stitch-container stitch-final-cta-inner">
          <h2>Настрой проект за 2 минуты</h2>
          <p>Создай аккаунт, привяжи репо, отправь линк клиенту. Первый апрув — через час.</p>
          <div className="stitch-final-cta-actions">
            <Link to="/signup" className="stitch-ghost-cta">Создать аккаунт</Link>
            <a
              href="https://www.npmjs.com/package/@yokio42/unit-labs-cli?activeTab=readme"
              target="_blank"
              rel="noreferrer"
              className="stitch-link-button"
            >
              Или начать из CLI
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="stitch-footer">
        <div className="stitch-container stitch-footer-row">
          <p>© {year} {APP_TITLE}</p>
          <div className="stitch-footer-links">
            <a href="#product">Продукт</a>
            <a href="#how">Как работает</a>
            <a href="#integrations">Интеграции</a>
            <a href="#pricing">Цена</a>
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
              GitHub App
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
