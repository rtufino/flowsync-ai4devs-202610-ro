# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent npm projects (no root `package.json`, no workspaces) — run commands from inside each directory:

- `backend/` — AdonisJS 7 API (TypeScript, ESM, Lucid ORM, SQLite via `better-sqlite3`, VineJS validation, Japa tests).
- `frontend/` — React 19 + Vite 8 + TypeScript SPA (currently the Vite starter template; it has no API client yet).
- `prompts.md` — exercise deliverable: log of every prompt used, with model and tool (verbatim, including failed ones). See its header for the format.

## Commands

Backend (`cd backend`):
- `cp .env.example .env` then `node ace generate:key` to fill `APP_KEY` (`.env` is gitignored)
- `node ace migration:run` — also regenerates `database/schema.ts`
- `npm run dev` — dev server with HMR on `http://localhost:3333`
- `npm test` — all Japa suites; `node ace test --files tests/functional/foo.spec.ts` for one file; `node ace test unit|functional` for a suite. (`tests/` currently only has `bootstrap.ts`; suites expect `tests/unit/**/*.spec.ts` and `tests/functional/**/*.spec.ts`.)
- `npm run lint`, `npm run typecheck`, `npm run format`

Frontend (`cd frontend`): `npm run dev` (Vite, port 5173), `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint).

## Backend architecture

- **Auth**: token-based (opaque access tokens via `@adonisjs/auth` `DbAccessTokensProvider`, stored in `auth_access_tokens`), not sessions. Signup/login return `{ data: { user, token } }`; protected routes use `middleware.auth()` with `Authorization: Bearer <token>`.
- **Routes** (`start/routes.ts`): everything lives under `/api/v1`; `auth/signup`, `auth/login` are public; `account/profile`, `account/logout` require auth. Controllers are referenced through the generated `controllers` barrel (`#generated/controllers`), so new controllers in `app/controllers` are picked up by the `indexEntities` hook in `adonisrc.ts`.
- **Response shaping**: `providers/api_provider.ts` adds `ctx.serialize()` to `HttpContext`, which wraps output in `{ data: ... }` (and validates Lucid pagination metadata). Controllers return `serialize(Transformer.transform(model))` — transformers live in `app/transformers`; don't return raw models.
- **Models/schema**: `database/schema.ts` is **auto-generated** from migrations (`schemaGeneration` in `config/database.ts`) — don't edit it. Models extend the generated schema class (e.g. `User extends compose(UserSchema, withAuthFinder(hash))`); add behavior in `app/models`, columns via migrations.
- **Typed client**: `@tuyau/core` `generateRegistry()` writes `.adonisjs/` (checked in) and `package.json` `exports` expose `./data` and `./registry`, intended for the frontend to consume typed routes. Regenerated when the app boots/builds, so expect diffs there after route/controller changes.
- **Imports**: use the `#controllers/*`, `#models/*`, `#validators/*`, `#start/*` etc. subpath aliases from `package.json` `imports`, not relative paths.
- **DB**: SQLite file at `backend/tmp/db.sqlite3` (`tmp/` is gitignored except `.gitkeep`). Other drivers are commented in `config/database.ts`.
- **CORS**: wide open in dev (`origin: true`); in production only origins in an explicit allowlist (`CORS_ORIGIN` in `.env.example`).
- Tests run with `NODE_ENV=test` and `.env.test` (`SESSION_DRIVER=memory`).

## Reglas de proceso
- Antes de tocar código: crear una rama nueva (`git checkout -b feat/<slug>`). Nunca commitear directo en `main`/`s1/start`.
- Al cerrar la tarea: usar la skill `/commit`, luego `gh pr create` con una descripción completa de los cambios en el cuerpo del PR.
- Después de abrir el PR: usar el subagente `adversarial-reviewer` sobre él, antes de darlo por terminado.
- No repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo con la URL del PR.