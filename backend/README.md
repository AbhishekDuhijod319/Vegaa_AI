# Vegaa AI Server

Express.js + MongoDB backend for the Vegaa AI Travel Planner.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Express.js** | HTTP server & routing |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication (access + refresh tokens) |
| **Joi** | Input validation |
| **node-cache** | Server-side API caching |
| **Gemini AI** | AI trip generation (proxied) |
| **Pexels / Google Places / OpenWeather** | API proxies |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Fill in MONGODB_URI, JWT secrets, and API keys

# 3. Start development server (auto-restart on changes)
npm run dev

# 4. Verify
curl http://localhost:5000/api/health
```

## Project Structure

```
Vegaa_AI_Server/
├── src/
│   ├── config/          ← DB connection, env validation, CORS
│   ├── models/          ← Mongoose schemas (User, Trip, RefreshToken)
│   ├── repositories/    ← Data access layer (abstracts Mongoose)
│   ├── middleware/       ← Auth, rate limiting, validation, errors
│   ├── routes/          ← Express route definitions
│   ├── controllers/     ← Request handlers (thin layer)
│   ├── services/        ← Business logic (auth, AI, images, etc.)
│   ├── utils/           ← Cache, logger, helpers
│   └── app.js           ← Express app setup
├── server.js            ← Entry point
├── .env.example         ← Environment template
└── package.json
```

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | ❌ | Register with email + password |
| POST | `/api/auth/login` | ❌ | Login with email + password |
| POST | `/api/auth/google` | ❌ | Login with Google OAuth token |
| POST | `/api/auth/refresh` | 🍪 | Refresh access token (uses httpOnly cookie) |
| POST | `/api/auth/logout` | 🍪 | Logout (clears refresh token) |
| GET | `/api/auth/me` | 🔒 | Get current user profile |

### Trips
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/trips` | 🔒 | Create a trip |
| GET | `/api/trips` | 🔒 | List user's trips (summaries only) |
| GET | `/api/trips/:id` | ❌ | Get full trip (public for shared links) |
| PUT | `/api/trips/:id` | 🔒 | Update trip (ownership enforced) |
| DELETE | `/api/trips/:id` | 🔒 | Delete trip (ownership enforced) |
| GET | `/api/trips/stats` | 🔒 | Get user trip statistics |

### AI
| Method | Path | Auth | Rate Limit | Description |
|--------|------|:----:|:----------:|-------------|
| POST | `/api/ai/generate-trip` | 🔒 | 10/hr | Generate trip itinerary via Gemini |

### Proxy APIs (server-side cached)
| Method | Path | Cache TTL | Description |
|--------|------|:---------:|-------------|
| GET | `/api/images/search?q=paris` | 24h | Pexels image search |
| GET | `/api/places/suggestions?q=tokyo` | 1h | Google Places autocomplete |
| GET | `/api/places/details?place_id=...` | 1h | Google Places details |
| GET | `/api/places/search?q=hotels+paris` | 1h | Google Places text search |
| GET | `/api/weather?city=london` | 15min | OpenWeather current weather |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status, DB connection, cache stats |

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | ❌ | Access token lifetime (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | ❌ | Refresh token lifetime (default: `7d`) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `GEMINI_API_KEY` | ❌ | Google Gemini AI API key |
| `PEXELS_API_KEY` | ❌ | Pexels image search API key |
| `GOOGLE_PLACES_API_KEY` | ❌ | Google Places API key |
| `OPENWEATHER_API_KEY` | ❌ | OpenWeather API key |
| `PORT` | ❌ | Server port (default: `5000`) |
| `NODE_ENV` | ❌ | `development` / `production` |
| `CLIENT_URL` | ❌ | Frontend URL for CORS (default: `http://localhost:5173`) |

## Database Schema

### User
- `email` (unique, indexed) — Login email
- `name` — Display name
- `passwordHash` — Bcrypt hash (null for Google-only users)
- `authProvider` — `email` or `google`
- `googleId` — Google sub ID (sparse index)
- `role` — `user` or `admin`
- `preferences` — `{ defaultCurrency, theme }`

### Trip
- `userId` (indexed, ref: User) — Owner
- `destination` (text indexed) — Destination name
- `userSelection` — User's form inputs
- `tripData` — Large AI-generated itinerary blob
- `coverPhotoUrl` — Trip cover image
- Compound index: `{ userId, createdAt: -1 }` for fast "my trips" queries

### RefreshToken
- `token` (unique) — Refresh token string
- `expiresAt` — TTL index (auto-deleted by MongoDB)

## Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** (point to this folder)
4. Add all environment variables from `.env.example`
5. Deploy!

## Security Features

- ✅ JWT authentication with access/refresh token rotation
- ✅ httpOnly cookies for refresh tokens (XSS-proof)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Per-user rate limiting on all endpoints
- ✅ Joi input validation on all write endpoints
- ✅ Helmet security headers
- ✅ Strict CORS whitelist
- ✅ Trip ownership enforcement (server-side)
- ✅ Global error handler (no stack traces in production)
