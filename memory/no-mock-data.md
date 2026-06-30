---
name: no-mock-data
description: User insists on no hardcoded/mock data — everything wired to the backend
metadata:
  type: feedback
---

The user is detail-oriented about no hardcoded/mock data. Mock data files (`data/mockSchools.ts`, `data/mockUsers.ts`, `lib/mockAuth.ts`) were deleted; everything goes through `lib/api.ts` to FastAPI.

**Why:** They want a real full-stack app, not a prototype with fake values.
**How to apply:** Wire new UI to real endpoints. Known remaining placeholders to flag, not imitate: school-admin "AI usage (7d): 312" is hardcoded; "watermarked at view-time" copy is aspirational. See [[verify-commands]].
