# Taura Africa Backend

Backend API for the "People Like You" platform: CSR storytelling, writer
marketplace, Book Space, Stationery Hub, and the reader-to-writer
progression system.

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
psql "$DATABASE_URL" -f schema.sql
npm run dev
```

## Deploying on Render

1. Push this repo to GitHub.
2. On Render: New -> Web Service -> connect this repo -> Environment: Docker.
3. Add environment variables in Render's dashboard:
   - `DATABASE_URL` — the **Internal Database URL** from your Render Postgres instance
   - `JWT_SECRET` — any long random string
4. Once the Postgres instance is up, run `schema.sql` against it (Render's
   Postgres dashboard gives you a `psql` connection string for this, or use
   the Shell tab on the web service after first deploy).
5. Render will build from the Dockerfile and expose the service on the
   `PORT` it injects (already read via `process.env.PORT`).

## Key business logic

- Every signup starts as `reader`.
- Comments award points (`routes/comments.js`); crossing
  `WRITER_ELIGIBILITY_THRESHOLD` flags the user as `eligible_for_writer`.
- Admin reviews eligible readers (`GET /api/admin/eligible-writers`) and
  promotes manually (`POST /api/admin/users/:id/promote-writer`) — points
  unlock the *option*, admin makes the call, matching "we see you're good,
  we make you a writer."
- Writers/admins submit stories; writer-authored stories land in
  `pending_review` until admin publishes (`POST /api/admin/stories/:id/review`).
  Admin-authored stories publish immediately.
- Admin can onboard commentators directly (`POST /api/admin/onboard-commentator`)
  and create corporate `profiles` (the person behind each story).
- Paynow integration is stubbed in `routes/orders.js` — the order record
  and reference field are ready, but the actual Paynow initiate/webhook
  calls still need your Paynow integration keys wired in.

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Stories | `GET /api/stories`, `GET /api/stories/:id`, `POST /api/stories` |
| Comments | `GET /api/comments/story/:id`, `POST /api/comments/story/:id` |
| Books | `GET /api/books`, `POST /api/books` |
| Stationery | `GET /api/stationery`, `POST /api/stationery` (admin) |
| Blog | `GET /api/blog` |
| Orders | `POST /api/orders`, `GET /api/orders/mine` |
| Admin | see `routes/admin.js` |
