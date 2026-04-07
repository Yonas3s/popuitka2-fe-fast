import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../lib/api/service';

export const GitHubCallbackInstallPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action') || 'install';

    if (!installationId) {
      setStatus('error');
      setErrorMessage('installation_id не найден в параметрах.');
      return;
    }

    let cancelled = false;

    apiService
      .handleGitHubInstallCallback(installationId, setupAction)
      .then(() => {
        if (!cancelled) {
          setStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('success');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="github-callback-page">
      <div className="github-callback-card">
        {status === 'processing' ? (
          <>
            <h1>Подключение GitHub App...</h1>
            <p>Обрабатываем установку, подождите.</p>
          </>
        ) : null}

        {status === 'success' ? (
          <>
            <h1>GitHub App подключен</h1>
            <p>Установка завершена. Теперь вы можете привязывать репозитории к проектам.</p>
            <div className="github-callback-actions">
              <Link to="/settings" className="ui-btn ui-btn-primary">
                Перейти в настройки
              </Link>
              <Link to="/projects" className="ui-btn ui-btn-secondary">
                К проектам
              </Link>
            </div>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <h1>Ошибка подключения</h1>
            <p>{errorMessage}</p>
            <div className="github-callback-actions">
              <Link to="/settings" className="ui-btn ui-btn-primary">
                Вернуться в настройки
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
