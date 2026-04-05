<p align="center">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-D63AFF?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>

<h1 align="center">🛫 Vegaa AI — Backend API Server</h1>

<p align="center">
  <strong>A production-grade Express.js REST API powering the Vegaa AI Travel Planner.</strong><br/>
  AI-driven itinerary generation · JWT authentication with refresh-token rotation · Server-side caching · Rate limiting
</p>

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Entity-Relationship Diagram](#-entity-relationship-diagram)
- [Database Models](#-database-models)
- [API Reference](#-api-reference)
  - [Authentication](#1-authentication-apiauth)
  - [Trips](#2-trips-apitrips)
  - [AI Generation](#3-ai-generation-apiai)
  - [Images](#4-images-apiimages)
  - [Places](#5-places-apiplaces)
  - [Weather](#6-weather-apiweather)
  - [Health Check](#7-health-check)
- [Authentication Flow](#-authentication-flow)
- [Middleware Pipeline](#-middleware-pipeline)
- [Caching Strategy](#-caching-strategy)
- [Rate Limiting](#-rate-limiting)
- [Security Measures](#-security-measures)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)

---

## 🏗 Architecture Overview

The backend follows a clean **layered architecture** with strict separation of concerns:

```
  Client Request
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Global Middleware (Helmet, CORS, Morgan, Rate Limit) │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│              Route Layer (routes/*.routes.js)         │
│      Route definitions + validation schemas          │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│           Controller Layer (controllers/)             │
│     HTTP request/response handling — no biz logic    │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│            Service Layer (services/)                  │
│   Business logic, API integrations, data transforms  │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│          Repository Layer (repositories/)             │
│        Direct database queries via Mongoose          │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│               MongoDB Atlas (Cloud DB)               │
└──────────────────────────────────────────────────────┘
```

> **Why this matters:** Each layer has a single responsibility. Controllers never talk to the database directly. Services never touch `req` or `res`. Repositories are the only code with Mongoose queries — making the data layer trivially swappable.

---

## 🧰 Tech Stack

| Category | Technology | Purpose |
|:---|:---|:---|
| **Runtime** | Node.js 22+ | Server-side JavaScript |
| **Framework** | Express.js 4.x | HTTP server & routing |
| **Database** | MongoDB Atlas + Mongoose 8.x | Document store with ODM |
| **AI** | Google Gemini 2.5 Flash | AI trip itinerary generation |
| **Auth** | JWT (access + refresh) + bcryptjs | Stateless auth with token rotation |
| **Validation** | Joi 17.x | Request body schema validation |
| **Security** | Helmet, CORS, express-rate-limit | HTTP hardening, origin control, DDoS protection |
| **Caching** | node-cache | In-memory TTL cache for external API responses |
| **HTTP Client** | Axios | Outbound API calls (Google, Pexels, OpenWeather) |
| **Logging** | Morgan + custom logger | HTTP request logging + structured error logging |

---

## 📁 Project Structure

```
backend/
├── server.js                    # Entry point — connects DB & starts HTTP server
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables (git-ignored)
│
└── src/
    ├── app.js                   # Express app setup, middleware chain, route mounting
    │
    ├── config/
    │   ├── env.js               # Centralized env variable parsing & validation
    │   ├── db.js                # MongoDB connection with retry logic
    │   └── cors.js              # CORS whitelist configuration
    │
    ├── models/
    │   ├── User.js              # User schema (email/Google auth, roles, prefs)
    │   ├── Trip.js              # Trip schema (user selection, AI-generated data)
    │   └── RefreshToken.js      # Refresh token schema (auto-expiry via TTL index)
    │
    ├── repositories/
    │   ├── userRepository.js    # User DB queries (find, create, update)
    │   └── tripRepository.js    # Trip DB queries (CRUD, stats, pagination)
    │
    ├── services/
    │   ├── auth.service.js      # Registration, login, Google OAuth, token rotation
    │   ├── trip.service.js      # Trip CRUD orchestration
    │   ├── ai.service.js        # Gemini AI prompt engineering & response parsing
    │   ├── image.service.js     # Pexels API proxy with caching
    │   ├── places.service.js    # Google Places API (autocomplete, details, search)
    │   └── weather.service.js   # OpenWeather API proxy with caching
    │
    ├── controllers/
    │   ├── auth.controller.js   # Auth endpoints (register, login, refresh, logout)
    │   ├── trip.controller.js   # Trip endpoints (CRUD, stats)
    │   ├── ai.controller.js     # AI generation endpoint
    │   ├── image.controller.js  # Image search endpoint
    │   ├── places.controller.js # Place autocomplete & details endpoints
    │   └── weather.controller.js# Weather lookup endpoint
    │
    ├── routes/
    │   ├── auth.routes.js       # POST /register, /login, /google, /refresh, /logout; GET /me
    │   ├── trip.routes.js       # POST /, GET /, GET /:id, PUT /:id, DELETE /:id, GET /stats
    │   ├── ai.routes.js         # POST /generate-trip
    │   ├── image.routes.js      # GET /search
    │   ├── places.routes.js     # GET /suggestions, /details, /search
    │   └── weather.routes.js    # GET /
    │
    ├── middleware/
    │   ├── auth.js              # JWT verification (authenticate, optionalAuth, authorize)
    │   ├── validate.js          # Joi schema validation middleware + all schemas
    │   ├── rateLimit.js         # Rate limiter configs (auth, AI, API, image)
    │   └── errorHandler.js      # Global error handler (Mongoose, JWT, CORS, generic)
    │
    └── utils/
        ├── cache.js             # NodeCache instances + generic getOrFetch helper
        ├── helpers.js           # asyncHandler wrapper for route error propagation
        └── logger.js            # Structured logging utility (info, warn, error, debug)
```

---

## 🗃 Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String email UK
        String name
        String picture
        String passwordHash
        String authProvider "email | google"
        String googleId UK
        String role "user | admin"
        Date lastLoginAt
        Object preferences
        Date createdAt
        Date updatedAt
    }

    TRIP {
        ObjectId _id PK
        ObjectId userId FK
        String userEmail
        String destination
        String summary
        String status "draft | generated | archived"
        Object userSelection
        Mixed tripData
        String coverPhotoUrl
        Date createdAt
        Date updatedAt
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        ObjectId userId FK
        String token UK
        Date expiresAt "TTL index — auto-deletes"
        Date createdAt
    }

    USER ||--o{ TRIP : "creates"
    USER ||--o{ REFRESH_TOKEN : "has active"
```

### Index Strategy

| Collection | Index | Purpose |
|:---|:---|:---|
| `users` | `{ email: 1 }` (unique) | Fast login & duplicate detection |
| `users` | `{ googleId: 1 }` (sparse) | Google OAuth user lookup |
| `users` | `{ createdAt: -1 }` | Admin dashboards — newest first |
| `trips` | `{ userId: 1, createdAt: -1 }` (compound) | User's trips sorted by newest |
| `trips` | `{ destination: "text", summary: "text" }` | Full-text search across trips |
| `refresh_tokens` | `{ userId: 1 }` | Find all tokens for a user |
| `refresh_tokens` | `{ token: 1 }` (unique) | Token lookup on refresh |
| `refresh_tokens` | `{ expiresAt: 1 }` (TTL: 0s) | Auto-cleanup of expired tokens |

---

## 📊 Database Models

### User Model

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `email` | `String` | Required, unique, indexed | User's email (lowercase, trimmed) |
| `name` | `String` | Required, max 100 chars | Display name |
| `picture` | `String` | Default: `""` | Profile picture URL (from Google) |
| `passwordHash` | `String` | Default: `null` | bcrypt hash (null for Google-only users) |
| `authProvider` | `String` | Enum: `email`, `google` | Authentication method used |
| `googleId` | `String` | Sparse unique index | Google OAuth subject ID |
| `role` | `String` | Enum: `user`, `admin` | Role-based access control |
| `lastLoginAt` | `Date` | — | Last successful login timestamp |
| `preferences` | `Object` | — | `{ defaultCurrency, theme }` |

> **Security:** The `toSafeJSON()` instance method strips `passwordHash` and `__v` before serialization.

### Trip Model

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `userId` | `ObjectId` | Required, indexed, ref → User | Trip owner |
| `userEmail` | `String` | Required, indexed | Denormalized for fast queries |
| `destination` | `String` | Indexed | Destination label |
| `summary` | `String` | — | AI-generated trip summary |
| `status` | `String` | Enum: `draft`, `generated`, `archived` | Trip lifecycle state |
| `userSelection` | `Mixed` | — | User's form inputs (dates, budget, travelers, etc.) |
| `tripData` | `Mixed` | — | Full AI-generated itinerary (hotels, restaurants, etc.) |
| `coverPhotoUrl` | `String` | — | Pexels cover image URL |

### RefreshToken Model

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| `userId` | `ObjectId` | Required, indexed, ref → User | Token owner |
| `token` | `String` | Required, unique, indexed | 80-char hex refresh token |
| `expiresAt` | `Date` | TTL index (auto-delete) | Expiry timestamp |

---

## 📡 API Reference

> **Base URL:** `https://your-domain.com/api`

### 1. Authentication (`/api/auth`)

All auth endpoints (except `/me`) are rate-limited to **10 requests / 15 minutes**.

| Method | Endpoint | Auth | Body | Description |
|:---:|:---|:---:|:---|:---|
| `POST` | `/auth/register` | ❌ | `{ name, email, password }` | Register new user with email/password |
| `POST` | `/auth/login` | ❌ | `{ email, password }` | Login with email/password |
| `POST` | `/auth/google` | ❌ | `{ accessToken }` | Login/register via Google OAuth |
| `POST` | `/auth/refresh` | 🍪 | — | Rotate refresh token, get new access token |
| `POST` | `/auth/logout` | 🍪 | — | Invalidate refresh token, clear cookie |
| `GET` | `/auth/me` | 🔒 | — | Get current user profile |

**Response (Register/Login/Google/Refresh):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "",
    "authProvider": "email",
    "role": "user",
    "preferences": { "defaultCurrency": "INR", "theme": "light" }
  }
}
```

**Cookie:** `refreshToken` (httpOnly, secure, sameSite, 7-day expiry)

---

### 2. Trips (`/api/trips`)

All trip endpoints are rate-limited to **300 requests / hour**.

| Method | Endpoint | Auth | Body / Params | Description |
|:---:|:---|:---:|:---|:---|
| `POST` | `/trips` | 🔒 | `{ userSelection, tripData, coverPhotoUrl, summary }` | Save a new trip |
| `GET` | `/trips` | 🔒 | `?page=1&limit=20` | List user's trips (paginated, no `tripData` blob) |
| `GET` | `/trips/:id` | 🔓 | — | Get full trip by ID (public — for shareable links) |
| `PUT` | `/trips/:id` | 🔒 | Partial trip fields | Update trip (ownership enforced) |
| `DELETE` | `/trips/:id` | 🔒 | — | Delete trip (ownership enforced) |
| `GET` | `/trips/stats` | 🔒 | — | Get user's trip stats |

**Legend:** 🔒 = Requires `Bearer` token &nbsp;|&nbsp; 🔓 = Optional auth &nbsp;|&nbsp; 🍪 = Requires refresh cookie

**Response (List):**
```json
{
  "trips": [
    {
      "_id": "...",
      "destination": "Paris, France",
      "summary": "Trip to Paris, France",
      "status": "generated",
      "coverPhotoUrl": "https://images.pexels.com/...",
      "userSelection": { "startDate": "2025-07-01", "endDate": "2025-07-05", ... },
      "createdAt": "2025-06-15T12:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20
}
```

**Response (Stats):**
```json
{
  "stats": {
    "totalTrips": 12,
    "uniqueDestinations": 8,
    "destinations": ["Paris, France", "Tokyo, Japan", ...]
  }
}
```

---

### 3. AI Generation (`/api/ai`)

Rate-limited to **10 requests / hour** (expensive Gemini API calls).

| Method | Endpoint | Auth | Body | Description |
|:---:|:---|:---:|:---|:---|
| `POST` | `/ai/generate-trip` | 🔒 | See below | Generate AI travel itinerary |

**Request Body:**
```json
{
  "destination": "Paris, France",
  "startLocation": "Mumbai, India",
  "totalDays": 5,
  "travelers": 2,
  "budget": 150000,
  "currency": "INR",
  "transportMode": "flight",
  "startDate": "2025-07-01",
  "endDate": "2025-07-05"
}
```

**Response:** Rich JSON with `tripSummary`, `hotels[]`, `itinerary[]`, `restaurants[]`, `placesToVisit[]`, `suggestedDayTrips[]`, `neighbourhoods[]`, `markets[]`, `localEssentials`, `gettingAround`, `extras`.

**AI Pipeline:**
```
User Input → Joi Validation → Prompt Engineering → Gemini 2.5 Flash
                                                        │
                                                        ▼
                                              Raw Text Response
                                                        │
                                              ┌─────────┴─────────┐
                                              │ Multi-Strategy     │
                                              │ JSON Parser        │
                                              │ (4 fallbacks)      │
                                              └─────────┬─────────┘
                                                        │
                                                        ▼
                                              Structured Trip JSON
```

---

### 4. Images (`/api/images`)

Rate-limited to **500 requests / hour**. Responses are cached for **24 hours**.

| Method | Endpoint | Auth | Params | Description |
|:---:|:---|:---:|:---|:---|
| `GET` | `/images/search` | ❌ | `?q=paris&per_page=6` | Search Pexels for landscape photos |

---

### 5. Places (`/api/places`)

Rate-limited to **300 requests / hour**. Responses are cached for **1 hour**.

| Method | Endpoint | Auth | Params | Description |
|:---:|:---|:---:|:---|:---|
| `GET` | `/places/suggestions` | ❌ | `?q=par` | Autocomplete city suggestions (Google Places) |
| `GET` | `/places/details` | ❌ | `?place_id=ChIJ...` | Get place details (name, address, coords, rating) |
| `GET` | `/places/search` | ❌ | `?q=eiffel tower` | Text search for places |

---

### 6. Weather (`/api/weather`)

Rate-limited to **300 requests / hour**. Responses are cached for **15 minutes**.

| Method | Endpoint | Auth | Params | Description |
|:---:|:---|:---:|:---|:---|
| `GET` | `/weather` | ❌ | `?city=paris` | Current weather data (OpenWeather) |

---

### 7. Health Check

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/health` | Server status, uptime, DB state, cache stats |

```json
{
  "status": "ok",
  "uptime": 86400,
  "timestamp": "2025-07-01T12:00:00Z",
  "db": "connected",
  "cache": {
    "images": { "hits": 1250, "misses": 80 },
    "places": { "hits": 340, "misses": 45 },
    "weather": { "hits": 200, "misses": 30 }
  }
}
```

---

## 🔐 Authentication Flow

The system uses a **dual-token strategy** with **refresh token rotation** for maximum security:

```
┌─────────────────────────────── LOGIN FLOW ──────────────────────────────┐
│                                                                         │
│  Client                          Server                      Database   │
│    │                               │                            │       │
│    │── POST /auth/login ──────────▶│                            │       │
│    │   { email, password }         │                            │       │
│    │                               │── Find user by email ─────▶│       │
│    │                               │◀── User document ──────────│       │
│    │                               │                            │       │
│    │                               │── bcrypt.compare() ────────│       │
│    │                               │                            │       │
│    │                               │── Generate access token    │       │
│    │                               │   (JWT, 15min expiry)      │       │
│    │                               │                            │       │
│    │                               │── Generate refresh token   │       │
│    │                               │   (random 80-char hex)     │       │
│    │                               │── Store in RefreshToken ──▶│       │
│    │                               │                            │       │
│    │◀── 200 { accessToken, user }──│                            │       │
│    │   + Set-Cookie: refreshToken  │                            │       │
│    │   (httpOnly, secure, 7d)      │                            │       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────── TOKEN REFRESH FLOW ────────────────────────────┐
│                                                                         │
│  Client                          Server                      Database   │
│    │                               │                            │       │
│    │── POST /auth/refresh ────────▶│                            │       │
│    │   Cookie: refreshToken=abc    │                            │       │
│    │                               │── Find token "abc" ───────▶│       │
│    │                               │◀── Token document ─────────│       │
│    │                               │                            │       │
│    │                               │── Validate expiry          │       │
│    │                               │── DELETE old token ────────▶│      │
│    │                               │── Generate NEW pair        │       │
│    │                               │── Store NEW refresh ───────▶│      │
│    │                               │                            │       │
│    │◀── 200 { accessToken, user }──│                            │       │
│    │   + Set-Cookie: refreshToken  │                            │       │
│    │   (new token replaces old)    │                            │       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Google OAuth Flow
1. Frontend → Google OAuth consent → Google Access Token
2. Frontend sends `POST /auth/google { accessToken }`
3. Backend verifies token with `googleapis.com/oauth2/v3/userinfo`
4. Finds or creates user, issues JWT pair

---

## ⚙️ Middleware Pipeline

Every request passes through the following middleware chain (in order):

```
Request
  │
  ├── 1. helmet()              → Security headers (CSP, HSTS, X-Frame, etc.)
  ├── 2. cors(whitelist)       → Origin validation + credentials
  ├── 3. express.json(5mb)     → Body parser with size limit
  ├── 4. express.urlencoded()  → Form-encoded body parser
  ├── 5. cookieParser()        → Parse httpOnly cookies (refresh token)
  ├── 6. morgan('dev')         → HTTP request logging (skipped in test)
  │
  ├── 7. [Route-specific]
  │   ├── rateLimiter          → Per-route rate limiting
  │   ├── validate(schema)     → Joi body validation
  │   └── authenticate         → JWT verification + req.user injection
  │
  ├── 8. Controller → Service → Repository → MongoDB
  │
  ├── 9. 404 Handler           → Unknown routes
  └── 10. errorHandler         → Global error catch-all (MUST be last)
```

### Error Handler Categories

| Error Type | Status | Example |
|:---|:---:|:---|
| Joi Validation | `400` | Missing required field |
| Mongoose Validation | `400` | Schema constraint violation |
| Authentication | `401` | Invalid/expired token |
| Duplicate Key | `409` | Email already registered |
| CORS | `403` | Unauthorized origin |
| Rate Limit | `429` | Too many requests |
| Internal | `500` | Unhandled server error |

---

## 🗄 Caching Strategy

External API responses are cached in-memory to reduce latency and API costs:

| Cache | TTL | Check Period | Use Case |
|:---|:---:|:---:|:---|
| **Image Cache** | 24 hours | 1 hour | Pexels photo search results |
| **Places Cache** | 1 hour | 10 min | Google Places autocomplete & details |
| **Weather Cache** | 15 min | 5 min | OpenWeatherMap current weather |

All caches use the generic `getOrFetch(cache, key, fetchFn)` pattern:
```
Request → Cache Hit? → YES → Return cached data
                  │
                  NO → Fetch from external API → Store in cache → Return
```

---

## 🚦 Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|:---|:---:|:---:|:---|
| **Auth Limiter** | 15 min | 10 | `/auth/register`, `/auth/login`, `/auth/google` |
| **AI Limiter** | 1 hour | 10 | `/ai/generate-trip` |
| **API Limiter** | 1 hour | 300 | `/trips/*`, `/places/*`, `/weather` |
| **Image Limiter** | 1 hour | 500 | `/images/search` |

Key generator: `req.user?.userId || req.ip` — authenticated users get per-user limits; anonymous users are limited by IP.

---

## 🛡 Security Measures

| Measure | Implementation |
|:---|:---|
| **HTTP Security Headers** | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS Whitelist** | Only configured origins allowed; credentials enabled |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **JWT Best Practices** | Short-lived access tokens (15min), httpOnly refresh cookies |
| **Token Rotation** | Old refresh token deleted on every refresh |
| **Input Validation** | Joi schemas with `stripUnknown: true` |
| **Rate Limiting** | Tiered per-endpoint limits with standard headers |
| **Error Sanitization** | Production mode hides internal error details |
| **Cookie Security** | `httpOnly`, `secure`, `sameSite: none` (production) |
| **Ownership Enforcement** | Trip update/delete queries include `userId` filter |
| **TTL Auto-Cleanup** | Expired refresh tokens auto-deleted by MongoDB TTL index |

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ─── Required ──────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vegaa-ai
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# ─── Optional (features degrade gracefully) ─
GEMINI_API_KEY=your-gemini-api-key
PEXELS_API_KEY=your-pexels-api-key
GOOGLE_PLACES_API_KEY=your-google-places-key
OPENWEATHER_API_KEY=your-openweather-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# ─── Server Config ─────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ─── JWT Expiry (Optional — has defaults) ──
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

> **Note:** The server validates that `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are present on startup. Missing any will terminate the process with a clear error message.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 22
- **MongoDB Atlas** account (or local MongoDB)
- API keys for Gemini, Pexels, Google Places, OpenWeather (optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Vegaa_AI.git
cd Vegaa_AI/backend

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables section above)
cp .env.example .env
# Edit .env with your values

# 4. Start development server (with auto-reload)
npm run dev

# 5. Verify — visit http://localhost:5000/api/health
```

### Available Scripts

| Script | Command | Description |
|:---|:---|:---|
| `dev` | `node --watch server.js` | Development server with file watching |
| `start` | `node server.js` | Production server |

---

## 🌐 Deployment

The backend is designed for deployment on **Render** (or any Node.js PaaS):

1. Set all environment variables in the hosting platform's dashboard
2. Set `NODE_ENV=production`
3. Build command: `npm install`
4. Start command: `npm start`
5. Ensure MongoDB Atlas allows the hosting service's IPs

### Production Checklist

- [x] `NODE_ENV=production` — enables secure cookies, hides error details
- [x] Strong JWT secrets (≥32 random characters each)
- [x] MongoDB Atlas IP whitelist configured
- [x] All API keys set and valid
- [x] `CLIENT_URL` set to the production frontend URL
- [x] Health check configured: `GET /api/health`

---

<p align="center">
  <sub>Built with ❤️ by the Vegaa AI Team</sub>
</p>
