# Frontend MVP Smoke Report (2026-03-28)

## Scope
- `stages` workflow
- `flat` workflow
- public page `/p/:token`
- API tokens in Settings (`/settings/tokens`)

## Environment
- Repo: `popuitka2-fe-fast`
- Run type: integration smoke via `vitest` + `msw` mocks
- Command: `npm run test:run`

## Checklist
1. `stages` flow: create project/stage/task, request review, approve public stage  
Status: PASS (`src/lib/api/service.test.ts`)
2. `flat` flow: create `workflow_type=flat`, CRUD project tasks, block stage endpoints with `409`  
Status: PASS (`src/lib/api/service.test.ts`)
3. Public `/p/:token`: mode-aware payload (`stages` returns stages, `flat` returns tasks)  
Status: PASS (`src/lib/api/service.test.ts`, `src/test/mocks/handlers.ts`)
4. PAT flow for Settings: list/create/revoke + one-time plaintext token in create response  
Status: PASS (`src/lib/api/service.test.ts`, `src/test/mocks/handlers.ts`)
5. Router smoke after UI text/route updates (`signin`, `teams`, `settings`)  
Status: PASS (`src/app/router.test.tsx`)
6. API token schema coverage: required fields, format checks, nullable datetimes, invalid payload errors  
Status: PASS (`src/lib/api/schemas.test.ts`, `src/lib/api/schemas.ts`)

## Result
- Total tests: 32
- Passed: 32
- Failed: 0
