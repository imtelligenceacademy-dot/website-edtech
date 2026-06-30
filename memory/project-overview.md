---
name: project-overview
description: IM-Telligence stack, run commands, and architecture at a glance
metadata:
  type: project
---

K-12 STEAM lesson-delivery platform. Roles: Super Admin (uploads PDF lessons, manages schools/accounts), School Admin (monitors their school), Teacher (presents lessons + AI assistant).

**Frontend:** Next.js 14 App Router + TS + Tailwind + lucide-react + pdfjs-dist. Run `npm run dev` (port 3000). All API calls go through `lib/api.ts`.
**Backend:** FastAPI + SQLAlchemy 2.0 + SQLite at `backend/im_telligence.db`. Run from `backend/`: `.venv/Scripts/python.exe -m uvicorn app.main:app --reload` (port 8000). Routers: auth, users, schools, lessons, progress, reports, security, files, dashboard, ai, backup.
**Auth:** Argon2 hashing, JWT access + rotating refresh in httpOnly cookies, server-side RBAC, lockout after 5 fails.
**AI:** Provider-agnostic layer `backend/app/services/llm.py`, active = Groq (`llama-3.3-70b-versatile`), mock fallback if no key. SSE streaming. Teacher AI grounded in lesson PDF text and refuses off-topic; school-admin AI grounded in live school data.
**Auto-assign:** PDF filename `Grade N Lesson NN Title.pdf` parsed by `services/auto_assign.py` → creates curriculum lesson, auto-assigns to teachers matching grade + language.

See [[never-reseed-db]], [[no-mock-data]], [[verify-commands]], [[dev-login]].
