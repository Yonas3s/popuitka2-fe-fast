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
      title="popuitka2 — фронт для управления проектами"
      subtitle="JWT-авторизация, проекты, стадии, задачи, клиентский апрув. Всё подключено к боевому бекенду."
    >
      <span className="badge">
        <span className="badge-dot" />
        {health === 'loading' ? 'checking backend' : health === 'online' ? 'backend online' : 'backend offline'}
      </span>

      <div className="hero" style={{ marginTop: 24 }}>
        <GlassPanel>
          <h2>Что доступно во фронте</h2>
          <ul className="list">
            <li>
              <span className="icon" />
              <div>Регистрация, вход и восстановление пароля.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Проекты, стадии и задачи с полным CRUD.</div>
            </li>
            <li>
              <span className="icon" />
              <div>Публичный клиентский просмотр и approve.</div>
            </li>
          </ul>

          <div className="chips" style={{ marginTop: 18 }}>
            <Chip>React + TypeScript</Chip>
            <Chip>Zustand</Chip>
            <Chip>REST API</Chip>
            <Chip>Render Production</Chip>
          </div>

          <div className="actions-row">
            <Link className="cta" to="/signin">
              Перейти ко входу
            </Link>
            <Link className="ghost-link" to="/signup">
              Создать аккаунт
            </Link>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2>Быстрый старт</h2>
          <TerminalBlock
            lines={[
              '$ npm install',
              '$ npm run dev',
              '$ curl https://popuitka2-be.onrender.com/health',
              '"ok"',
            ]}
          />

          <a className="cta" href="https://popuitka2-be.onrender.com/health" target="_blank" rel="noreferrer">
            Проверить health
          </a>
        </GlassPanel>
      </div>
    </PageShell>
  );
};
