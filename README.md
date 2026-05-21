# FunderMapsAuth

The dedicated authentication app for FunderMaps — `auth.fundermaps.com`.

A small Vue 3 + Vite + TypeScript SPA that owns the generic auth surface for
the whole fleet: **login, forgot-password, reset/set-password, sign-out**. It
is the OIDC authorization server's UI: every first-party FunderMaps frontend
(WebFront, Report, ClientApp, ManagementFront) is a trusted OIDC client and
redirects unauthenticated users here. Because all clients are first-party and
trusted, there is **no consent screen**.

It talks to the FunderMaps TS API's Better Auth endpoints
(`${VITE_FUNDERMAPS_URL}/api/auth/*`); it has no backend of its own.

> Status: scaffold + working (unstyled) forms. The FunderMaps layout/theme and
> the OIDC `/authorize` resume glue land in later passes.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — type-check + production build
- `pnpm type-check` — `vue-tsc`
- `pnpm preview` — preview the production build

## Environment

Copy `.env.example` to `.env`:

- `VITE_FUNDERMAPS_URL` — base URL of the FunderMaps TS API (no trailing slash).

## Deployment

Served as a static site from **`auth.fundermaps.com`** (a separate app from the
API). The subdomain was previously an alias of the FunderMaps API; the API now
lives only on `api.fundermaps.com`, freeing `auth.` for this app.

Required deploy config:
- This app's `VITE_FUNDERMAPS_URL` = `https://api.fundermaps.com`.
- The API's `TRUSTED_ORIGINS` must include `https://auth.fundermaps.com` (so
  this app can call `/api/auth` and use `redirectTo`/`callbackURL`, e.g. the
  password-reset link).

## Stack

Vue 3 + Vite 8 + vue-router 5 + TypeScript 6 + Tailwind 4 (`@tailwindcss/vite`),
pnpm — aligned with the rest of the FunderMaps frontend fleet.
