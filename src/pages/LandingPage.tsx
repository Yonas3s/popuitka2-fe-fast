import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { BrandIcon } from '../components/ui/BrandIcon';
import { Chip } from '../components/ui/Chip';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { apiService } from '../lib/api/service';
import { API_BASE_URL } from '../lib/config/env';

export const LandingPage = () => {
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');
  const healthUrl = `${API_BASE_URL.replace(/\/+$/, '')}/health`;

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
    <PageShell
      title="unit-labs"
      subtitle="Project delivery workspace: задачи, стадии, апрув клиента и прозрачный прогресс в одном интерфейсе."
    >
      <span className="badge">
        <span className="badge-dot" />
        {health === 'loading' ? 'checking backend' : health === 'online' ? 'backend online' : 'backend offline'}
      </span>

      <div className="landing-hero">
        <GlassPanel className="landing-main">
          <div className="landing-brandline">
            <BrandIcon className="landing-brand-icon" />
            <span className="landing-brand-chip">unit-labs digital workspace</span>
          </div>
          <p className="landing-kicker">Client-first workflow</p>
          <h2 className="landing-headline">
            Управляйте релизом, а не хаосом.
            <span className="landing-highlight"> От бэклога до approve клиента.</span>
          </h2>
          <p className="landing-copy">
            JWT-авторизация, проекты, стадии, задачи и публичный клиентский кабинет. Бэкенд уже подключен, статусы
            стадий и ревью-flow работают из коробки.
          </p>

          <div className="actions-row">
            <Link className="cta" to="/signin">
              Открыть кабинет
            </Link>
            <Link className="ghost-link" to="/signup">
              Создать аккаунт
            </Link>
          </div>

          <div className="landing-stats">
            <article className="stat-card">
              <p className="stat-label">Auth</p>
              <p className="stat-value">JWT + GitHub OAuth</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Flow</p>
              <p className="stat-value">Stages + Tasks + Review</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Client</p>
              <p className="stat-value">Share Link + Approve</p>
            </article>
          </div>
        </GlassPanel>

        <div className="landing-stack">
          <GlassPanel>
            <h2>Состояние системы</h2>
            <p className={`landing-status-line health-${health}`}>
              <span className="status-orb" />
              {health === 'loading' ? 'Проверка health endpoint...' : health === 'online' ? 'Backend online' : 'Backend offline'}
            </p>
            <div className="chips">
              <Chip>React + TypeScript</Chip>
              <Chip>Zustand</Chip>
              <Chip>REST API</Chip>
              <Chip>Mongo + JWT</Chip>
            </div>
          </GlassPanel>

          <GlassPanel>
            <h2>Quick start</h2>
            <TerminalBlock
              lines={[
                '$ npm install',
                '$ npm run dev',
                `$ curl ${healthUrl}`,
                '"ok"',
              ]}
            />
            <a className="cta" href={healthUrl} target="_blank" rel="noreferrer">
              Проверить backend
            </a>
          </GlassPanel>
        </div>
      </div>

      <div className="landing-wide-grid">
        <GlassPanel className="landing-story-panel">
          <p className="landing-section-eyebrow">Что внутри</p>
          <h2>Один контур для всей delivery-команды</h2>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Проекты с последовательными стадиями и контролем статусов.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Задачи внутри каждой стадии без лишней бюрократии.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Публичный клиентский апрув в один понятный шаг.</div>
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel className="landing-story-panel">
          <p className="landing-section-eyebrow">Кому подходит</p>
          <h2>Для команд, которым важна прозрачность</h2>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Студии и агентства, работающие с внешним заказчиком.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Продуктовые команды с staged delivery и review-процессом.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Небольшие команды, где нужен единый рабочий ритм.</div>
            </li>
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel className="landing-flow-panel">
        <p className="landing-section-eyebrow">Как это работает</p>
        <h2>Путь проекта от идеи до client approve</h2>
        <div className="landing-flow-grid">
          <article className="landing-flow-step">
            <span className="flow-step-index">01</span>
            <h3>Создаешь проект</h3>
            <p className="feature-description">Фиксируешь scope и стартуешь структуру этапов.</p>
          </article>
          <article className="landing-flow-step">
            <span className="flow-step-index">02</span>
            <h3>Декомпозируешь стадии</h3>
            <p className="feature-description">Разбиваешь работу на контролируемые блоки.</p>
          </article>
          <article className="landing-flow-step">
            <span className="flow-step-index">03</span>
            <h3>Ведешь задачи</h3>
            <p className="feature-description">Команда отмечает прогресс и держит контекст в системе.</p>
          </article>
          <article className="landing-flow-step">
            <span className="flow-step-index">04</span>
            <h3>Отправляешь на review</h3>
            <p className="feature-description">Клиент получает стадию и принимает решение в один клик.</p>
          </article>
        </div>
      </GlassPanel>

      <GlassPanel className="landing-cta-panel">
        <p className="landing-section-eyebrow">Старт</p>
        <h2>Запусти первый проект в unit-labs</h2>
        <p className="feature-description">
          Регистрируй аккаунт, создавай команду и веди проект от бэклога до согласованной поставки в одном интерфейсе.
        </p>
        <div className="actions-row">
          <Link className="cta" to="/signup">
            Создать аккаунт
          </Link>
          <Link className="ghost-link" to="/signin">
            Войти в кабинет
          </Link>
        </div>
      </GlassPanel>
    </PageShell>
  );
};
