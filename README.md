# IM-Telligence — Frontend

Teacher management + AI-assisted teaching platform. **Frontend only.** Mock data, no backend.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Roles

| Role | Demo email | Can |
| --- | --- | --- |
| Super Admin | `georgio@im-telligence.com` | Everything: approve accounts, create users, upload files, assign access, view all schools, security, reports |
| School Admin | `rania@antonine.edu.lb` | **Monitoring only.** View teachers, lesson completion, AI usage, security alerts, request reports |
| Teacher | `nour@antonine.edu.lb` | Open assigned lessons, navigate slides in order, ask AI, see progress and watchdog warnings |

The login page also exposes one-click "Sign in as…" buttons for each role to make demoing quick. Real production auth is **not** implemented — see `lib/mockAuth.ts`.

## Project layout

```
app/
  page.tsx                  # Landing / login / signup
  super-admin/              # dashboard, schools, accounts, files, access, reports, security
  school-admin/             # dashboard, teachers, reports, security (read-only)
  teacher/                  # home, lessons, lessons/[id], ai, progress
components/
  layout/                   # Sidebar, Topbar, DashboardShell
  ui/                       # Card, Button, Badge, StatCard, Table, Modal
  auth/                     # LoginForm, SignupForm
  ppt-viewer/               # PPTViewer (mock — no real .pptx render)
  ai/                       # Chatbot (mock responses)
  reports/                  # ReportSection (generate → processing → ready flow)
  security/                 # SecurityLogTable
  watchdog/                 # WatchdogBadge
data/                       # mock* data files (users, schools, lessons, progress, reports, security, AI)
lib/                        # mockAuth, permissions, utils
types/                      # shared TS types
```

## Notes

- **PPT viewer is a mock.** Slide titles and bodies render in HTML. Real PPTX rendering is a follow-up.
- **Screenshot prevention is not fully possible on the web.** The UI uses deterrence: diagonal watermarks with user email + IP + timestamp on every slide, no download button, no edit button. Real protection must be enforced server-side.
- **AI is mocked.** `components/ai/Chatbot.tsx` matches against keywords (`robot`, `loop`, `ai`) and otherwise returns a fallback reply. Source-reference and cached badges render to demonstrate the UI.
- **Reports** simulate the request → processing → ready flow with a 3 s timeout. There's also a "Mark ready" button for instant testing.
- **Permissions** are enforced via `lib/permissions.ts` and via role-specific nav. School Admin pages contain no approval / upload / assignment controls.
- All TODOs marked with `// TODO:` indicate where backend integration belongs.
