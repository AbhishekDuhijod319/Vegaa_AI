# Vegaa AI — Frontend

AI-powered travel planning application built with React, Vite, and Tailwind CSS.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **React Router v6** | Client-side routing |
| **Framer Motion** | Animations |
| **Radix UI** | Accessible UI primitives |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local
# Set VITE_API_URL and VITE_GOOGLE_AUTH_CLIENT_ID

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173
```

> **Note:** The frontend requires the [Vegaa AI Server](../Vegaa_AI_Server) running separately for API calls.

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_GOOGLE_AUTH_CLIENT_ID` | ✅ | Google OAuth Client ID for sign-in |

That's it — **zero API keys** in the frontend. All external APIs are proxied through the backend.

## Project Structure

```
Vegaa_AI/
├── public/               ← Static assets (logo.svg)
├── src/
│   ├── api/              ← Backend communication (axios + JWT interceptor)
│   ├── auth/             ← Login/signup page
│   ├── components/
│   │   ├── custom/       ← App-specific components (Header, Footer, Hero, About)
│   │   ├── ui/           ← Reusable UI (Button, Input, Dialog, SmartImage)
│   │   └── misc/         ← ErrorBoundary
│   ├── constants/        ← UI styles, currency/transport options
│   ├── contexts/         ← AuthContext (React context)
│   ├── create-trip/      ← Trip creation form
│   ├── edit-trip/        ← Trip editing form
│   ├── hooks/            ← Custom React hooks
│   ├── lib/              ← Utilities (cn(), pexels cache)
│   ├── my-trips/         ← Trip list page
│   ├── profile/          ← User profile page
│   ├── services/         ← Business logic services
│   ├── view-trip/        ← Trip detail view with 11 section components
│   ├── App.jsx           ← Home page (hero, destinations, FAQ)
│   ├── main.jsx          ← Router, providers, entry point
│   └── index.css         ← Global styles + CSS variables
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json           ← SPA rewrite rule for Vercel
```

## Pages

| Route | Component | Auth | Description |
|-------|-----------|:----:|-------------|
| `/` | `App.jsx` | ❌ | Landing page with hero, destinations, FAQ |
| `/about` | `AboutPage` | ❌ | About us, mentors, methodology |
| `/auth` | `AuthPage` | ❌ | Login / Register |
| `/create-trip` | `CreateTrip` | 🔒 | AI-powered trip creation form |
| `/view-trip/:id` | `ViewTrip` | ❌ | Trip detail view (shareable) |
| `/edit-trip/:id` | `EditTrip` | 🔒 | Edit existing trip |
| `/my-trips` | `MyTrips` | 🔒 | User's trip list |
| `/profile` | `Profile` | 🔒 | User profile & stats |

## Design System

- **Typography:** Montserrat + Inter + Great Vibes (script)
- **Colors:** CSS custom properties with Radix UI color system
- **Effects:** Glassmorphism, spring physics, backdrop blur
- **Layout:** Responsive bento grids, iOS-inspired styling
- **Animations:** Framer Motion entrance animations, hover micro-interactions

## Deployment (Vercel)

1. Connect your GitHub repo on [Vercel](https://vercel.com)
2. Framework: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variables
6. Deploy!

The `vercel.json` already includes SPA rewrite rules for client-side routing.

## Architecture

```
┌─────────────────────────┐
│     React Frontend      │ ← Vercel
│   (this project)        │
└──────────┬──────────────┘
           │ fetch() + JWT Bearer token
           ▼
┌─────────────────────────┐
│   Express Backend       │ ← Render
│   (Vegaa_AI_Server)     │
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
│   MongoDB Atlas (M0)    │ ← Cloud (free)
└─────────────────────────┘
```
