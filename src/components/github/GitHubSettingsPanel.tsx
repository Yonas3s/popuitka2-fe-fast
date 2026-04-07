import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api/service';
import { normalizeApiError } from '../../lib/api/errors';
import type { GitHubInstallation } from '../../types/models';

const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/popuitkav2/installations/new';

export const GitHubSettingsPanel = () => {
  const [installations, setInstallations] = useState<GitHubInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    apiService
      .getGitHubInstallations()
      .then((data) => {
        if (!cancelled) {
          setInstallations(data);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(normalizeApiError(reason).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="gh-settings-panel">
      <div className="gh-settings-head">
        <div>
          <h2>GitHub интеграция</h2>
          <p>Подключите GitHub App для автоматической привязки репозиториев и webhook-событий.</p>
        </div>
        <a
          href={GITHUB_APP_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="ui-btn ui-btn-primary"
        >
          Установить GitHub App
        </a>
      </div>

      {error ? <p className="gh-settings-error">{error}</p> : null}
      {loading ? <p className="gh-settings-loading">Загрузка установок...</p> : null}

      {!loading && installations.length === 0 && !error ? (
        <div className="gh-settings-empty">
          <p>Нет установленных GitHub App. Нажмите кнопку выше, чтобы установить.</p>
        </div>
      ) : null}

      {installations.length > 0 ? (
        <div className="gh-installations-list">
          {installations.map((inst) => (
            <article key={inst.id} className="gh-installation-card">
              <div className="gh-installation-info">
                <strong>{inst.accountLogin || 'Аккаунт'}</strong>
                <span>{inst.accountType}</span>
              </div>
              <span className="gh-installation-status">Подключено</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};
