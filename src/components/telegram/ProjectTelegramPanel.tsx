import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../../lib/api/service';
import { normalizeApiError } from '../../lib/api/errors';
import { useUiStore } from '../../store/ui.store';
import type { TelegramBinding } from '../../types/models';

type ProjectTelegramPanelProps = {
  projectId: string;
};

type BindToken = {
  token: string;
  command: string;
  botUsername: string;
  expiresAt: string;
  instructions: string[];
};

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const ProjectTelegramPanel = ({ projectId }: ProjectTelegramPanelProps) => {
  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [bindings, setBindings] = useState<TelegramBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingToken, setCreatingToken] = useState(false);
  const [token, setToken] = useState<BindToken | null>(null);
  const [now, setNow] = useState(Date.now());

  const pollRef = useRef<number | null>(null);
  const prevCountRef = useRef(0);

  const loadBindings = useCallback(async () => {
    try {
      const data = await apiService.getProjectTelegramBindings(projectId);
      setBindings(data);
      return data;
    } catch {
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadBindings();
      prevCountRef.current = data.length;
      setLoading(false);
    })();
  }, [loadBindings]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = window.setInterval(async () => {
      const data = await loadBindings();
      if (data.length > prevCountRef.current) {
        prevCountRef.current = data.length;
        pushToast('Чат привязан', 'success');
        setToken(null);
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [token, loadBindings, pushToast]);

  const onCreateToken = async () => {
    setCreatingToken(true);
    try {
      const data = await apiService.createProjectTelegramBindToken(projectId);
      setToken(data);
      setNow(Date.now());
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setCreatingToken(false);
    }
  };

  const onCopy = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      pushToast(`${label} скопировано`, 'success');
    } catch {
      pushToast('Не удалось скопировать', 'error');
    }
  };

  const onUnbind = (binding: TelegramBinding) => {
    openConfirm({
      title: `Отвязать «${binding.chatTitle}»?`,
      description: 'Чат перестанет получать уведомления по этому проекту.',
      onConfirm: async () => {
        try {
          await apiService.unbindProjectTelegram(projectId, binding.id);
          pushToast('Чат отвязан', 'success');
          const data = await loadBindings();
          prevCountRef.current = data.length;
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        }
      },
    });
  };

  const expiresMs = token ? new Date(token.expiresAt).getTime() - now : 0;
  const countdown = formatCountdown(expiresMs);
  const expired = token && expiresMs <= 0;

  return (
    <section className="tg-project-panel">
      <div className="tg-project-head">
        <div>
          <h2>Telegram</h2>
          <p>Подключите групповые чаты для уведомлений о проекте.</p>
        </div>
        <button
          type="button"
          className="ui-btn ui-btn-primary ui-btn-sm"
          onClick={() => void onCreateToken()}
          disabled={creatingToken}
        >
          <span className="ui-btn-icon" aria-hidden="true">+</span>
          Привязать чат
        </button>
      </div>

      {loading ? <p className="tg-loading">Загрузка...</p> : null}

      {!loading && bindings.length === 0 ? (
        <p className="tg-empty">
          Нет подключённых чатов. Нажмите «Привязать чат» и следуйте инструкции.
        </p>
      ) : null}

      {bindings.length > 0 ? (
        <div className="tg-bindings-list">
          {bindings.map((b) => (
            <article key={b.id} className="tg-binding-card">
              <div className="tg-binding-info">
                <strong>{b.chatTitle}</strong>
                {b.createdAt ? <span>{new Date(b.createdAt).toLocaleDateString('ru-RU')}</span> : null}
              </div>
              <button
                type="button"
                className="ui-btn ui-btn-ghost ui-btn-sm"
                onClick={() => onUnbind(b)}
              >
                Отвязать
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {token ? (
        <div className="tg-modal-backdrop" role="presentation" onClick={() => setToken(null)}>
          <div
            className="tg-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tg-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="tg-modal-head">
              <h3 id="tg-modal-title">Привязать Telegram чат</h3>
              <button
                type="button"
                className="tg-modal-close"
                aria-label="Закрыть"
                onClick={() => setToken(null)}
              >
                ×
              </button>
            </header>

            <ol className="tg-steps">
              <li>
                <span className="tg-step-num">1</span>
                <div className="tg-step-body">
                  <p>Добавьте бота в групповой чат Telegram:</p>
                  <button
                    type="button"
                    className="tg-copy-btn"
                    onClick={() => void onCopy(`@${token.botUsername}`, 'Имя бота')}
                    title="Скопировать"
                  >
                    @{token.botUsername}
                    <span className="tg-copy-icon" aria-hidden="true">⧉</span>
                  </button>
                </div>
              </li>
              <li>
                <span className="tg-step-num">2</span>
                <div className="tg-step-body">
                  <p>В этом чате отправьте команду:</p>
                  <button
                    type="button"
                    className="tg-copy-btn tg-copy-cmd"
                    onClick={() => void onCopy(token.command, 'Команда')}
                    title="Скопировать"
                  >
                    <code>{token.command}</code>
                    <span className="tg-copy-icon" aria-hidden="true">⧉</span>
                  </button>
                </div>
              </li>
            </ol>

            <div className={`tg-countdown ${expired ? 'expired' : ''}`}>
              {expired ? (
                <>
                  Токен истёк.{' '}
                  <button type="button" className="tg-link-btn" onClick={() => void onCreateToken()}>
                    Создать новый
                  </button>
                </>
              ) : (
                <>Токен действует ещё {countdown}. Ждём подтверждения...</>
              )}
            </div>

            <div className="tg-modal-actions">
              <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => setToken(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
