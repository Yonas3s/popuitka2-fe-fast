# popuitka2-fe-fast

Frontend для `popuitka2` на React + Zustand.

## Stack

- React + TypeScript + Vite
- Zustand
- Axios
- React Router
- React Hook Form
- Zod
- Vitest + Testing Library + MSW

## Запуск

```bash
npm install
npm run dev
```

## ENV

Скопируйте `.env.example` в `.env` и при необходимости измените:

- `VITE_API_BASE_URL` (по умолчанию `https://popuitka2-be.onrender.com`)
- `VITE_APP_TITLE` (по умолчанию `popuitka2`)
- `VITE_FRONTEND_BASE_URL` (опционально, для клиентских ссылок `/p/:token`, по умолчанию текущий origin)

## Vercel Deploy

Конфиг уже добавлен в `vercel.json`:

- framework: `vite`
- build command: `npm run build`
- output directory: `dist`
- SPA rewrite для React Router (`/projects/*`, `/p/*`, и т.д. на `index.html`)

В Vercel Project Settings -> Environment Variables добавьте минимум:

- `VITE_API_BASE_URL=https://popuitka2-be.onrender.com`
- `VITE_APP_TITLE=popuitka2`
- `VITE_FRONTEND_BASE_URL=https://<ваш-vercel-домен>`

После этого Deploy будет работать с прямыми переходами на вложенные роуты.

## Команды

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:run
```

## Основные страницы

- `/`
- `/signin`
- `/signup`
- `/forgot-password`
- `/verify-reset-code`
- `/reset-password`
- `/projects`
- `/projects/:projectId`
- `/projects/:projectId/stages/:stageId`
- `/p/:shareToken`
- `*`
