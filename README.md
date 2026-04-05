# Vegaa AI — AI-Powered Travel Planner

An intelligent travel planning application that uses Google Gemini AI to generate personalized trip itineraries, with a React frontend and Express.js backend.

## Architecture

```
┌─────────────────────────┐
│     React Frontend      │ → Vercel
│   (frontend/)           │
└──────────┬──────────────┘
           │ API calls + JWT Bearer token
           ▼
┌─────────────────────────┐
│   Express Backend       │ → Render
│   (backend/)            │
│   ├── Auth (JWT)        │
│   ├── Trip CRUD         │
│   ├── Gemini AI proxy   │
│   ├── Pexels proxy      │
│   ├── Places proxy      │
│   └── Weather proxy     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   MongoDB Atlas (M0)    │ → Cloud (free)
└─────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 7, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, Mongoose, JWT, Joi |
| **Database** | MongoDB Atlas (M0 free tier) |
| **AI** | Google Gemini 2.5 Pro |
| **Images** | Pexels API (server-side cached) |
| **Auth** | JWT (access + refresh tokens) + Google OAuth |

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env    # Fill in MongoDB URI, JWT secrets, API keys
npm run dev             # Starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Set VITE_API_URL=http://localhost:5000/api in .env.local
npm run dev             # Starts on http://localhost:5173
```

## Project Structure

```
Vegaa_AI/
├── frontend/                    ← React Application
│   ├── src/
│   │   ├── api/                 ← Backend communication (axios + JWT)
│   │   ├── auth/                ← Login / Signup page
│   │   ├── components/          ← UI components (Header, Footer, etc.)
│   │   ├── contexts/            ← AuthContext (React context)
│   │   ├── create-trip/         ← Trip creation form
│   │   ├── edit-trip/           ← Trip editing
│   │   ├── view-trip/           ← Trip detail view
│   │   ├── my-trips/            ← User trip list
│   │   ├── profile/             ← User profile
│   │   ├── about/               ← About page
│   │   ├── constants/           ← UI styles, options
│   │   ├── services/            ← Trip service (data orchestration)
│   │   ├── lib/                 ← Hooks, utilities
│   │   ├── App.jsx              ← Home page
│   │   └── main.jsx             ← Router + providers
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     ← Express API Server
│   ├── src/
│   │   ├── config/              ← DB, env, CORS config
│   │   ├── models/              ← Mongoose schemas
│   │   ├── repositories/        ← Data access layer
│   │   ├── middleware/           ← Auth, rate limit, validation
│   │   ├── routes/              ← API route definitions
│   │   ├── controllers/         ← Request handlers
│   │   ├── services/            ← Business logic
│   │   ├── utils/               ← Cache, logger, helpers
│   │   └── app.js               ← Express app setup
│   ├── server.js                ← Entry point
│   ├── package.json
│   └── .env.example
│
└── README.md                    ← This file
```

## Security Features

- ✅ All API keys server-side only (zero keys in frontend bundle)
- ✅ JWT authentication with access + refresh token rotation
- ✅ httpOnly cookies for refresh tokens (XSS-proof)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Per-user rate limiting on all endpoints
- ✅ Joi input validation
- ✅ Helmet security headers + strict CORS
- ✅ Trip ownership enforcement (server-side)
- ✅ Server-side API caching (Images: 24h, Places: 1h, Weather: 15min)

## API Endpoints

See [backend/README.md](backend/README.md) for full API documentation.

## Deployment

| Component | Platform | Guide |
|-----------|----------|-------|
| Frontend | [Vercel](https://vercel.com) | Set `VITE_API_URL` to deployed backend URL |
| Backend | [Render](https://render.com) | Set all env vars from `.env.example` |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) | M0 free tier, whitelist IPs |

## License

MIT
