import { APP_DISPLAY_YEAR } from '../../lib/config/env';
import { SupportMailLink } from '../support/SupportMailLink';

export const WorkspaceFooter = () => {
  return (
    <footer className="workspace-footer">
      <div className="workspace-footer-container">
        <div className="workspace-footer-row">
          <div className="workspace-footer-brand">
            unit-labs<span>_</span>
            <small>© {APP_DISPLAY_YEAR}</small>
          </div>

          <div className="workspace-footer-links">
            <SupportMailLink>Помощь</SupportMailLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
