# Vegaa AI — Frontend

React-based frontend for the Vegaa AI Travel Planner.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **React Router v6** | Client-side routing |
| **Framer Motion** | Animations |
| **Axios** | API communication |
| **Radix UI** | Accessible UI primitives |
| **Lucide React** | Icons |

## Quick Start

```bash
npm install
npm run dev     # http://localhost:5173
```

> Requires the backend running at `http://localhost:5000`. See [../backend/README.md](../backend/README.md).

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_GOOGLE_AUTH_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `VITE_GOOGLE_PLACES_API_KEY` | ✅ | Google Places API key (browser-side autocomplete widget) |

**Only 3 env vars.** All other external APIs (Gemini, Pexels, OpenWeather) are proxied through the backend with zero keys in the frontend bundle.

## Pages

| Route | Auth | Description |
|-------|:----:|-------------|
| `/` | ❌ | Landing (hero, destinations, FAQ) |
| `/about` | ❌ | About us |
| `/auth` | ❌ | Login / Register |
| `/view-trip/:id` | ❌ | Trip detail (shareable) |
| `/create-trip` | 🔒 | AI trip creation |
| `/edit-trip/:id` | 🔒 | Edit trip |
| `/my-trips` | 🔒 | User's trips |
| `/profile` | 🔒 | User profile |

## Key Architecture Decisions

- **AuthContext** — Central auth state via React Context. Access token in memory, refresh token in httpOnly cookie.
- **API Client** (`src/api/client.js`) — Axios instance with auto JWT attachment and silent token refresh on 401.
- **ProtectedRoute** — Redirects unauthenticated users to `/auth?redirect=...` and redirects back after login.
- **No Firebase** — All auth and data flows through the Express backend.

## Build

```bash
npm run build   # Output: dist/
```
