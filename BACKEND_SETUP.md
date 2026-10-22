# Black Swords backend

The storefront uses Vercel Functions and Neon Postgres.

## Required Vercel variables

Set these variables for `development`, `preview`, and `production`:

```env
DATABASE_URL=postgresql://...
ADMIN_SESSION_SECRET=<long-random-secret>
```

`DATABASE_URL` should come from a Neon Postgres Marketplace integration. `ADMIN_SESSION_SECRET` signs the HTTP-only admin session cookie and must never be exposed to the browser.

## First admin setup

After the variables are connected, open the `Admin` link in the storefront. The first visit creates the administrator ID and password in Postgres. Subsequent visits use the server-side session endpoint.

## Draft and publish flow

- `GET /api/public-config` returns only the published configuration.
- `GET /api/admin/config` returns the authenticated administrator's current draft.
- `POST /api/admin/config` with `mode: "draft"` saves edits without changing the storefront.
- `POST /api/admin/config` with `mode: "publish"` replaces the published configuration and clears the draft.

The API creates the two tables on the first request. The checked-in `schema.sql` is also available for manual initialization, and `npm run db:setup` can apply it when `DATABASE_URL` is available locally.
