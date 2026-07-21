# DevBrand — AI Powered Personal Branding Platform for Developers

> Your code deserves to be seen. DevBrand watches your GitHub, LeetCode, and Codeforces activity, detects milestones the moment they happen, and drafts authentic social media posts automatically.

---

## 🚀 Features

- **Milestone Detection** — Auto-detects Codeforces rank upgrades, LeetCode streaks, GitHub star milestones
- **AI Content Generator** — Generates 3 A/B post variants using Gemini AI with tone/audience control
- **Engagement Scorer** — Rates every post 1–10 before publishing with actionable improvement tips
- **Smart Scheduler** — Bull.js + Redis job queue with exponential backoff retry logic
- **Analytics Dashboard** — GitHub-style activity heatmap, platform breakdown charts, AI weekly digest
- **Chrome Extension** — Highlight any text on any page → turn it into a scheduled social post instantly

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js (ESM) |
| Database | MongoDB Atlas (free M0) |
| Job Queue | Bull.js + Upstash Redis (free) |
| AI | Google Gemini 1.5 Flash (free tier) |
| Tracking | Codeforces API, LeetCode GraphQL, GitHub API |
| Auth | JWT access + refresh token rotation |
| Deployment | Render (backend), Vercel (frontend) |

---

## 📁 Project Structure

```
devbrand/
├── server/          # Express backend
│   ├── config/      # DB and Redis connections
│   ├── controllers/ # Route handlers
│   ├── middleware/  # Auth, error handler
│   ├── models/      # Mongoose schemas
│   ├── queues/      # Bull.js queue + worker
│   ├── routes/      # API routes
│   └── services/    # Gemini, CF, LC, GH, Twitter, LinkedIn
├── client/          # React frontend
│   └── src/
│       ├── pages/   # Dashboard, CreatePost, Calendar, Analytics, Accounts, Milestones
│       ├── context/ # Auth context
│       └── services/# Axios instance with token refresh
└── extension/       # Chrome Extension (Manifest V3)
    ├── background/  # Service worker + context menu
    ├── content/     # Content script
    └── popup/       # Extension popup UI
```

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Upstash Redis account (free)
- Google AI Studio account for Gemini API key (free)

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

Copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=any_long_random_string
JWT_REFRESH_SECRET=another_long_random_string
REDIS_URL=redis://default:...@....upstash.io:...
GEMINI_API_KEY=your_gemini_api_key
ENCRYPTION_KEY=exactly_32_characters_here!!!!!!
CLIENT_URL=http://localhost:5173

# Optional (for posting to social media)
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_CALLBACK_URL=http://localhost:5000/api/accounts/twitter/callback
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/accounts/linkedin/callback
```

### 3. Run Locally

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🔑 Getting Free API Keys

| Service | Where | Notes |
|---|---|---|
| Gemini API | https://aistudio.google.com/app/apikey | Free, generous limits |
| MongoDB Atlas | https://cloud.mongodb.com | Free M0 cluster |
| Upstash Redis | https://upstash.com | Free 10k commands/day |
| GitHub API | No key needed | Public repos/users are free |
| Codeforces API | No key needed | Fully public |
| LeetCode | No key needed | Unofficial public GraphQL |
| Twitter API | https://developer.twitter.com | Free Basic tier |
| LinkedIn API | https://developer.linkedin.com | Free for personal apps |

---

## 🌐 Deployment (Free)

### Backend → Render

1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, set root directory to `server`
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add all `.env` variables in the Render dashboard
7. Add Upstash Redis URL as `REDIS_URL`

### Frontend → Vercel

1. Go to https://vercel.com → New Project
2. Connect your repo, set root directory to `client`
3. Add `VITE_API_URL=https://your-render-url.onrender.com` if needed
4. Deploy

### Chrome Extension (Local)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Update `API_BASE` in `background/background.js` to your Render URL

---

## 🏆 Milestone Detection

DevBrand automatically detects and drafts posts for:

**Codeforces**
- Rank upgrades: Newbie → Pupil → Specialist → Expert → Candidate Master → Master → Grandmaster
- New personal best rating after a contest
- First ever rated contest participation
- 100, 500 problems solved

**LeetCode**
- 50, 100, 250, 500, 1000 problems solved
- 7, 30, 100-day streaks

**GitHub**
- Repository crossing 10, 50, 100 stars
- New repository created
- First open source PR merged

---

## 📊 Architecture Highlights

**Why Bull.js + Redis instead of setTimeout?**
A naive `setTimeout` approach loses all scheduled jobs when the server restarts. Bull.js persists jobs in Redis, so even if the server crashes and restarts, every scheduled post will still publish at the correct time. Failed jobs retry automatically with exponential backoff (5s → 25s → 125s) before marking as failed.

**Why Gemini instead of OpenAI?**
Gemini 1.5 Flash has a generous free tier with no credit card required, making this project truly zero-cost to build and demo.

**Milestone detection frequency**
The cron job runs every 2 hours to check all users' connected profiles against stored stats. Only genuine changes (new rank, new problem count milestone) trigger a draft — no spam.

---

## 📝 Resume Bullets

> Built an AI-powered developer personal branding platform using MERN stack that auto-detects Codeforces rank upgrades, LeetCode milestones, and GitHub achievements via background cron jobs, drafting social media posts using Gemini AI with A/B variant generation and engagement scoring.

> Implemented a Bull.js + Redis job queue for reliable post scheduling with exponential backoff retry logic, ensuring zero post loss across server restarts; deployed backend on Render and frontend on Vercel at zero cost.

> Developed a Chrome Extension (Manifest V3) enabling users to highlight any text on any webpage and schedule it as a social media post instantly, without opening the main platform.
