# IM-Telligence

Teacher management + AI-assisted teaching platform for schools. **Full-stack:** a
Next.js frontend talking to a FastAPI backend over a cookie-authenticated JSON API.

> Lessons are delivered as PDFs in a locked-down in-app viewer, teachers get an AI
> assistant grounded in the open lesson, and admins monitor progress, AI usage, and
> security. Lessons unlock sequentially as teachers complete them.

## Repository layout

This is a monorepo with the two halves in sibling directories:

```
frontend/   # Next.js app
backend/    # FastAPI app
```

Each is deployed independently — point your frontend host (e.g. Vercel) at
`frontend/` and your backend host at `backend/`.

## Stack

**Frontend** (`/frontend`)
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react (icons)
- pdfjs-dist (in-app PDF lesson rendering — no browser download)

**Backend** (`/backend`)
- FastAPI + Uvicorn
- SQLAlchemy 2 + SQLite (Alembic available for migrations)
- Pydantic / pydantic-settings (typed, validated config)
- Argon2id password hashing + PyJWT (access/refresh cookie auth)
- httpx + pypdf (LLM calls + PDF text extraction for AI grounding)
- python-docx (server-generated Word reports)

## Run

The frontend and backend run as two processes.

**Backend** (from `backend/`):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows;  source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env             # then edit .env (see Configuration below)
uvicorn app.main:app --reload    # http://localhost:8000  — docs at /docs (dev only)
```

Tables are auto-created on first start (dev convenience). For production use Alembic.

**Frontend** (from `frontend/`):

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

The frontend calls the backend at `NEXT_PUBLIC_API_BASE_URL` (default
`http://localhost:8000`). Set it in `frontend/.env.local` if your backend is elsewhere.

## Configuration

All backend config lives in `backend/.env` (copy from `backend/.env.example`).
Highlights:

- `SECRET_KEY` — JWT signing secret. The app **refuses to start** in production with
  the insecure default.
- `DATABASE_URL` — SQLite by default; point at Postgres/MySQL for production.
- `CORS_ORIGINS` — comma-separated allowed frontend origins.
- `COOKIE_SECURE` — must be `true` in production (HTTPS).
- `AI_PROVIDER` — `mock` | `groq` | `grok` | `openai` | `anthropic`. If the chosen
  provider's API key is empty, it falls back to `mock` so chat still works locally.
  ⚠️ **groq** (groq.com, `gsk_…` keys) and **grok** (xAI, `xai-…` keys) are different
  providers — don't confuse them.
- `SMTP_*` — only needed to *email* a database backup (download works without it).

## Roles & access

| Role | Can |
| --- | --- |
| **Super Admin** | Everything: approve accounts, create users, upload lesson files, assign lesson access, manage schools, view security & reports, back up / restore / wipe the database |
georgio@im-telligence.com
Password123!
| **School Admin** | **Monitoring only.** View teachers, lesson completion, AI usage, security alerts, request & download reports |
| **Teacher** | Open assigned lessons (sequential unlock), navigate slides in order, ask the AI assistant, see progress and watchdog warnings |

There is **no public self-signup** — only a Super Admin creates accounts (`POST
/api/users`). New accounts start `pending` and must be approved before they can log
in. The first Super Admin has to be inserted directly into the database.

## Project layout

```
frontend/                     # Next.js app
  app/                        # App Router
    page.tsx                  # Landing / login
    super-admin/              # dashboard, schools, accounts, files, access, reports, security, backup
    school-admin/             # dashboard, teachers, reports, security, AI (read-only monitoring)
    teacher/                  # home, lessons, AI assistant, progress
  components/
    layout/                   # Sidebar, Topbar, DashboardShell
    ui/                       # Card, Button, Badge, StatCard, Table, Modal, GradeSelector
    auth/                     # LoginForm
    ppt-viewer/               # PdfCanvasViewer (real PDF.js render), PPTViewer
    ai/                       # Chatbot (teacher), SchoolAdminChat
    reports/                  # ReportSection
    security/                 # SecurityLogTable
    watchdog/                 # WatchdogBadge
  lib/                        # api.ts (typed backend client), permissions, grades, utils
  types/                      # shared TS types
  data/                       # legacy mock data (mock* — superseded by the backend)

backend/
  app/
    main.py                   # FastAPI app, CORS + security-headers middleware
    config.py                 # typed settings from .env
    database.py, deps.py      # engine/session, dependency injection
    audit.py, cookies.py      # audit logging, auth cookie helpers
    permissions.py            # role-based access checks
    models/                   # SQLAlchemy models (user, school, lesson, progress, report, …)
    routers/                  # auth, users, schools, lessons, progress, reports,
                              #   security, files, dashboard, ai, backup, access_requests
  storage/files/              # uploaded lesson PDFs (gitignored)
```

## Key behaviors

- **Lesson viewer.** PDFs render in-app via PDF.js. Deterrents against copying:
  diagonal watermarks (user email + timestamp), no download/edit buttons. The backend
  serves PDF bytes only to authenticated users and locks `frame-ancestors` to the
  configured frontend origin (clickjacking protection). Note that true screenshot
  prevention is not possible on the web — this is defense-in-depth, not a guarantee.
- **Sequential unlocking.** After a teacher completes a lesson, the next lesson in the
  same grade+language track unlocks after `LESSON_UNLOCK_WAIT_DAYS` (default 7). Super
  Admins can override per teacher+lesson, and teachers can request early access.
- **AI assistant.** Streamed (SSE) and grounded: the teacher assistant is grounded in
  the open lesson's text; the school-admin assistant is grounded in live school data.
- **Reports.** Generated server-side as `.docx`, scoped by role (school admins get
  their school; super admins get global or a single school).
- **Security.** Argon2id hashing, account lockout after `MAX_FAILED_LOGINS`, short-lived
  access tokens with refresh rotation, audit logging, and hardened response headers.

## Notes

- `data/mock*.ts` files are leftovers from the original frontend-only prototype and are
  superseded by the live backend; treat the backend API as the source of truth.
- API docs are served at `http://localhost:8000/docs` in development and disabled in
  production.
