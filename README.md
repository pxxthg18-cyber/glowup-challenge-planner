# ✨ GlowUp — Personalized Glow-Up Challenge Planner

A premium, Notion-inspired personal productivity and self-improvement web application. Design, launch, and track challenges of any duration — from 7-day sprints to 120-day transformations.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open http://localhost:5173
```

> No Supabase credentials needed — the app runs fully in **local storage demo mode** out of the box.

---

## 🗂️ Features

| Feature | Description |
|---|---|
| **Challenge Templates** | 13 curated templates across Wellness, Fitness, Mindfulness, Creativity, Learning, and more |
| **Flexible Duration** | Any number of days — 7, 10, 35, 75, 100, 120, or custom |
| **Habit Tracker** | Daily log matrix with streak tracking (skips unscheduled days) |
| **Task Manager** | Kanban, Checklist, and Table views with priorities and categories |
| **Goals & Milestones** | Auto-generated milestones for any challenge duration |
| **Journal** | Structured entries with mood, gratitude, daily wins, and search |
| **Focus Timer** | Pomodoro-style timer with Web Audio chime and session history |
| **Calendar** | Month / Week / Day views with task and milestone rendering |
| **Analytics** | Recharts bar and pie charts, habit consistency matrix |
| **Vision Board** | Image grid with category filters |
| **Auth** | Email/password auth (Supabase) with graceful local-only fallback |
| **Onboarding** | 4-step first-run welcome wizard |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| State / Data | TanStack Query + Context API |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth) — optional |
| Testing | Vitest + React Testing Library |
| E2E | Playwright (optional) |

---

## ⚙️ Configuration

### Local Demo Mode (default)

No configuration required. The app automatically runs in local storage mode when Supabase is not connected. All data is persisted in `localStorage` under `glowup_*` keys.

### Connect Supabase (optional)

```bash
# 1. Copy the example env file
cp .env.example .env

# 2. Fill in your Supabase project credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

```sql
-- 3. Run the migration in your Supabase SQL Editor
-- File: supabase/migrations/20250101000000_init_glowup_schema.sql
```

```bash
# Optional: Seed template data
# File: supabase/seed.sql
```

---

## 🧪 Testing

```bash
# Run all tests (18 tests, 3 files)
npm test

# Watch mode
npm run test:watch

# Run with coverage
npx vitest run --coverage
```

### Test Coverage

- **`src/utils/__tests__/dateUtils.test.ts`** — 11 tests covering date utilities, leap years, arbitrary durations (10/35/75/100/120 days), `getChallengeProgress`, milestone generation
- **`src/test/challengeFlow.test.ts`** — 4 tests: template seeding, challenge cloning isolation, habit streak accuracy, challenge extension
- **`src/test/userJourneys.test.tsx`** — 3 tests: template gallery rendering and search, 35-day custom challenge creation, dashboard rendering

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── challenge/        # ChallengeWizardModal, ChallengeSettingsModal
│   ├── habits/           # HabitModal
│   ├── layout/           # AppLayout, Sidebar, Header
│   ├── onboarding/       # OnboardingModal (first-run wizard)
│   ├── tasks/            # TaskModal
│   └── templates/        # TemplateCard, TemplatePreviewModal
├── context/
│   ├── AuthContext.tsx   # Auth state, sign-in/up/out, profile
│   └── ChallengeContext.tsx  # Active challenge, CRUD
├── data/
│   └── seedTemplates.ts  # 13 curated challenge templates
├── pages/
│   ├── TemplatesPage     # Primary landing screen (after auth)
│   ├── DashboardPage     # Active challenge overview
│   ├── TasksPage         # Task management (Kanban/List/Table)
│   ├── HabitsPage        # Habit consistency matrix
│   ├── GoalsPage         # Milestone grid + goals
│   ├── CalendarPage      # Month/Week/Day calendar
│   ├── JournalPage       # Journal entries
│   ├── FocusPage         # Pomodoro focus timer
│   ├── AnalyticsPage     # Charts and reports
│   ├── VisionBoardPage   # Image inspiration board
│   ├── SettingsPage      # Profile, Supabase config, export
│   └── AuthPage          # Sign in / Sign up
├── services/
│   ├── supabase.ts       # Supabase client (graceful fallback)
│   ├── storageRepository.ts  # Full localStorage CRUD layer
│   └── api.ts            # Unified API (Supabase → localStorage)
├── types/
│   └── database.ts       # All TypeScript interfaces
└── utils/
    ├── cn.ts             # clsx + tailwind-merge helper
    └── dateUtils.ts      # Centralized date engine
```

### Key Design Decisions

**Flexible Challenge Duration** — All date math is centralized in `src/utils/dateUtils.ts`. No hard-coded day counts anywhere. Every calculation derives from `start_date` + `duration_days`.

**Supabase is optional** — `src/services/supabase.ts` checks for env vars. If absent, `src/services/api.ts` falls through to `src/services/storageRepository.ts` (localStorage). The UI shows a clear "Local Persistence" / "Live Cloud" indicator.

**Template safety** — Challenge creation clones goals, habits, and tasks from the template into the challenge with new IDs. Templates are read-only seed data.

**Streak accuracy** — `calculateHabitStreak()` skips days on which a habit isn't scheduled. A daily habit broken on Wednesday doesn't punish a weekday-only habit that legitimately had Wednesday off.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `cream` | `#FAF7F2` | Page background |
| `white` | `#FFFFFF` | Card backgrounds |
| `blush` | `#F2DDE3` | Accent backgrounds |
| `rose` | `#C9879B` | Primary accent / CTAs |
| `lavender` | `#E8E3F5` | Lavender highlights |
| `sage` | `#DCE8DD` | Success / nature |
| `dark` | `#29272B` | Primary text |
| `muted` | `#77727B` | Secondary text |

Fonts: **Playfair Display** (headings) + **Inter** (body)

---

## 📦 Build

```bash
# Production build
npm run build

# Preview the production build
npm run preview
```

---

## 📄 Database Schema

The full schema is at [`supabase/migrations/20250101000000_init_glowup_schema.sql`](supabase/migrations/20250101000000_init_glowup_schema.sql).

Tables: `profiles`, `templates`, `template_goals`, `template_habits`, `template_tasks`, `challenges`, `milestones`, `goals`, `habits`, `habit_logs`, `tasks`, `journal_entries`, `focus_sessions`, `vision_board_items`

All tables have Row Level Security (RLS) enabled — users can only access their own data.

---

## 🔐 Security

- **Never commit `.env`** — add it to `.gitignore` (already done)
- Supabase Anon Key is safe to expose in browser builds (it's the public key with RLS enforcing access)
- Secret Service Role Key must never be used in browser code

---

## 🛣️ Roadmap

- [ ] Supabase Realtime sync for cross-device live updates
- [ ] Push notification reminders via Web Push API
- [ ] Collaborative challenges (shared progress with friends)
- [ ] AI-powered challenge suggestions based on past history
- [ ] Playwright end-to-end test suite
- [ ] PWA support for offline mobile use

---

## 📝 License

MIT License — built as a demonstration project.
