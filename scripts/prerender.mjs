/**
 * Pre-render: после `vite build` поднимаем статический сервер над dist/,
 * puppeteer обходит список публичных маршрутов и сохраняет итоговый HTML
 * обратно в dist/<route>/index.html.
 *
 * Результат: боты (Google, Яндекс, Telegram-preview, Facebook-preview)
 * сразу получают готовый HTML с контентом, а React догидрирует его на клиенте.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 4180);

// Маршруты, которые надо пре-рендерить. Только публичные.
// Когда появятся /pricing, /about и т.п. — добавить сюда и в sitemap.xml.
const ROUTES = ['/'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.join(DIST, url);

      try {
        const s = await stat(filePath);
        if (s.isDirectory()) filePath = path.join(filePath, 'index.html');
      } catch {
        // SPA fallback для путей без расширения
        if (!path.extname(url)) {
          filePath = path.join(DIST, 'index.html');
        } else {
          res.writeHead(404);
          res.end('not found');
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  return server;
}

async function renderRoute(browser, route) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60_000);

  // Отключаем всё, что может замедлить рендер (анимации, звук).
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  const url = `http://127.0.0.1:${PORT}${route}`;
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Страхуемся: ждём что в #root появился контент (react смонтировался).
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.childNodes.length > 0;
    },
    { timeout: 30_000 },
  );

  const html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
  await page.close();

  // Пишем в dist/<route>/index.html.
  const outDir = route === '/' ? DIST : path.join(DIST, route.replace(/^\/|\/$/g, ''));
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  await writeFile(outFile, html, 'utf-8');

  console.log(`  ✓ ${route.padEnd(25)} → ${path.relative(ROOT, outFile)}`);
}

async function main() {
  console.log(`→ Pre-rendering ${ROUTES.length} route(s) from dist/`);

  const server = await startServer();
  console.log(`  server on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES) {
      await renderRoute(browser, route);
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('→ Pre-render done');
}

main().catch((err) => {
  console.error('Pre-render failed:', err);
  process.exit(1);
});
