# CarbonTrack

🌍 CarbonTrack is an intelligent, high-performance platform designed to help individuals and organizations measure and reduce their environmental impact through a mix of advanced AI and engaging gamification.

Built with Next.js 15 (App Router), CarbonTrack provides real-time emission monitoring, personalized AI-powered tips, image-based CO2 estimation, and gamified experiences to keep users motivated.

---

## Table of Contents

- [Key Features](#key-features)
- [Demo / Screenshots](#demo--screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Install & Run Locally](#install--run-locally)
- [Development](#development)
- [Production & Deployment](#production--deployment)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Key Features

- 🤖 AI-Driven Analysis  
  - Automatic emission estimation from receipts and images (image-based CO2 estimation).
  - Personalized reduction tips powered by Google Gemini and additional AI services.
- 🎮 Gamified Sustainability  
  - Daily quests, achievements, points and global leaderboards to drive engagement.
- 📊 Visual Analytics  
  - Real-time carbon tracking across transportation, energy, and food with interactive charts and "tree-equivalent" metrics.
- 🛍️ Rewards Marketplace  
  - Gamified shop to spend points on profile customization, digital badges and other incentives.
- 🏢 Scalable Tracking  
  - Support for individual, company, and city-level footprint monitoring.
- 🔐 Auth & Security  
  - Secure authentication flows (Better Auth) and role-based features for organizations.

---

## Demo / Screenshots

(Replace with actual screenshots or a demo link.)

- Dashboard with real-time carbon meters
- Quest and leaderboard screens
- Receipt / image upload and AI estimation workflows
- Rewards marketplace and profile customization

---

## Tech Stack

- Framework: Next.js 15 (App Router)
- Styling & Animations: Tailwind CSS 4, GSAP, Framer Motion, Three.js
- AI: Google Gemini API, Hugging Face
- Database: MongoDB with Mongoose
- Auth: Better Auth
- UI: Radix UI & Recharts
- Language composition: JavaScript (primary), TypeScript (selected modules), CSS

---

## Getting Started

### Prerequisites

- Node.js (>= 18 recommended)
- pnpm, npm, or yarn
- MongoDB (Atlas or self-hosted)
- API keys for Google Gemini / HuggingFace (if using AI features)

### Environment Variables

Create a `.env.local` file in the project root and add the variables your app requires. Example names and purposes:

- MONGODB_URI - MongoDB connection string
- NEXT_PUBLIC_APP_URL - Public URL for the app (e.g., https://your-app.vercel.app)
- GOOGLE_GEMINI_API_KEY - API key/credential for Google Gemini integration
- HUGGINGFACE_API_KEY - API key for Hugging Face endpoints
- NEXT_PUBLIC_MAPS_API_KEY - (optional) Maps / location features
- NEXTAUTH_URL - URL used by auth provider (if relevant)
- JWT_SECRET - Secret used for session/JWT signing (if applicable)
- NEXT_PUBLIC_ENV - e.g., development | production

Note: Replace variable names above with the exact keys your code expects. If you're unsure, search the repository for `process.env.` usages.

### Install & Run Locally

Using pnpm (recommended):

```bash
git clone https://github.com/Alok1515/carbon-Tracker.git
cd carbon-Tracker
pnpm install
cp .env.example .env.local     # if there's an example env file
# set required environment variables in .env.local
pnpm dev
```

Using npm:

```bash
npm install
npm run dev
```

Common npm scripts (examples — check your package.json):

- dev — Run the development server (Next.js)
- build — Build for production
- start — Start the production server
- lint — Run linters
- test — Run tests

---

## Development

- Branching: Use feature branches named like `feat/<short-description>` or `fix/<short-description>`.
- Pull Requests: Open PRs against `main` (or the repo's default branch) with a description of changes and testing notes.
- Tests & Lint: Add and run unit/integration tests for new features; keep linters green.

Tips:
- Use storybook or a component sandbox for UI components when available.
- Keep AI calls abstracted behind service modules for easier testing and mocking.

---

## Production & Deployment

Recommended deployment: Vercel (first-class support for Next.js). Other options: Netlify, Render, Docker on cloud providers.

Steps for Vercel:
1. Connect the repository to Vercel.
2. Set environment variables in the Vercel dashboard (matching your .env keys).
3. Configure build command (default: `pnpm build` or `npm run build`) and output dir as required by Next.js.
4. Deploy.

Scaling notes:
- Use MongoDB Atlas for managed scaling and backups.
- Offload heavy AI/image processing jobs to background workers or serverless functions to keep the web tier responsive.
- Cache frequent queries and computed metrics where possible.

---

## Architecture Overview

- Next.js App Router handles server components and client components where appropriate.
- API routes (or server handlers) integrate with:
  - MongoDB via Mongoose for data persistence
  - AI services (Google Gemini / Hugging Face) for inference and analysis
  - Image upload and processing pipeline (thumbnailing, estimation)
- Gamification layer: points, quests, achievements, and marketplace backed by transactional updates in the DB.
- Realtime leaderboard updates may use a combination of caching (Redis) and periodic aggregation jobs.

---

## Roadmap

Planned/possible next steps:
- Multi-tenant support and advanced org-level reporting
- Offline/edge inference to reduce API costs
- More AI models and explainability features
- Deeper integrations with carbon offset providers and verified projects

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Run tests and linters locally
4. Open a PR with a clear description, screenshots and any migration steps

Please follow the repository's code style and commit message conventions.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgements

Thanks to the open-source projects and tools used in this project, including Next.js, Tailwind CSS, GSAP, Framer Motion, Three.js, Radix UI, Recharts, Mongoose, Google Gemini, Hugging Face, and the MongoDB community.

---

## Contact

Project owner: Alok (GitHub: @Alok1515)

For questions, feature requests, or security issues, please open an issue on the repository.
