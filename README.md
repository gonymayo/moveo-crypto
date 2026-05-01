# Moveo Crypto Advisor

A personalized AI-powered crypto investor dashboard built as a take-home assignment for Moveo.

## Live Demo

- **Frontend:** [https://moveo-crypto.vercel.app](https://moveo-crypto.vercel.app)
- **Backend:** [https://moveo-crypto-server.onrender.com](https://moveo-crypto-server.onrender.com)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Deployment | Vercel (client) + Render (server + DB) |

---

## External APIs

| Section | API |
|---|---|
| Coin Prices | [CoinGecko v3](https://www.coingecko.com/en/api) — free tier |
| Market News | [CoinTelegraph RSS](https://cointelegraph.com/rss) — free, no API key required |
| AI Insight | [OpenRouter](https://openrouter.ai/) — free tier (Google Gemma 3 27B) |
| Crypto Memes | Reddit JSON API (`r/CryptoCurrency`) — no auth required |

---

## Project Structure

```
moveo-crypto/
  client/    ← React frontend
  server/    ← Express backend
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 22 LTS
- PostgreSQL 15+ running locally (or a Render/Supabase connection string)

### 1. Clone & install

```bash
git clone https://github.com/<you>/moveo-crypto.git
cd moveo-crypto

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Fill in your values (see .env.example for descriptions)

# Client
cp client/.env.example client/.env
```

### 3. Run database migrations

```bash
cd server
npm run db:migrate
```

### 4. Start development servers

```bash
# Terminal 1 — backend (port 3000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

---

## Database Access

Render PostgreSQL dashboard credentials are provided separately in the submission form.

---

## AI Tools Used

This project was built with assistance from **Cursor** (AI coding assistant):

- Scaffolded the monorepo structure and all config files
- Drafted the Prisma schema and Express route skeletons
- Helped write the JWT middleware and Prisma query logic
- Suggested the OpenRouter prompt template for the AI Insight section
- Reviewed component structure and Tailwind class choices

All generated code was reviewed, understood, and adjusted by me before committing.

---

## Bonus: ML Feedback Loop Design

See [`FEEDBACK_LOOP.md`](./FEEDBACK_LOOP.md) for a write-up on how the stored vote data
could be used to train or fine-tune a recommendation model in the future.
