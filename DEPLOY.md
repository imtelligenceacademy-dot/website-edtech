# Deploying IM-Telligence to Railway

This guide takes the app from local dev to a running production deployment on
[Railway](https://railway.app). It is written so another engineer (or an AI
agent) can continue the job without prior context.

The app is a **monorepo with two independently deployed services**:

```
frontend/   Next.js 14 app        -> Railway service "frontend"
backend/    FastAPI + SQLAlchemy   -> Railway service "backend"
```

Plus two managed resources: a **PostgreSQL** database and a **Volume** for
uploaded lesson PDFs.

---

## 0. What is already prepared in the code

These are DONE — do not redo them, just configure the env vars below.

- **Postgres-ready DB layer.** `backend/app/database.py` normalizes a
  `postgres://` / `postgresql://` `DATABASE_URL` to the `psycopg` (v3) driver,
  enables `pool_pre_ping`, and skips SQLite-only shims on Postgres.
  `psycopg[binary]` is in `backend/requirements.txt`. Tables are created on
  startup via `create_all` (no migration step needed for a fresh DB).
- **Volume-ready uploads.** `backend/app/routers/files.py` writes/reads under
  `settings.upload_dir` (env `UPLOAD_DIR`). Point it at a mounted Volume — no
  code change.
- **First-admin bootstrap.** `backend/app/services/bootstrap.py` creates one
  active super-admin at startup when `BOOTSTRAP_ADMIN_EMAIL` /
  `BOOTSTRAP_ADMIN_PASSWORD` are set and no super-admin exists yet (idempotent).
- **Cross-domain cookies.** Auth cookies read `COOKIE_SECURE` / `COOKIE_SAMESITE`
  from env; logout clears them with matching attributes. The app refuses to boot
  in production with insecure settings (`validate_runtime()` in `config.py`).
- **Start config.** `backend/Procfile` runs uvicorn on `$PORT`;
  `backend/.python-version` pins Python 3.11. The frontend uses the default
  `next build` / `next start` (Next.js reads `$PORT`).

---

## 1. Create the Railway project + Postgres

1. Create a new Railway project from the GitHub repo (or `railway init`).
2. **Add PostgreSQL:** New → Database → PostgreSQL. Railway exposes its
   connection string as `${{Postgres.DATABASE_URL}}` for use in other services.
   (On Railway's paid tiers Postgres has automated backups — rely on those; see
   "Known limitations".)

---

## 2. Backend service

Create a service from the repo and configure:

