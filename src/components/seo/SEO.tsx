import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://unit-labs.ru';
const DEFAULT_TITLE = 'unit-labs — релиз-менеджмент для dev-команд';
const DEFAULT_DESCRIPTION =
  'unit-labs — SaaS для управления релизами: проекты, этапы, задачи, интеграции с GitHub и Telegram. Всё, что нужно команде, чтобы доводить фичи до продакшена без хаоса.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export type SEOProps = {
  /** Заголовок страницы. Попадёт в <title> и og:title. */
  title?: string;
  /** Описание. Попадёт в meta description и og:description. 120–160 симв. */
  description?: string;
  /** Путь от корня, например "/pricing". Для canonical и og:url. */
  canonicalPath?: string;
  /** Absolute URL картинки для OG/Twitter. */
  image?: string;
  /** Скрыть страницу из поисковиков. */
  noindex?: boolean;
  /** Тип контента для OG. */
  type?: 'website' | 'article';
  /** Если true — title будет использован как есть, без бренд-суффикса. */
  rawTitle?: boolean;
};

/**
 * <SEO /> — управляет мета-тегами страницы.
 * Использовать на каждой публичной странице, чтобы были уникальные title/description.
 */
export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  image = DEFAULT_IMAGE,
  noindex = false,
  type = 'website',
  rawTitle = false,
}: SEOProps) => {
  const fullTitle = !title
    ? DEFAULT_TITLE
    : rawTitle
      ? title
      : `${title} — unit-labs`;

  const canonical = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;

  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="unit-labs" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
