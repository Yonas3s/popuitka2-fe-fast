import { SettingsLayout } from '../components/layout/SettingsLayout';
import { GitHubSettingsPanel } from '../components/github/GitHubSettingsPanel';

export const GitHubSettingsFullPage = () => {
  return (
    <SettingsLayout>
      <div className="settings-v1-toolbar">
        <div>
          <h1>GitHub</h1>
          <p>Подключите GitHub App и привяжите репозитории к проектам для автоматизации.</p>
        </div>
      </div>

      <GitHubSettingsPanel />
    </SettingsLayout>
  );
};
