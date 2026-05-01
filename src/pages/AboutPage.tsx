import { Link } from 'react-router-dom';
import { APP_DISPLAY_YEAR, APP_TITLE } from '../lib/config/env';
import { UnifiedHeader } from '../components/layout/UnifiedHeader';
import { SEO } from '../components/seo/SEO';
import { SupportMailLink } from '../components/support/SupportMailLink';
import { useAuthStore } from '../store/auth.store';

export const AboutPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="about-page">
      <SEO
        title="О нас"
        description="Unit-labs — инструмент релиз-менеджмента для dev-команд. Задачи, направления, GitHub и Telegram в одной связке."
      />

      <UnifiedHeader
        as="nav"
        className="stitch-nav"
        containerClassName="stitch-container stitch-nav-row"
        brandClassName="stitch-brand"
        brandContent={
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            unit-labs<em>_</em>
          </Link>
        }
        rightClassName="stitch-nav-actions"
        rightContent={
          isAuthenticated ? (
            <Link to="/projects" className="stitch-solid-button">К проектам</Link>
          ) : (
            <>
              <Link to="/signin" className="stitch-link-button">Войти</Link>
              <Link to="/signup" className="stitch-solid-button">Начать</Link>
            </>
          )
        }
      />

      <main className="about-main">
        <section className="stitch-container about-hero">
          <p className="about-kicker">О проекте</p>
          <h1 className="about-title">Unit-labs — релиз-менеджмент для dev-команд</h1>
          <p className="about-lead">
            Мы делаем инструмент, который собирает задачи, PR-ы, клиентские согласования и Telegram-чаты
            в один контур. Без перегруза, без плагинов, без чек-листов из прошлого века.
          </p>
        </section>

        <section className="stitch-container about-blocks">
          <article className="about-block">
            <h2>Зачем</h2>
            <p>
              Релиз в небольшой команде — это 10 чатов, Notion, Jira, 3 репозитория и один
              PM, который сводит всё это в голове. Unit-labs делает эту связку одним местом:
              задача живёт рядом с PR-ом, клиент видит прогресс, тимлид запускает релиз одной
              кнопкой.
            </p>
          </article>

          <article className="about-block">
            <h2>Как устроено</h2>
            <p>
              Проекты группируют задачи. Задачи классифицируются по типу (bug / feature /
              improvement / chore) и направлению (Backend, Frontend, Infra и т.д. —
              настраивается под команду). Плюс интеграции: GitHub App для PR-ов и вебхуков,
              Telegram-бот для уведомлений и привязки чатов.
            </p>
          </article>

          <article className="about-block">
            <h2>Философия</h2>
            <p>
              Один экран — одна задача. Если фича требует 3 кликов там, где хватит одного, —
              значит её нет. Мы не строим CRM из тула для разработчиков.
            </p>
          </article>
        </section>

        <section className="stitch-container about-contact">
          <h2>Связаться</h2>
          <p className="about-lead">
            Нашли баг, хотите интеграцию, идею или просто поздороваться — напишите.
          </p>
          <div className="about-contact-links">
            <SupportMailLink className="ui-btn ui-btn-secondary">info@unit-labs.ru</SupportMailLink>
            <a
              href="https://t.me/yokio42"
              target="_blank"
              rel="noreferrer"
              className="ui-btn ui-btn-secondary"
            >
              Telegram: @yokio42
            </a>
            <a
              href="https://github.com/Yonas3s"
              target="_blank"
              rel="noreferrer"
              className="ui-btn ui-btn-secondary"
            >
              GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="stitch-footer">
        <div className="stitch-container stitch-footer-row">
          <p>© {APP_DISPLAY_YEAR} {APP_TITLE}</p>
          <div className="stitch-footer-links">
            <Link to="/">Главная</Link>
            <Link to="/about">О нас</Link>
            <SupportMailLink>Помощь</SupportMailLink>
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
