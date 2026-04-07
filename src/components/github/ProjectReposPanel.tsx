import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../lib/api/service';
import { normalizeApiError } from '../../lib/api/errors';
import { useUiStore } from '../../store/ui.store';
import type { BoundRepository, GitHubInstallation, GitHubRepo } from '../../types/models';

type ProjectReposPanelProps = {
  projectId: string;
};

export const ProjectReposPanel = ({ projectId }: ProjectReposPanelProps) => {
  const pushToast = useUiStore((state) => state.pushToast);
  const openConfirm = useUiStore((state) => state.openConfirm);

  const [boundRepos, setBoundRepos] = useState<BoundRepository[]>([]);
  const [boundLoading, setBoundLoading] = useState(true);

  const [installations, setInstallations] = useState<GitHubInstallation[]>([]);
  const [installationsLoading, setInstallationsLoading] = useState(false);

  const [selectedInstallation, setSelectedInstallation] = useState('');
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  const [bindOpen, setBindOpen] = useState(false);

  const loadBoundRepos = useCallback(async () => {
    setBoundLoading(true);
    try {
      const repos = await apiService.getProjectRepositories(projectId);
      setBoundRepos(repos);
    } catch {
      // silent
    } finally {
      setBoundLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadBoundRepos();
  }, [loadBoundRepos]);

  const onOpenBind = async () => {
    setBindOpen(true);
    if (installations.length > 0) {
      return;
    }

    setInstallationsLoading(true);
    try {
      const data = await apiService.getGitHubInstallations();
      setInstallations(data);
      if (data.length === 1) {
        setSelectedInstallation(data[0].id);
      }
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    } finally {
      setInstallationsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedInstallation) {
      setAvailableRepos([]);
      return;
    }

    let cancelled = false;
    setReposLoading(true);
    apiService
      .getInstallationRepos(selectedInstallation)
      .then((repos) => {
        if (!cancelled) {
          const boundExternalIds = new Set(boundRepos.map((r) => r.repositoryExternalId));
          setAvailableRepos(repos.filter((r) => !boundExternalIds.has(r.id)));
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          pushToast(normalizeApiError(reason).message, 'error');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReposLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedInstallation, boundRepos, pushToast]);

  const onBindRepo = async (repo: GitHubRepo) => {
    try {
      await apiService.bindRepository(projectId, {
        repository_external_id: repo.id,
        installation_id: selectedInstallation,
        auto_close_on_merge: true,
      });
      pushToast(`${repo.fullName} привязан`, 'success');
      await loadBoundRepos();
    } catch (reason) {
      pushToast(normalizeApiError(reason).message, 'error');
    }
  };

  const onUnbind = (repo: BoundRepository) => {
    openConfirm({
      title: `Отвязать ${repo.fullName}?`,
      description: 'Репозиторий будет отвязан от проекта. Webhook-события перестанут поступать.',
      onConfirm: async () => {
        try {
          await apiService.unbindRepository(projectId, repo.id);
          pushToast('Репозиторий отвязан', 'success');
          await loadBoundRepos();
        } catch (reason) {
          pushToast(normalizeApiError(reason).message, 'error');
        }
      },
    });
  };

  return (
    <section className="gh-repos-panel">
      <div className="gh-repos-head">
        <h2>Репозитории</h2>
        <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => void onOpenBind()}>
          <span className="ui-btn-icon" aria-hidden="true">+</span>
          Привязать
        </button>
      </div>

      {boundLoading ? <p className="gh-repos-loading">Загрузка репозиториев...</p> : null}

      {!boundLoading && boundRepos.length === 0 ? (
        <p className="gh-repos-empty">
          Нет привязанных репозиториев. Привяжите репозиторий, чтобы отслеживать события.
        </p>
      ) : null}

      {boundRepos.length > 0 ? (
        <div className="gh-bound-list">
          {boundRepos.map((repo) => (
            <article key={repo.id} className="gh-bound-card">
              <div className="gh-bound-info">
                <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="gh-bound-name">
                  {repo.fullName}
                </a>
                <span className="gh-bound-meta">
                  auto-close: {repo.autoCloseOnMerge ? 'вкл' : 'выкл'}
                </span>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn-ghost ui-btn-sm"
                onClick={() => onUnbind(repo)}
              >
                Отвязать
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {bindOpen ? (
        <div className="gh-bind-section">
          <h3>Привязать репозиторий</h3>

          {installationsLoading ? <p className="gh-repos-loading">Загрузка установок...</p> : null}

          {!installationsLoading && installations.length === 0 ? (
            <p className="gh-repos-empty">
              Нет GitHub App установок.{' '}
              <a href="https://github.com/apps/popuitkav2/installations/new" target="_blank" rel="noreferrer">
                Установить GitHub App
              </a>
            </p>
          ) : null}

          {installations.length > 1 ? (
            <div className="gh-bind-field">
              <label>Установка GitHub App</label>
              <select
                value={selectedInstallation}
                onChange={(e) => setSelectedInstallation(e.target.value)}
              >
                <option value="">Выберите установку</option>
                {installations.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.accountLogin} ({inst.accountType})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {reposLoading ? <p className="gh-repos-loading">Загрузка репозиториев...</p> : null}

          {!reposLoading && selectedInstallation && availableRepos.length === 0 ? (
            <p className="gh-repos-empty">Нет доступных репозиториев для привязки.</p>
          ) : null}

          {availableRepos.length > 0 ? (
            <div className="gh-available-list">
              {availableRepos.map((repo) => (
                <article key={repo.id} className="gh-available-card">
                  <div className="gh-available-info">
                    <strong>{repo.fullName}</strong>
                    {repo.isPrivate ? <span className="gh-private-badge">private</span> : null}
                  </div>
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary ui-btn-sm"
                    onClick={() => void onBindRepo(repo)}
                  >
                    Привязать
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            className="ui-btn ui-btn-secondary ui-btn-sm"
            onClick={() => setBindOpen(false)}
          >
            Закрыть
          </button>
        </div>
      ) : null}
    </section>
  );
};
