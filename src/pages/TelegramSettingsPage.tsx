import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../lib/api/service';
import { normalizeApiError } from '../lib/api/errors';
import { useUiStore } from '../store/ui.store';
import { SettingsLayout } from '../components/layout/SettingsLayout';

type LinkInfo = {
  linked: boolean;
  telegramUsername: string | null;
};

type ConnectLink = {
  token: string;
  deepLink: string;
  expiresAt: string;
};

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const TelegramSettingsPage = () => {
  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [link, setLink] = useState<ConnectLink | null>(null);
  const [now, setNow] = useState(Date.now());

  const pollRef = useRef<number | null>(null);

  const loadInfo = useCallback(async () => {
    try {
      const data = await apiService.getMeTelegram();
      setInfo({ linked: data.linked, telegramUsername: data.telegramUsername });
      return data;
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
      return null;
    }
  }, [pushToast]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadInfo();
      setLoading(false);
    })();
  }, [loadInfo]);

  // Countdown tick
  useEffect(() => {
    if (!link) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [link]);

  // Polling while waiting for linking
  useEffect(() => {
    if (!link || info?.linked) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = window.setInterval(async () => {
      const data = await loadInfo();
      if (data?.linked) {
        setLink(null);
        pushToast('Telegram привязан', 'success');
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [link, info?.linked, loadInfo, pushToast]);

  const onConnect = async () => {
    setConnecting(true);
    try {
      const data = await apiService.createMeTelegramConnectLink();
      setLink(data);
      setNow(Date.now());
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const onDisconnect = () => {
    openConfirm({
      title: 'Отключить Telegram?',
      description: 'Бот перестанет слать тебе личные уведомления.',
      onConfirm: async () => {
        try {
          await apiService.disconnectMeTelegram();
          pushToast('Telegram отключён', 'success');
          await loadInfo();
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        }
      },
    });
  };

  const onCopyLink = async () => {
    if (!link?.deepLink) return;
    try {
      await navigator.clipboard.writeText(link.deepLink);
      pushToast('Ссылка скопирована', 'success');
    } catch {
      pushToast('Не удалось скопировать', 'error');
    }
  };

  const expiresMs = link ? new Date(link.expiresAt).getTime() - now : 0;
  const countdown = formatCountdown(expiresMs);
  const expired = link && expiresMs <= 0;

  return (
    <SettingsLayout>
      <div className="settings-v1-toolbar">
        <div>
          <h1>Telegram</h1>
          <p>Привяжи Telegram к аккаунту, чтобы получать личные уведомления.</p>
        </div>
      </div>

      {loading ? (
        <p className="settings-v1-loading">Загрузка...</p>
      ) : null}

          {!loading && info?.linked ? (
            <section className="tg-card">
              <div className="tg-card-head">
                <div className="tg-card-status tg-linked">
                  <span className="tg-dot" />
                  Подключено
                </div>
              </div>
              <div className="tg-linked-info">
                <p className="tg-linked-label">Telegram аккаунт</p>
                <a
                  className="tg-linked-username"
                  href={info.telegramUsername ? `https://t.me/${info.telegramUsername}` : '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{info.telegramUsername || 'unknown'}
                </a>
              </div>
              <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={onDisconnect}>
                Отключить Telegram
              </button>
            </section>
          ) : null}

          {!loading && !info?.linked && !link ? (
            <section className="tg-card">
              <div className="tg-card-head">
                <div className="tg-card-status">
                  <span className="tg-dot tg-dot-off" />
                  Не подключено
                </div>
              </div>
              <p className="tg-card-text">
                Привяжи Telegram, чтобы получать уведомления о новых задачах, ревью и релизах в личку.
              </p>
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={() => void onConnect()}
                disabled={connecting}
              >
                {connecting ? 'Создаём ссылку...' : 'Connect Telegram'}
              </button>
            </section>
          ) : null}

          {link && !info?.linked ? (
            <section className="tg-card tg-card-connect">
              <h2>Завершите привязку</h2>
              <p className="tg-card-text">Нажмите кнопку ниже — откроется Telegram с готовой командой для бота.</p>

              <div className="tg-actions">
                <a
                  href={link.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-btn ui-btn-primary"
                >
                  Открыть в Telegram
                </a>
                <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => void onCopyLink()}>
                  Копировать ссылку
                </button>
              </div>

              <div className="tg-secure-link-card" role="note">
                <span className="tg-secure-link-icon" aria-hidden="true">
                  ↗
                </span>
                <div>
                  <strong>Секретная ссылка не уходит в QR-сервисы</strong>
                  <p>Откройте Telegram на этом устройстве или скопируйте ссылку на телефон.</p>
                </div>
              </div>

              <div className={`tg-countdown ${expired ? 'expired' : ''}`}>
                {expired ? (
                  <>
                    Ссылка истекла.{' '}
                    <button type="button" className="tg-link-btn" onClick={() => void onConnect()}>
                      Создать новую
                    </button>
                  </>
                ) : (
                  <>Ссылка действует ещё {countdown}. Ждём подтверждения от Telegram...</>
                )}
              </div>

              <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => setLink(null)}>
                Отмена
              </button>
            </section>
          ) : null}
    </SettingsLayout>
  );
};
