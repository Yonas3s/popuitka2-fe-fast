import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeApiError } from '../lib/api/errors';
import { apiService } from '../lib/api/service';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { useUiStore } from '../store/ui.store';
import type { ApiError, ApiToken, CreatedApiToken } from '../types/models';

const toDateLabel = (value?: string, fallback = '—'): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const toStatusMeta = (token: ApiToken): { label: string; className: string } => {
  if (token.revokedAt) {
    return { label: 'Отозван', className: 'is-revoked' };
  }

  if (token.expiresAt) {
    const expiresAt = new Date(token.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      return { label: 'Истек', className: 'is-expired' };
    }
  }

  return { label: 'Активен', className: 'is-active' };
};

export const SettingsPage = () => {
  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [expiresAtDraft, setExpiresAtDraft] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<CreatedApiToken | null>(null);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getApiTokens();
      setTokens(response);
    } catch (reason) {
      setError(normalizeApiError(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    if (!createOpen && !createdToken) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (createdToken) {
        setCreatedToken(null);
        return;
      }

      setCreateOpen(false);
    };

    window.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEscape);
    };
  }, [createOpen, createdToken]);

  const emptyLabel = useMemo(() => {
    if (loading) {
      return 'Загружаем токены...';
    }
    return 'Токенов пока нет';
  }, [loading]);

  const onCreateToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = nameDraft.trim();
    if (!name) {
      pushToast('Укажите название токена', 'info');
      return;
    }

    let expiresAtIso: string | undefined;
    if (expiresAtDraft) {
      const parsed = new Date(expiresAtDraft);
      if (Number.isNaN(parsed.getTime())) {
        pushToast('Невалидная дата истечения', 'error');
        return;
      }
      expiresAtIso = parsed.toISOString();
    }

    setCreateLoading(true);
    try {
      const created = await apiService.createApiToken({
        name,
        ...(expiresAtIso ? { expires_at: expiresAtIso } : {}),
      });
      setCreateOpen(false);
      setNameDraft('');
      setExpiresAtDraft('');
      setCreatedToken(created);
      pushToast('Токен создан. Скопируй его сейчас, позже он не покажется.', 'success');
      await loadTokens();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const revokeToken = async (token: ApiToken) => {
    setRevokingId(token.id);
    try {
      await apiService.revokeApiToken(token.id);
      pushToast('Токен отозван', 'success');
      await loadTokens();
    } catch (reason) {
      const normalized = normalizeApiError(reason);
      pushToast(normalized.message, 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const onRequestRevoke = (token: ApiToken) => {
    if (token.revokedAt) {
      return;
    }

    openConfirm({
      title: `Отозвать токен «${token.name}»?`,
      description: 'После отзыва токен перестанет работать и восстановить его нельзя.',
      onConfirm: () => {
        void revokeToken(token);
      },
    });
  };

  const onCopyCreatedToken = async () => {
    if (!createdToken?.token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdToken.token);
      pushToast('Токен скопирован', 'success');
    } catch {
      pushToast('Не удалось скопировать токен', 'error');
    }
  };

  return (
    <div className="settings-v1-page">
      <WorkspaceHeader activeTab="settings" />

      <main className="projects-v3-main settings-v1-main">
        <div className="projects-v3-grid-bg" />
        <span className="projects-v3-marker projects-v3-marker-top-left" />
        <span className="projects-v3-marker projects-v3-marker-top-right" />
        <span className="projects-v3-marker projects-v3-marker-bottom-left" />
        <span className="projects-v3-marker projects-v3-marker-bottom-right" />

        <div className="projects-v3-container settings-v1-content">
          <div className="settings-v1-toolbar">
            <div>
              <h1>API токены</h1>
              <p>Создавай персональные токены для интеграций. Токен в открытом виде показывается только один раз.</p>
            </div>

            <button
              type="button"
              className="settings-v1-create-btn"
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              Создать токен
            </button>
          </div>

          {error ? <p className="settings-v1-error">{error.message}</p> : null}

          {!loading && !error && tokens.length === 0 ? (
            <section className="settings-v1-empty">
              <h2>{emptyLabel}</h2>
              <p>Создай первый API токен для внешних интеграций и автоматизаций.</p>
            </section>
          ) : null}

          {loading ? <p className="settings-v1-loading">{emptyLabel}</p> : null}

          {!loading && tokens.length > 0 ? (
            <section className="settings-v1-list">
              {tokens.map((token) => {
                const status = toStatusMeta(token);
                return (
                  <article key={token.id} className="settings-v1-token-card">
                    <div className="settings-v1-token-head">
                      <div>
                        <h2>{token.name}</h2>
                        <p>{token.tokenPrefix || 'Без префикса'}</p>
                      </div>
                      <span className={`settings-v1-token-status ${status.className}`}>{status.label}</span>
                    </div>

                    <div className="settings-v1-token-grid">
                      <div>
                        <span>Создан</span>
                        <strong>{toDateLabel(token.createdAt)}</strong>
                      </div>
                      <div>
                        <span>Последнее использование</span>
                        <strong>{toDateLabel(token.lastUsedAt, 'Не использовался')}</strong>
                      </div>
                      <div>
                        <span>Истекает</span>
                        <strong>{toDateLabel(token.expiresAt, 'Без срока')}</strong>
                      </div>
                    </div>

                    <div className="settings-v1-token-actions">
                      <button
                        type="button"
                        onClick={() => {
                          onRequestRevoke(token);
                        }}
                        disabled={Boolean(token.revokedAt) || revokingId === token.id}
                      >
                        {token.revokedAt ? 'Отозван' : revokingId === token.id ? 'Отзываем...' : 'Отозвать'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}
        </div>
      </main>

      {createOpen ? (
        <div
          className="projects-v3-modal-backdrop"
          role="presentation"
          onClick={() => {
            setCreateOpen(false);
          }}
        >
          <section
            className="projects-v3-modal settings-v1-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-api-token-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="projects-v3-modal-head">
              <h2 id="create-api-token-title">Создать API токен</h2>
              <button
                type="button"
                className="projects-v3-modal-close"
                aria-label="Закрыть форму создания токена"
                onClick={() => {
                  setCreateOpen(false);
                }}
              >
                ✕
              </button>
            </header>

            <section className="projects-v3-create">
              <form className="projects-v3-form settings-v1-form" onSubmit={(event) => void onCreateToken(event)}>
                <div className="projects-v3-field">
                  <label htmlFor="token-name">Название токена</label>
                  <input
                    id="token-name"
                    value={nameDraft}
                    onChange={(event) => {
                      setNameDraft(event.target.value);
                    }}
                    placeholder="CI Deploy Token"
                    autoFocus
                  />
                </div>

                <div className="projects-v3-field">
                  <label htmlFor="token-expires-at">Истекает (опционально)</label>
                  <input
                    id="token-expires-at"
                    type="datetime-local"
                    value={expiresAtDraft}
                    onChange={(event) => {
                      setExpiresAtDraft(event.target.value);
                    }}
                  />
                </div>

                <div className="projects-v3-form-actions">
                  <button
                    type="button"
                    className="projects-v3-cancel-btn"
                    onClick={() => {
                      setCreateOpen(false);
                    }}
                    disabled={createLoading}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="projects-v3-submit-btn" disabled={createLoading}>
                    {createLoading ? 'Создаем...' : 'Создать токен'}
                  </button>
                </div>
              </form>
            </section>
          </section>
        </div>
      ) : null}

      {createdToken ? (
        <div
          className="projects-v3-modal-backdrop"
          role="presentation"
          onClick={() => {
            setCreatedToken(null);
          }}
        >
          <section
            className="projects-v3-modal settings-v1-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="created-token-title"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="projects-v3-modal-head">
              <h2 id="created-token-title">Скопируй токен сейчас</h2>
              <button
                type="button"
                className="projects-v3-modal-close"
                aria-label="Закрыть окно токена"
                onClick={() => {
                  setCreatedToken(null);
                }}
              >
                ✕
              </button>
            </header>

            <section className="projects-v3-create">
              <p className="settings-v1-token-warning">
                Этот токен показывается один раз. После закрытия посмотреть его снова нельзя.
              </p>
              <pre className="settings-v1-token-value">{createdToken.token || 'Токен не получен'}</pre>
              <div className="projects-v3-form-actions">
                <button
                  type="button"
                  className="projects-v3-cancel-btn"
                  onClick={() => {
                    setCreatedToken(null);
                  }}
                >
                  Закрыть
                </button>
                <button type="button" className="projects-v3-submit-btn" onClick={() => void onCopyCreatedToken()}>
                  Copy
                </button>
              </div>
            </section>
          </section>
        </div>
      ) : null}
    </div>
  );
};
