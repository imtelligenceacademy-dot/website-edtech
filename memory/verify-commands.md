---
name: verify-commands
description: How to verify frontend and backend changes in IM-Telligence
metadata:
  type: feedback
---

After frontend changes run `npx tsc --noEmit`. After backend changes run `python -c "from app.main import app"` (from `backend/`, using `.venv/Scripts/python.exe`).

**Why:** Catches type/import breakage before the user sees it; the user expects verification.
**How to apply:** Run the matching check after editing; don't run `npm run build` while `npm run dev` is running (corrupts `.next`). See [[no-mock-data]].
