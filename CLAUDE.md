# unit-labs frontend

Release management SaaS for dev teams. React SPA.

## Stack

- React 18 + TypeScript + Vite
- Zustand (state), Axios (HTTP), React Hook Form + Zod (forms)
- React Router 6, CSS (global.css, no CSS-in-JS)
- @dnd-kit/core (drag-and-drop in board view)
- Deploy: Vercel

## API

Base: `https://popuitka2-be.onrender.com` (env `VITE_API_BASE_URL`)

Auth: Bearer token in `Authorization` header. Token stored in localStorage (`popuitka2.auth`).

Response format: **camelCase** (id, projectName, isDone, taskType, etc). Old snake_case supported as fallback in normalizers.

Key endpoints:
- `/me`, `/signin`, `/signup`, `/forgot-password`, `/verify-reset-code`, `/reset-password`
- `/teams`, `/teams/:id`, `/teams/:id/members`, `/teams/:id/invite`
- `/projects`, `/projects/:id`, `/projects/:id/stages`, `/projects/:id/tasks` (flat)
- `/projects/:id/stages/:id/tasks` (stage tasks)
- `/projects/:id/stages/:id/tasks/:id/status` — PATCH { status }
- `/projects/:id/repositories`, `/projects/:id/webhook-events`
- `/github/installations`, `/github/installations/:id/repos`
- `/me/telegram`, `/me/telegram/connect-link`
- `/projects/:id/telegram/bindings`, `/projects/:id/telegram/bind-token`
- `/settings/tokens`, `/stat`, `/stat/actions`

## Architecture

```
src/
  app/           — router.tsx, guards.tsx (RequireAuth/GuestOnly), providers.tsx
  components/
    layout/      — UnifiedHeader, WorkspaceHeader (burger menu), SettingsLayout (sidebar), PageShell
    tasks/       — GroupedTaskList (Linear-style list), BoardView (Kanban + dnd), ViewSettingsPanel
    github/      — GitHubSettingsPanel, ProjectReposPanel, WebhookEventsPanel
    telegram/    — ProjectTelegramPanel
    ui/          — GradientButton, TextInput, MenuSelect, Chip, OtpCodeInput
    feedback/    — ToastViewport, ConfirmModal, EmptyState, ErrorState
    agent/       — AgentRunsPanel
    duck/        — DuckAssistant, DuckDialog, PixelDuck
  pages/         — 20+ pages (Landing, SignIn, SignUp, Projects, ProjectDetails, StageDetails, Teams, Settings, etc)
  store/         — Zustand stores: auth, projects, stage, agent, duck, ui, reset-flow
  lib/
    api/         — client.ts (axios + interceptors), endpoints.ts, service.ts, schemas.ts (Zod), errors.ts
    auth/        — redirect helpers
    config/      — env.ts
  types/         — models.ts (all TS types)
  styles/        — global.css (~12k lines)
```

## Conventions

- **UI Kit**: use `.ui-btn`, `.ui-btn-primary`, `.ui-btn-secondary`, `.ui-btn-ghost`, `.ui-btn-sm` for all buttons
- **API mapping**: `schemas.ts` normalizes both camelCase and snake_case with camelCase priority
- **Fallback Task fields**: if API doesn't return `status` — fallback `isDone ? 'done' : 'backlog'`; if no `priority` — fallback `'none'`
- **Task statuses**: `backlog | todo | in_progress | review | done`
- **Task priorities**: `urgent | high | medium | low | none`
- **Pages**: wrap in WorkspaceHeader (for app pages) or SettingsLayout (for /settings/*)
- **Settings routes**: /settings (profile), /settings/tokens, /settings/github, /settings/telegram
- **Mobile**: burger menu in WorkspaceHeader, all toolbars stack at <=900px, grids collapse to 1 column
- **Commits**: conventional commits, Co-Authored-By Claude

## Key patterns

- Optimistic updates in stores (stage, tasks)
- Polling with cleanup (agent runs, telegram linking)
- `normalizeApiError()` for consistent error handling
- `extractXxx()` functions in schemas.ts for typed API responses
- Auth guard redirects to /signin, preserves `from` path
- Toast notifications via useUiStore.pushToast()
- Confirm dialogs via useUiStore.openConfirm()

## Current state

- Task list: Linear-style grouped by status with view settings panel (List/Board toggle)
- Board view: Kanban with drag-and-drop (@dnd-kit)
- GitHub integration: App install, repo binding, webhook log
- Telegram integration: user linking, project chat binding
- Settings: sidebar layout with Profile/Tokens/GitHub/Telegram
- Landing: structured (Hero > For whom > Features > How it works > Integrations > CTA)
- Mobile: fully responsive with burger menu
- Stage sidebar (tags/filters/context): hidden via CSS, needs redesign
