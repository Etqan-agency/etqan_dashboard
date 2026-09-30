# Etqan Admin

Content dashboard for etqan.agency. Next.js 15 (App Router) + React 19 + Tailwind 4,
wired to the Django REST backend documented in the API reference.

It ships with a built-in sample dataset, so it deploys and works before the backend
is reachable.

---

## Deploy to Vercel

```bash
npm install
npm run dev        # http://localhost:3001  (the website uses 3000)
```

Then push the folder to a Git repo and import it at vercel.com, or:

```bash
npx vercel
```

No environment variables are required for the first deploy — it runs on sample data.

## Connect the real API

Set one variable in **Vercel → Settings → Environment Variables** (or `.env.local`
for development):

```
NEXT_PUBLIC_API_BASE=https://<host>/etqan_api
```

Use the backend's base URL **without** the trailing `/api` — the dashboard appends
`/api/...` to every request itself (so the value above yields
`https://<host>/etqan_api/api/services/`). Locally, `cp .env.example .env.local` points it at `http://localhost:8000`.

Setting it flips the whole app from the mock adapter to live `fetch` calls and turns
the login screen into a real JWT sign-in. Unset it and you are back on sample data.

Optional:

```
NEXT_PUBLIC_SITE_URL=https://www.etqanpp.com   # target of the "View site" button (this is the default)
```

### CORS

The dashboard is a browser client on a different origin, so Django needs to allow it:

```python
# settings.py
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")
CORS_ALLOWED_ORIGINS = ["https://your-dashboard-host.example", "http://localhost:3001"]
```

The backend must allow the dashboard's own origin — `http://localhost:3001` locally
(the dashboard's dev/start port) and the deployed dashboard URL in production.
The website's origin (`:3000`) is a separate entry.

Without this every request fails in the browser while working fine in curl.

---

## What maps to what

| Screen | Endpoints |
|---|---|
| `/overview` | `GET /api/settings/`, plus `page_size=1` count probes per collection |
| `/services` | `/api/services/`, detail by **slug** |
| `/projects` | `/api/projects/`, detail by **slug** |
| `/blog` | `/api/blog/`, detail by **slug** |
| `/opinions` | `/api/opinions/`, detail by **id** |
| `/team` | `/api/team/`, detail by **id** |
| `/clients` | `/api/clients/`, detail by **id** |
| `/messages` | `/api/messages/`, `PATCH …/mark-read/` |
| `/settings` | `GET` / `PATCH /api/settings/` (singleton, no id) |

The six CRUD collections share one route, `app/(dash)/[resource]/page.tsx`, driven by
the schema in `lib/resources.tsx`. Adding a seventh collection means adding one entry
to `RESOURCES` and one link in `components/Sidebar.tsx` — no new page.

### Contract details the client honours

- **Pagination** — reads the `{count, next, previous, results}` envelope; Previous/Next
  are enabled from the real `next`/`previous` values, not computed page maths.
- **JWT rotation** — a `401` triggers one `POST /api/auth/refresh/`, stores the *new*
  refresh token from the response, and retries the original request once.
- **Staff gate** — a non-`is_staff` account is signed straight back out with an
  explanation rather than dropped into an admin it cannot write to.
- **Read-only fields** — `slug` is shown disabled; blog `author` and `published_at` are
  never sent.
- **`tag_slugs`** — the editor reads nested `tags[]` but writes `tag_slugs[]`, because
  that field is write-only.
- **Messages** — only `is_read` is ever PATCHed; every other field renders as text.
- **Images** — saved in a second multipart `PATCH` after the JSON record. One combined
  FormData would force list and object fields through multipart, which DRF parses
  inconsistently.

---

## Project layout

```
app/
  globals.css              design tokens + component layer
  layout.tsx               fonts, providers
  login/page.tsx           JWT sign-in (skipped in sample mode)
  (dash)/
    layout.tsx             sidebar + topbar shell, auth gate, unread badge
    overview/page.tsx
    [resource]/page.tsx    generic CRUD table for all six collections
    messages/page.tsx
    settings/page.tsx
components/
  Icon.tsx  ui.tsx  fields.tsx  ResourceEditor.tsx  Sidebar.tsx  Topbar.tsx
lib/
  api.ts                   fetch client, JWT rotation, mock switch
  mock.ts                  sample dataset + in-memory API
  resources.tsx            schema per collection
  types.ts  utils.ts
providers/
  AuthProvider  ToastProvider  SearchProvider
```

## Design tokens

Every colour, radius, and shadow is declared once in `app/globals.css` under `@theme`,
so each token is both a CSS variable and a Tailwind utility (`bg-ink`, `text-muted`,
`rounded-lg`, `shadow-e2`). Values were taken from the marketing site:

| Token | Value | Origin |
|---|---|---|
| `--color-ink` | `#0A1A2F` | active nav pill, dark cards |
| `--color-blue` | `#2563EB` | Start a Project / Learn more |
| `--color-blue-tint` | `#DCE8FD` | the "seeking approaches" highlight |
| `--color-sky` | `#BFD8F5` | hero gradient wash |
| `--color-clay` | `#A34A55` | "Our clients" card → attention states |
| `--color-moss` | `#1B7A5A` | added; the site had no success colour |

---

## Known limits

- Sample-mode edits live in module memory and reset on a hard refresh. That is
  deliberate — it keeps the demo honest without a database.
- Tokens are stored in `localStorage`. For production, prefer an httpOnly refresh
  cookie; the swap is contained to `lib/api.ts`.
- The overview costs nine parallel requests because the API has no aggregate endpoint.
  A `GET /api/stats/` returning counts per collection would make it one.
