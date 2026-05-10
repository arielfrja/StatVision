# StatVision 🏀✨

**AI-Powered Basketball Analytics Platform**

StatVision transforms raw game footage into professional-grade box scores and play-by-play insights using computer vision and the power of Google's Gemini AI.

---

## 🚀 Key Links
- **Product Strategy:** [docs/product/STRATEGY.md](docs/product/STRATEGY.md)
- **Master Roadmap:** [docs/product/MASTER_ROADMAP.md](docs/product/MASTER_ROADMAP.md)
- **Technical Architecture:** [docs/technical/SAD.md](docs/technical/SAD.md)
- **Project History:** [docs/PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md)
- **API Documentation:** `http://localhost:3000/api-docs` (when running locally)

---

## 🌟 Core Features
- **AI-Powered Event Detection:** Automated tracking of shots, rebounds, assists, fouls, and more.
- **Human-in-the-Loop Verification:** Seamlessly map AI-detected jersey numbers to your official roster.
- **Interactive Dashboard:** Chronological play-by-play feed synced with video playback.
- **Advanced Analytics:** Auto-calculated efficiency metrics like eFG% and TS%.
- **Secure Monorepo:** Next.js frontend, Express API, and a decoupled video worker.

---

## 🛠 Technology Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Material Web.
- **Backend:** Node.js, Express, TypeORM, PostgreSQL (Supabase).
- **Worker:** Node.js, FFmpeg, Google Cloud Pub/Sub.
- **AI:** Google Gemini 3 (gemini-3.1-flash).

---

## 📖 Documentation Structure
We maintain a clean documentation hierarchy in the `docs/` directory:
- **`docs/product/`**: Strategy, roadmaps, and requirements.
- **`docs/technical/`**: Architecture, database schema, and infrastructure.
- **`docs/archive/`**: Historical notes and briefs.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- FFmpeg installed in PATH.
- Google Cloud Project with Gemini & Pub/Sub enabled.

### Quick Start
We provide master scripts in the `scripts/` directory for unified control:

- **Build everything (Production):** `npm run master:build`
- **Run all services (Development/Debug):** `npm run master:run`
- **Start all services (Production - Requires Build):** `npm run master:start`
- **Clean restart everything:** `npm run master:restart`

*Note: `master:run` uses `ts-node` for live development, while `master:start` runs the compiled JavaScript from the `build` folders.*

---

## ☁️ Deployment
Automated via GitHub Actions to:
- **Firebase Hosting** (Frontend)
- **Google Cloud Run** (Backend API & Worker)
