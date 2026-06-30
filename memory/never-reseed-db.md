---
name: never-reseed-db
description: Do not wipe or reseed the live SQLite DB — it holds the user's real data
metadata:
  type: project
---

`backend/im_telligence.db` holds the user's real accounts/data. `seed.py` was deleted on purpose (no demo data). `Base.metadata.create_all` on startup is idempotent and safe.

**Why:** Wiping loses real data the user created via the UI (schools, teachers, lessons).
**How to apply:** Never reseed/wipe/restore the DB unless the user explicitly asks. See [[dev-login]].
