import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Chip } from '../components/ui/Chip';
import { TerminalBlock } from '../components/ui/TerminalBlock';
import { apiService } from '../lib/api/service';

export const LandingPage = () => {
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');

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
      title="Попутка v2"
      subtitle="Project delivery workspace: задачи, стадии, апрув клиента и прозрачный прогресс в одном интерфейсе."
    >
      <span className="badge">
        <span className="badge-dot" />
        {health === 'loading' ? 'checking backend' : health === 'online' ? 'backend online' : 'backend offline'}
      </span>

      <div className="landing-hero">
        <GlassPanel className="landing-main">
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
              <p className="stat-value">JWT + Reset Flow</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Core</p>
              <p className="stat-value">Projects / Stages / Tasks</p>
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
                '$ curl https://popuitka2-be.onrender.com/health',
                '"ok"',
              ]}
            />
            <a className="cta" href="https://popuitka2-be.onrender.com/health" target="_blank" rel="noreferrer">
              Проверить backend
            </a>
          </GlassPanel>
        </div>
      </div>

      <div className="landing-feature-grid">
        <GlassPanel className="feature-card">
          <h3 className="feature-title">Полный продуктовый цикл</h3>
          <p className="feature-description">
            От создания проекта и декомпозиции стадий до апрува со стороны клиента через публичную ссылку.
          </p>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Регистрация, вход и восстановление пароля по коду.</div>
            </li>
            <li>
              <span className="icon" />
              <div>CRUD для проектов, стадий и задач с live-обновлением.</div>
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel className="feature-card">
          <h3 className="feature-title">Прозрачный статус стадий</h3>
          <p className="feature-description">
            Статусы `active`, `waiting`, `review`, `completed` прямо в интерфейсе команды и клиента.
          </p>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Request review отправляет стадию на клиентскую проверку.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Approve переводит стадию в completed и фиксирует результат.</div>
            </li>
          </ul>
        </GlassPanel>

        <GlassPanel className="feature-card">
          <h3 className="feature-title">Скорость и контроль</h3>
          <p className="feature-description">
            Интерфейс оптимизирован под ежедневную работу: быстрые формы, компактные карточки и фокус на действиях.
          </p>
          <TerminalBlock
            lines={['$ npm run dev', '$ npm run test:run', '$ npm run build']}
          />
        </GlassPanel>
      </div>
    </PageShell>
  );
};
