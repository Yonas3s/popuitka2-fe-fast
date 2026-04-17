const { join } = require('path');

/**
 * Кешируем Chromium внутри репозитория (в .cache/puppeteer).
 * На Vercel этот путь попадает в build cache между деплоями и Chromium
 * не скачивается заново каждый раз. Локально — то же самое.
 *
 * Если на Vercel build всё равно падает на этапе prerender —
 * временный фолбэк: поменять buildCommand в vercel.json на
 *   "npm run build:no-prerender"
 * Это вернёт стандартный SPA (Google всё равно индексирует, но
 * OG-превью в Telegram/FB будет хуже).
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
