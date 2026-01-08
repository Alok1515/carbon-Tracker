# CarbonTrack

A modern, high-performance web platform for logging, tracking, and reducing carbon emissions — built with Next.js 15 (App Router), TypeScript and Bun. CarbonTrack combines realtime analytics, AI-driven insights, computer vision, gamification and social features to help individuals, organizations, and cities measure and reduce their environmental impact.

- Real-time carbon monitoring across Transportation, Energy, Food, and Waste
- Interactive visualizations and global leaderboards
- AI summaries, chatbot and image-based emission estimation
- Gamified quests, rewards and achievement system
- Hybrid database architecture for scale and edge performance

---

Table of Contents
- [Demo / Screenshots](#demo--screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
- [Database & Services Setup](#database--services-setup)
- [Deployment](#deployment)
- [Environment & Performance Notes](#environment--performance-notes)
- [Testing & Linting](#testing--linting)
- [Contributing](#contributing)
- [Security](#security)
- [License & Acknowledgements](#license--acknowledgements)
- [Contact](#contact)

---


Features

Core Tracking & Analytics
- Log emissions for Transportation, Energy, Food and Waste
- Recharts-powered interactive graphs and historical comparisons
- "Tree-equivalent" conversion for intuitive impact visualization
- Dashboards for individual users, companies and cities

AI Features
- Google Gemini for natural language summaries & chatbot
- Hugging Face image models to estimate emissions from receipts/items
- OpenRouter as a secondary LLM access layer
- Object detection to flag carbon-heavy activities from images.

Gamification & Rewards
- Daily rotating quests and Quest Points (QP)
- Badge/achievement tiers and a rewards shop
- Global leaderboards and social feed

Infrastructure & UX
- Next.js 15 (App Router) with Turbopack
- Bun runtime & package manager
- Tailwind CSS 4 + Shadcn (Radix) components
- GSAP / Framer Motion / react-three-fiber for animations & 3D globe
- Better Auth (Google OAuth + credentials) for secure auth
- MongoDB (Mongoose) + Turso (LibSQL) hybrid DB approach
- Stripe integration available for subscriptions/shop

---

Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Runtime / Package Manager: Bun
- Styling: Tailwind CSS 4
- Components: Radix via Shadcn UI
- Charts: Recharts
- 3D: Three.js via React Three Fiber
- Animations: GSAP, Framer Motion
- Icons: Lucide React
- Auth: Better Auth (Google OAuth + credentials)
- Primary DB: MongoDB (Mongoose)
- Edge DB: Turso (LibSQL)
- AI: Google Gemini, Hugging Face, OpenRouter
- Payments: Stripe
- Validation: Zod
- Forms: React Hook Form
- Notifications: Sonner

---

Architecture Overview

- Frontend (Next.js App Router): UI, routing, server & edge actions, API routes and renders.
- API / Server Logic: Server components + API routes for integrations, auth, and data processing.
- Databases:
  - MongoDB (Mongoose) — canonical user records, logs, long-term historical data.
  - Turso (LibSQL) — edge-optimized datasets and high-performance reads.
- AI Layer: Requests to Google Gemini (primary) and OpenRouter (fallback) for natural language; Hugging Face for image-based models.
- Payments: Stripe webhooks & client integrations for subscriptions/shop purchases.

---

Getting Started

Prerequisites
- Bun (recommended) — https://bun.sh/
- Node 20+ (optional, if you prefer node/npm/yarn for certain tasks)
- A MongoDB instance (MongoDB Atlas recommended for quick setup)
- Turso account for edge DB
- API keys for Google Gemini, Hugging Face, OpenRouter and Stripe
- Better Auth configuration (or replace with NextAuth/your auth provider)
- Git

Installation

1. Clone the repo
```bash
git clone https://github.com/Alok1515/carbon-Track.git
cd carbon-Track
```

2. Install dependencies (Bun)
```bash
bun install
```

If you prefer npm/yarn (not recommended given Bun first-class support), adjust accordingly.

Environment Variables

Create a `.env.local` at the project root. Example vars (update names to match your implementation):

```
# MongoDB (Mongoose)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/carbontrack?retryWrites=true&w=majority

# Turso (Edge DB)
TURSO_DB_URL=<turso_db_url>
TURSO_API_KEY=<turso_api_key>

# Better Auth / OAuth
BETTER_AUTH_CLIENT_ID=<client_id>
BETTER_AUTH_CLIENT_SECRET=<client_secret>
NEXTAUTH_URL=http://localhost:3000

# AI & Models
GOOGLE_GEMINI_API_KEY=<google_gemini_key>
HUGGINGFACE_API_KEY=<huggingface_key>
OPENROUTER_API_KEY=<openrouter_key>

# Stripe
STRIPE_SECRET_KEY=<stripe_secret>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>

# App
NEXT_PUBLIC_MAPBOX_KEY=<mapbox_key_if_used>
NEXT_PUBLIC_ENVIRONMENT=development
```

Make sure to keep `.env.local` out of version control.

Local Development

Run the development server:

```bash
# start dev server
bun run dev

# or if package.json has a different script:
bun run start:dev
```

Typical scripts you may expect in package.json:
```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write ."
  }
}
```

Open http://localhost:3000

---

Database & Services Setup

MongoDB
- Use MongoDB Atlas for an easy managed database.
- Whitelist your dev IP or use SRV connection string.

Turso
- Create a Turso database and set the URL / key in your environment.
- Use for edge read patterns and datasets that require low-latency access.

AI Providers
- Google Gemini: configure API and quota on the Google Cloud console.
- Hugging Face: create an API token and enable the required models.
- OpenRouter: API key for fallback options.

Stripe
- Create a Stripe account, obtain keys and configure webhooks for production.

Auth
- Configure Better Auth (or your auth provider) credentials and redirect URLs (http://localhost:3000/api/auth/callback).

---

Deployment

Recommended hosts
- Vercel — best-first class support for Next.js
- Cloudflare Pages / Cloudflare Workers — for edge-first deployments
- Fly / Render — for Bun-first or custom runtime requirements

Guidelines
- Build with Turbopack where available (next build / turbopack flags).
- Add environment variables securely in your deployment provider.
- Configure webhook endpoints (Stripe) and secrets using provider's dashboard.
- For MongoDB, prefer a managed provider (Atlas) and ensure network access.

---

Environment & Performance Notes

- Bun provides improved install and runtime performance; ensure compatibility for any native node modules.
- Use Turso for edge-optimized datasets to minimize latency for global users.
- Cache AI responses where feasible to avoid repeated costs and latency.
- Use server components for heavy data-fetching pages and client components only where interactivity is needed.

---

Testing & Linting

- Linting: ESLint + TypeScript — run `bun run lint`
- Formatting: Prettier — run `bun run format`
- Tests: (Add test framework instructions here if implemented, e.g., Vitest/Playwright/Jest)

---

Contributing

We welcome contributions. To contribute:
1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Install dependencies and run pre-commit checks
4. Run tests/lint/format
5. Open a pull request describing changes and rationale

Please follow the existing code style and run linters before submitting PRs.

---

Security

- Do not commit secrets or API keys.
- Use environment variables and secret managers in deployments.
- Report security issues by opening an issue with sensitive details omitted; include contact instructions if required.

---

License & Acknowledgements

- License: (Add your chosen license here, e.g., MIT)
- Acknowledgements:
  - Next.js, Bun, Turbopack
  - Google Gemini, Hugging Face, OpenRouter
  - Tailwind, Shadcn UI & Radix, Recharts, Three.js
  - Inspired by community contributors and open-source projects

---

Contact

- Repository: https://github.com/Alok1515/carbon-Track
- Maintainer: Alok (GitHub: @Alok1515)
- For questions or help, open an issue or join the discussion in the repo.

---

Appendix — Helpful Commands

```
# Install
bun install

# Dev
bun run dev

# Build
bun run build

# Start (production)
bun run start

# Lint & format
bun run lint
bun run format
```

- Update environment variable names to match actual implementation files/config in this repo.
