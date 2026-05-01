import { useEffect, useMemo, useState } from 'react';

type ProviderTone = 'neutral' | 'vercel' | 'netlify' | 'figma';

type LinkPreviewModel = {
  href: string;
  host: string;
  title: string;
  route: string;
  badge: string;
  tone: ProviderTone;
  faviconUrl?: string;
  screenshotUrl?: string;
};

const shorten = (value: string, max = 56) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const resolvePreviewModel = (value: string): LinkPreviewModel => {
  const parsed = new URL(value);
  const host = parsed.hostname.replace(/^www\./, '');
  const path = `${parsed.pathname || '/'}${parsed.search || ''}${parsed.hash || ''}`;
  const route = path === '/' ? 'Главная страница' : shorten(decodeURIComponent(path), 68);

  let badge = 'Результат';
  let tone: ProviderTone = 'neutral';

  if (host.endsWith('vercel.app') || host === 'vercel.com') {
    badge = 'Vercel Preview';
    tone = 'vercel';
  } else if (host.endsWith('netlify.app') || host === 'netlify.com') {
    badge = 'Netlify Preview';
    tone = 'netlify';
  } else if (host.includes('figma.com')) {
    badge = 'Figma';
    tone = 'figma';
  }

  return {
    href: parsed.toString(),
    host,
    title: host,
    route,
    badge,
    tone,
    faviconUrl: `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(parsed.origin)}`,
    screenshotUrl: /^https?:$/.test(parsed.protocol)
      ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(parsed.toString())}?w=1200&h=760`
      : undefined,
  };
};

type ExternalLinkPreviewCardProps = {
  url: string;
};

export const ExternalLinkPreviewCard = ({ url }: ExternalLinkPreviewCardProps) => {
  const preview = useMemo(() => {
    try {
      return resolvePreviewModel(url);
    } catch {
      return null;
    }
  }, [url]);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setFaviconFailed(false);
  }, [preview?.href]);

  if (!preview) {
    return (
      <a className="pcp-link-preview pcp-link-preview--fallback-only" href={url} target="_blank" rel="noreferrer">
        <div className="pcp-link-preview-fallback pcp-link-preview-fallback--neutral">
          <span className="pcp-link-preview-fallback-badge">Результат</span>
          <strong>{url}</strong>
        </div>
      </a>
    );
  }

  return (
    <a className="pcp-link-preview" href={preview.href} target="_blank" rel="noreferrer">
      <div className="pcp-link-preview-media">
        {!imageFailed && preview.screenshotUrl ? (
          <img
            src={preview.screenshotUrl}
            alt={preview.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={`pcp-link-preview-fallback pcp-link-preview-fallback--${preview.tone}`}>
            <span className="pcp-link-preview-fallback-badge">{preview.badge}</span>
            <strong>{preview.title}</strong>
            <span>{preview.route}</span>
          </div>
        )}
      </div>

      <div className="pcp-link-preview-body">
        <div className="pcp-link-preview-head">
          <span className={`pcp-link-preview-badge pcp-link-preview-badge--${preview.tone}`}>{preview.badge}</span>
        </div>

        <h4 className="pcp-link-preview-title">{preview.title}</h4>
        <p className="pcp-link-preview-route">{preview.route}</p>

        <div className="pcp-link-preview-meta">
          {!faviconFailed && preview.faviconUrl ? (
            <img
              className="pcp-link-preview-favicon"
              src={preview.faviconUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <span className="pcp-link-preview-favicon-fallback" aria-hidden="true">
              {preview.host[0]?.toUpperCase() || 'L'}
            </span>
          )}
          <span className="pcp-link-preview-host">{preview.host}</span>
        </div>

        <span className="pcp-link-preview-cta">Открыть результат ↗</span>
      </div>
    </a>
  );
};
