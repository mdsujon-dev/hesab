# Hesab — Income & Expense Manager

An offline-first, multi-tenant SaaS accounting platform. Every registered user
gets a private financial workspace: income and expense tracking, daily / monthly
/ yearly / category / custom reports, PDF-CSV-print export, and automatic
synchronisation with MongoDB when the connection returns.

Built as a Next.js full-stack app — App Router route handlers are the backend,
there is no separate API server.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| UI | Ant Design 6 (single light theme, gold accent), Tailwind utilities for layout |
| Charts | Recharts |
| Database | MongoDB via Mongoose |
| Validation | Zod (server-side, on every write) |
| Auth | HTTP-only JWT session cookie (jose) + bcrypt hashes |
| Offline store | IndexedDB via Dexie |
| App | Installable PWA with an offline shell |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the two values
pnpm dev
```

`.env.local` needs:

```bash
MONGODB_URI="mongodb+srv://user:password@cluster/dbname"
SESSION_SECRET="a-random-string-of-at-least-32-characters"
```

Generate a real session secret with:

```bash
openssl rand -base64 32
```

Then open the app, create an account, and the workspace is seeded with 17
default categories.

## Transaction paging

The transaction, income and expense tables page through `/api/transactions`
(`limit`, `skip`, `sort`, plus the type/date/category/search filters), so the
browser only ever holds one page no matter how large the account gets.

Two details make that work alongside the offline model:

- Offline, the identical query runs against the IndexedDB mirror instead, so
  the table keeps paging with no connection.
- Rows that have not synced yet exist only on this device, so they are merged
  onto the first page — otherwise an entry you just added would disappear until
  the next sync.

Totals and exports are still computed from the local mirror, because they
describe the whole selected period rather than the visible page.

## How offline-first works

Reads and writes never wait on the network:

1. Every screen reads from the local Dexie mirror, so the UI renders instantly
   and works with no connection.
2. A write lands in IndexedDB immediately and is flagged `pending`.
3. The sync engine (`src/offline/sync.ts`) pushes pending rows to `POST /api/sync`
   on a debounce, on reconnect, on tab focus, and every 60 seconds.
4. The same request pulls back anything changed on the server since the client's
   cursor, so other devices converge.

Guarantees:

- **Idempotent** — rows are keyed by `(userId, localId)`, so replaying a failed
  batch cannot create duplicates.
- **Conflict resolution** — last-write-wins on the client `updatedAt`; a push
  older than the server copy is rejected and corrected by the pull half of the
  same response.
- **Deletes propagate** — deletion is a soft `deletedAt` tombstone, so other
  devices learn about it.
- **Safe retry** — a failed sync leaves rows pending and backs off; nothing is
  lost. The header chip shows `Synced` / `N pending` / `Offline` / `Retrying`.

`syncedAt` (server clock) is the pull cursor, separate from `updatedAt` (the
client's logical version) — a device with a skewed clock cannot make its changes
invisible to other devices.

## Password reset

`POST /api/auth/forgot-password` emails a link, `POST /api/auth/reset-password`
consumes it. Delivery goes through Gmail SMTP (nodemailer), configured with
`EMAIL_USER` / `EMAIL_PASS` — the latter must be a Google **App Password**, not
the account password.

- Only a SHA-256 hash of the token is stored, so a database leak yields no
  usable links.
- Tokens expire after 60 minutes and are single-use — the hash is cleared the
  moment a password is set.
- The endpoint answers identically whether or not the email is registered, so it
  cannot be used to discover which addresses have accounts.
- If the email fails to send, the stored token is rolled back rather than left
  live.

## Security

- Passwords are bcrypt hashed (cost 12) and never selected by default.
- Session JWTs live in an `httpOnly`, `sameSite=lax` cookie, `secure` in production.
- **Every** query is scoped to the authenticated `userId` resolved server-side —
  never to an id from the request body.
- All writes are validated with Zod before touching the database.
- Rate limiting on login, registration, password change and sync.
- `src/proxy.ts` does an optimistic cookie check only; real verification happens
  per request in `requireUser()`.

## Project layout

```
src/
  app/
    (auth)/          login, register
    (app)/           dashboard, income, expense, transactions,
                     reports/{daily,monthly,yearly,category,custom},
                     categories, profile, settings
    api/             auth, transactions, categories, sync, reports
    manifest.ts      PWA manifest
  components/        shell, views, charts, providers, transaction forms
  lib/               db, session, validation, reports, money, export
  models/            User, Transaction, Category
  offline/           Dexie store, local-first repo, sync engine
  proxy.ts           route protection
public/sw.js         offline shell service worker
```

Report maths lives in `src/lib/reports.ts` as pure functions over a transaction
array, so the exact same code serves the MongoDB-backed API routes and the
offline IndexedDB mirror.

## API

| Method | Route |
|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` |
| GET / PATCH / DELETE | `/api/auth/me` |
| POST | `/api/auth/password` |
| GET / POST | `/api/transactions` |
| PATCH / DELETE | `/api/transactions/:id` |
| GET / POST | `/api/categories` |
| PATCH / DELETE | `/api/categories/:id` |
| POST | `/api/sync` |
| GET | `/api/reports/{daily,monthly,yearly,category,custom}` |

`:id` accepts either the Mongo `_id` or the client-generated `localId`, so a
record created offline can be edited before it has ever reached the server.

## Scripts

```bash
pnpm dev      # development server
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint
```
