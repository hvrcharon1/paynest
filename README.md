<div align="center">
  <img src="public/logo.svg" alt="PayNest logo" width="96" height="96" />

  # PayNest

  **One nest for every payment you owe.**

  Add your payment methods once, connect every recurring bill you have, and let autopay and AI insight handle the rest.

  [![CI](https://github.com/hvrcharon1/paynest/actions/workflows/ci.yml/badge.svg)](https://github.com/hvrcharon1/paynest/actions/workflows/ci.yml)
  [![Release](https://github.com/hvrcharon1/paynest/actions/workflows/release.yml/badge.svg)](https://github.com/hvrcharon1/paynest/actions/workflows/release.yml)
  ![License](https://img.shields.io/badge/license-MIT-7C3AED)
</div>

---

## What PayNest does

PayNest is a single place to manage **how** you pay and **what** you pay.

- **Payment methods** — add cards, bank accounts, and wallets, and mark one as default.
- **Connected services** — link any external bill to a payment method: loans, rent, water, electricity, internet, health insurance, dental insurance, car insurance, traffic citations, school fees, paying back a friend, vehicle rentals, or anything else billed on a recurring schedule.
- **Autopay scheduling** — set a due day, a frequency (weekly, biweekly, monthly, quarterly, annually, or one-time), and how many days ahead you want a heads-up.
- **Notifications** — see upcoming and overdue payments at a glance, with a notification feed for due-soon and overdue items.
- **AI insights** — a payment-health score, category spend breakdown, a 6-month spend forecast, anomaly/cash-flow-risk callouts, and a natural-language assistant you can ask things like *"when's my next rent payment?"*.

> **This is a product demo.** All data lives in your browser's `localStorage` — there is no backend, no real bank connection, and no money actually moves. See [Wiring up real integrations](#wiring-up-real-integrations) for what a production version would need.

## Screens

| Page | Purpose |
|---|---|
| **Dashboard** | Payment-health ring, monthly spend, autopay coverage, upcoming payments, top AI insights |
| **Payment Methods** | Add/remove cards, bank accounts, and wallets; set a default |
| **Services** | Connect external bills, filter by category, toggle autopay, pause, or mark paid |
| **Calendar** | Month view of every due date, with a day-by-day agenda |
| **Analytics** | Spend-by-category chart, 6-month forecast, full insight list |
| **AI Assistant** | Chat-style Q&A over your bills, plus a live insight feed |
| **Settings** | Reset demo data, clear notifications, app info |

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** with a custom design system (see tokens below)
- **Zustand** for state, persisted to `localStorage`
- **Recharts** for the spend breakdown and forecast charts
- **React Router** for navigation
- **lucide-react** for icons

## Design system

| Token | Value |
|---|---|
| Background | `#0A0E1A` |
| Surface | `#111827` |
| Elevated | `#1A2234` |
| Brand (violet) | `#7C3AED` / light `#8B5CF6` |
| Success | `#059669` / light `#34D399` |
| Warning | `#D97706` / light `#FBBF24` |
| Danger | `#DC2626` / light `#F87171` |
| Display type | Plus Jakarta Sans |
| Body type | Inter |

The signature visual is the **payment health ring** on the dashboard — an animated circular score with an outer arc showing your category mix, so the shape of your bills is visible at a glance.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and produce a production build in dist/
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Requires Node.js 18+.

## Project structure

```
src/
  components/
    ui/          # Button, Card, Badge, Modal, Field, Switch
    layout/      # Sidebar, Topbar, MobileNav, AppShell
    dashboard/   # PaymentHealthRing, StatCard, UpcomingList
    payments/    # PaymentMethodCard, AddPaymentMethodModal
    services/    # ServiceCard, AddServiceModal, CategoryFilter
    calendar/    # MonthGrid
    analytics/   # CategoryBreakdownChart, ForecastChart
    ai/          # InsightCard, ChatPanel
  pages/         # one file per route
  store/         # Zustand store (the single source of truth)
  lib/           # ai.ts (forecasting/insights), categories, utils, format
  data/          # seed/demo data
  types/         # shared TypeScript types
```

## Wiring up real integrations

To turn this into a working product, three things would need to move server-side:

1. **Bank/card connectivity** — a provider like Plaid, Stripe, or a card network's tokenization API to actually hold and charge payment methods. None of that exists here; `PaymentMethod` records are display-only.
2. **Provider integrations** — lenders, utilities, insurers, and municipalities don't share a common API. Real autopay needs either (a) the provider's own bill-pay/ACH API where available, or (b) the user's bank's bill-pay rails. `ExternalService` here is just a schedule PayNest tracks locally.
3. **Scheduled autopay execution + real notifications** — a backend job (cron/queue) to actually trigger payments on the due date and send email/SMS/push notifications, replacing the in-app notification list.

The **AI layer** (`src/lib/ai.ts`) is written as a swappable provider: `generateInsights`, `buildForecast`, and `answerLocalQuery` currently run as local heuristics so the app works with zero backend. To use real Claude API calls instead, replace `answerLocalQuery` with a call to `/v1/messages` (e.g. `claude-sonnet-4-6`) from a small backend proxy that holds the API key, passing the user's service list as context — the function signatures stay the same, only the implementation changes.

## CI/CD

- **`.github/workflows/ci.yml`** — runs on every push and pull request to `main`: install, lint, typecheck, build, and upload the build as an artifact.
- **`.github/workflows/release.yml`** — runs on any tag matching `v*.*.*`: builds, zips `dist/`, and publishes a GitHub release with auto-generated notes.

To cut a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT — see [LICENSE](LICENSE).
