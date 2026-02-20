import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../lib/api/service';
import { APP_TITLE } from '../lib/config/env';

export const LandingPage = () => {
  const [health, setHealth] = useState<'loading' | 'online' | 'offline'>('loading');
  const liveLabel = health === 'online' ? 'v1.0.4 Live' : 'v1.0.4 Checking';
  const healthClass = `health-${health}`;
  const year = useMemo(() => new Date().getFullYear(), []);

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
    <div className="stitch-landing">
      <nav className="stitch-nav">
        <div className="stitch-container stitch-nav-row">
          <Link to="/" className="stitch-brand">
            <span>
              unit-labs
              <em>_</em>
            </span>
          </Link>
          <div className="stitch-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="stitch-nav-actions">
            <Link to="/signin" className="stitch-link-button">
              Log in
            </Link>
            <Link to="/signup" className="stitch-solid-button">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="stitch-main">
        <div className="stitch-main-bg" />
        <div className="stitch-main-glow" />

        <section className="stitch-container stitch-hero">
          <div className="stitch-live-badge">
            <span className={`stitch-live-dot ${healthClass}`} />
            <span>{liveLabel}</span>
          </div>

          <h1 className="stitch-title">
            Manage the release,
            <br />
            <span>not the chaos.</span>
          </h1>

          <p className="stitch-gradient-title">From backlog to approve client.</p>

          <p className="stitch-subtitle">
            Unit-labs creates order in your deployment cycle. A minimalist tool for engineering teams who value
            clarity over complexity.
          </p>

          <div className="stitch-hero-actions">
            <Link to="/signup" className="stitch-ghost-cta">
              Start
            </Link>
          </div>

          <div className="stitch-showcase">
            <div className="stitch-showcase-head">
              <span />
              <span />
              <span />
            </div>
            <div className="stitch-showcase-grid">
              <aside className="stitch-showcase-side">
                <div className="line w40" />
                <div className="line w80" />
                <div className="line w68" />
                <div className="line w76" />
              </aside>
              <div className="stitch-showcase-main">
                <div className="line w34" />
                <div className="stitch-showcase-tasks">
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w72" />
                    </div>
                    <span className="badge ok">approved</span>
                  </article>
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w56" />
                    </div>
                    <span className="badge review">review</span>
                  </article>
                  <article>
                    <div className="task-left">
                      <span className="box" />
                      <div className="line w64" />
                    </div>
                    <span className="badge wait">active</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="stitch-section" id="features">
        <div className="stitch-container">
          <div className="stitch-section-head">
            <h2>Orchestrate the flow</h2>
            <p>Three simple stages to maintain sanity in your deployment pipeline.</p>
          </div>
          <div className="stitch-features-grid">
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">B</div>
              <h3>Structured Backlog</h3>
              <p>Capture issues and features in a distraction-free list. Prioritize with drag-and-drop simplicity.</p>
              <div className="stitch-feature-visual list">
                <span />
                <span />
              </div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">S</div>
              <h3>Release Stages</h3>
              <p>Move items through customizable environments. Dev, Staging, Production - visualized clearly.</p>
              <div className="stitch-feature-visual flow">
                <span />
                <span />
                <span />
              </div>
            </article>
            <article className="stitch-feature-card">
              <div className="stitch-feature-icon">A</div>
              <h3>Client Approval</h3>
              <p>Invite stakeholders to review specific builds. Collect approvals and feedback in one place.</p>
              <div className="stitch-feature-visual approve">
                <span>Approved</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="stitch-dev" id="workflow">
        <div className="stitch-container stitch-dev-grid">
          <div className="stitch-dev-copy">
            <h2>
              <span>&lt;</span>Developer<span>/&gt;</span> Focused.
            </h2>
            <p>
              Built with the stack you love. Integrates seamlessly with GitHub, GitLab, and Jira. No more context
              switching.
            </p>
            <div className="stitch-dev-tags">
              <span>git push</span>
              <span>jira-sync</span>
            </div>
          </div>
          <pre className="stitch-dev-code">{`const release = await unit.create({
  version: '2.0.4',
  stage: 'staging',
  features: [
    'auth-flow',
    'dark-mode-fix'
  ]
});

// Syncs automatically with your board
await release.notifyClients();`}</pre>
        </div>
      </section>

      <footer className="stitch-footer" id="pricing">
        <div className="stitch-container stitch-footer-row">
          <p>
            © {year} {APP_TITLE}
          </p>
          <div>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