- **Root Directory:** `backend`
- **Start command:** provided by `backend/Procfile`
  (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Nixpacks auto-installs
  from `requirements.txt`.
- **Volume:** Settings → Volumes → add one mounted at `/data` (for uploaded
  PDFs).

### Backend environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | Enables the security guards below. |
| `SECRET_KEY` | *(generate)* | `python -c "import secrets; print(secrets.token_urlsafe(64))"`. App refuses to boot in prod with the default. |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway variable reference. |
| `UPLOAD_DIR` | `/data/files` | Must be inside the mounted Volume. |
| `CORS_ORIGINS` | `https://<frontend-domain>` | Exact frontend origin(s), comma-separated. Set after the frontend has a domain (step 4). |
| `COOKIE_SECURE` | `true` | Required in production (HTTPS). |
| `COOKIE_SAMESITE` | `none` | Frontend & API are on different domains → cross-site cookie. Requires `COOKIE_SECURE=true`. |
| `BOOTSTRAP_ADMIN_EMAIL` | `you@yourschool.com` | Creates the first super-admin. |
| `BOOTSTRAP_ADMIN_PASSWORD` | *(strong password)* | Change it in-app after first login. |
| `BOOTSTRAP_ADMIN_NAME` | `Your Name` | Optional (defaults to "Super Admin"). |
| `AI_PROVIDER` | `groq` (or other) | Existing. |
| `GROQ_API_KEY` | *(your key)* | Existing. Add other provider keys as used. |
| `RESEND_API_KEY` | *(your key)* | Existing (see email note below). |
| `RESEND_FROM` | `onboarding@resend.dev` | Until a domain is verified (see limitations). |
| `ADMIN_EMAIL` | `you@yourschool.com` | Where lesson-access requests are emailed. |
| `BACKUP_EMAIL_ENABLED` | `false` | The in-app DB backup is SQLite-only — disable on Postgres. |

> The app builds all tables automatically on first boot and creates the
> bootstrap super-admin. No manual DB step is required.

---

## 3. Frontend service

Create a second service from the same repo:

- **Root Directory:** `frontend`
- Nixpacks auto-detects Next.js: build `next build`, start `next start`
  (binds to `$PORT`).

### Frontend environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<backend-domain>` | **Inlined at build time** — set it before/at build. Changing the backend URL later requires a frontend redeploy. |

---

## 4. Wire the two domains together (ordering matters)

There is a chicken-and-egg between the two services' URLs:

1. Deploy the **backend** first; note its public domain
   (`https://backend-xxx.up.railway.app` or a custom domain).
2. Set the frontend's `NEXT_PUBLIC_API_BASE_URL` to that backend domain and
   deploy the **frontend**; note its domain.
3. Set the backend's `CORS_ORIGINS` to the frontend domain and **redeploy the
   backend**.

If you use custom domains (e.g. `app.yourdomain.com` + `api.yourdomain.com`),
use those instead — and you may then be able to use `COOKIE_SAMESITE=lax` with a
shared parent domain, but `none` + `Secure` always works.

---

## 5. First login & smoke test

1. Visit the frontend domain.
2. Log in with `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`.
   - If login fails with a network/CORS error, re-check `CORS_ORIGINS`,
     `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, and that
     `NEXT_PUBLIC_API_BASE_URL` points at the backend.
3. **Change the bootstrap admin password** in the app.
4. Smoke test:
   - Create a School and a Teacher (Accounts).
   - Upload a lesson PDF (Files) → confirm it opens in the teacher viewer.
   - **Redeploy the backend**, then re-open the PDF → it must still load
     (proves the Volume works and data survives redeploys).
   - Ask the teacher AI a question (confirms the LLM key).

Health check endpoint: `GET https://<backend-domain>/health` → `{"status":"ok"}`.

---

## 6. Known limitations / follow-ups

- **In-app DB backup is SQLite-only.** `backend/app/services/backup.py` uses
  `VACUUM INTO` / `sqlite3`. On Postgres the super-admin Backup page
  (download/restore/wipe) and the daily backup email will error — hence
  `BACKUP_EMAIL_ENABLED=false`. Use Railway's managed Postgres backups. To
  restore the in-app feature later, reimplement it with `pg_dump`/`pg_restore`
  (requires the Postgres client binaries in the image).
- **Email (Resend) is in test mode** until you verify a domain at
  resend.com/domains and set `RESEND_FROM` to an address on it. Until then,
  Resend only delivers to the account owner and the app falls back to SMTP.
- **Schema migrations.** The app uses `create_all` + a small SQLite column shim,
  not real migrations. Alembic is a dependency but unconfigured. Before evolving
  the schema on a live Postgres DB, set up Alembic (`alembic init`, autogenerate,
  run on deploy).
- **No rate limiting** on the AI/login endpoints (login has lockout; AI does
  not). Consider a limiter before heavy public use.
- **No automated tests.** Changes are manually verified.

---

## 7. Testing the Postgres path locally (optional, recommended)

Before Railway, validate the Postgres code path with a throwaway DB:

```bash
docker run -d --name imt-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
cd backend && . .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres \
  BOOTSTRAP_ADMIN_EMAIL=admin@test.com BOOTSTRAP_ADMIN_PASSWORD=Test1234! \
  uvicorn app.main:app --reload
```

If it boots, creates tables, and you can log in with the bootstrap admin, the
Postgres path is good.

---

## Readiness snapshot

Completed here: Postgres compatibility, Volume-based uploads, first-admin
bootstrap, cross-domain cookie/CORS config, and deploy start config. This is the
"~85/100" milestone. Remaining to reach ~90+: verify a Resend domain, set up
Alembic migrations, and (optionally) add rate limiting and a test suite.
