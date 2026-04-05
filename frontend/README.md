<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-12.x-FF0055?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<h1 align="center">🌍 Vegaa AI — Frontend</h1>

<p align="center">
  <strong>A premium React SPA for AI-powered travel planning.</strong><br/>
  iOS-inspired glassmorphism UI · Google OAuth · Real-time trip generation · Responsive design
</p>

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Application Architecture](#-application-architecture)
- [Pages & Routes](#-pages--routes)
- [Components Hierarchy](#-components-hierarchy)
- [API Integration Layer](#-api-integration-layer)
- [Authentication System](#-authentication-system)
- [State Management](#-state-management)
- [Trip Generation Flow](#-trip-generation-flow)
- [UI/UX Design System](#-uiux-design-system)
- [Image Handling](#-image-handling)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Build & Deployment](#-build--deployment)

---

## ✨ Features Overview

| Feature | Description |
|:---|:---|
| 🤖 **AI Trip Generation** | Generate complete travel itineraries using Google Gemini AI |
| 🗺 **Smart Destination Search** | Google Places autocomplete for city selection |
| 📸 **Dynamic Imagery** | Pexels-powered photos for destinations, hotels, restaurants |
| 🌤 **Live Weather** | Real-time weather data for trip destinations |
| ✏️ **Trip Editing** | Modify AI-generated plans with a full editing interface |
| 👤 **User Profiles** | Personal dashboard with trip statistics |
| 🔗 **Shareable Trips** | Public trip links for sharing with friends |
| 📱 **Responsive Design** | Mobile-first, works beautifully on all screen sizes |
| 🎨 **Premium Aesthetics** | Glassmorphism, spring animations, parallax carousels |
| 🔐 **Dual Auth** | Email/password + Google OAuth sign-in |
| ⚡ **Code Splitting** | Lazy-loaded routes for fast initial page load |

---

## 🧰 Tech Stack

| Category | Technology | Purpose |
|:---|:---|:---|
| **UI Library** | React 18.2 | Component-based UI with hooks |
| **Build Tool** | Vite 7.x | Lightning-fast HMR & optimized builds |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS framework |
| **Animations** | Framer Motion 12.x | Spring physics & layout animations |
| **Routing** | React Router 6.x | SPA routing with lazy loading |
| **HTTP Client** | Axios | API communication with interceptors |
| **Auth** | @react-oauth/google | Google OAuth 2.0 integration |
| **UI Primitives** | Radix UI | Accessible dialog, switch components |
| **Icons** | Lucide React + React Icons | Comprehensive icon library |
| **Date Handling** | date-fns, React DatePicker | Date formatting & picker UI |
| **Toasts** | Sonner | Beautiful notification system |
| **CSS Utilities** | clsx, tailwind-merge, class-variance-authority | Conditional & variant-based class merging |

---

## 📁 Project Structure

```
frontend/
├── index.html                   # HTML entry point
├── vite.config.js               # Vite config with @ alias & chunk splitting
├── tailwind.config.js           # Tailwind theme customization
├── postcss.config.js            # PostCSS plugins
├── vercel.json                  # Vercel deployment config
├── package.json                 # Dependencies & scripts
│
├── public/                      # Static assets
│   └── hero/                    # Fallback hero images
│
└── src/
    ├── main.jsx                 # App entry — router, providers, layout
    ├── App.jsx                  # Landing page (Hero, Destinations, FAQ)
    ├── App.css                  # App-level styles
    ├── index.css                # Global styles & CSS variables
    │
    ├── api/                     # ← Backend API client layer
    │   ├── client.js            #    Axios instance + token interceptors
    │   ├── auth.js              #    Auth API (login, register, google, refresh)
    │   ├── trips.js             #    Trip CRUD API
    │   ├── ai.js                #    AI generation API
    │   ├── images.js            #    Image search API
    │   ├── places.js            #    Places autocomplete & search API
    │   └── weather.js           #    Weather API
    │
    ├── contexts/
    │   └── AuthContext.jsx      # Global auth state (user, tokens, login/logout)
    │
    ├── services/
    │   └── tripService.js       # Trip generation orchestrator + data normalization
    │
    ├── components/
    │   ├── custom/              # App-specific composed components
    │   │   ├── Header.jsx       #    App header with nav, auth buttons, avatar
    │   │   ├── Footer.jsx       #    Site footer with links & branding
    │   │   ├── Hero.jsx         #    Landing page hero section
    │   │   ├── About.jsx        #    About page content (bento grid)
    │   │   ├── Contact.jsx      #    Contact form component
    │   │   ├── HomeCarousel.jsx  #    Image carousel for landing
    │   │   └── header/          #    Header sub-components
    │   │
    │   ├── ui/                  # Reusable UI primitives
    │   │   ├── SmartImage.jsx   #    Image component with Pexels fallback + caching
    │   │   ├── button.jsx       #    Button with CVA variants
    │   │   ├── input.jsx        #    Styled input component
    │   │   ├── dialog.jsx       #    Radix Dialog wrapper
    │   │   ├── calendar.jsx     #    Date picker calendar
    │   │   └── calendar-range.jsx   # Date range picker
    │   │
    │   ├── layout/
    │   │   └── ProtectedRoute.jsx   # Auth gate — redirects unauthenticated users
    │   │
    │   └── misc/
    │       └── ErrorBoundary.jsx    # React error boundary with fallback UI
    │
    ├── auth/
    │   └── index.jsx            # Auth page (login/register forms + Google OAuth)
    │
    ├── create-trip/
    │   └── index.jsx            # Trip creation wizard (multi-step form)
    │
    ├── view-trip/
    │   ├── [tripId]/
    │   │   └── index.jsx        # Full trip viewer (all sections)
    │   └── components/
    │       ├── InfoSection.jsx  #    Trip overview & summary
    │       ├── Hotels.jsx       #    Hotel recommendations
    │       ├── Restaurants.jsx  #    Restaurant recommendations
    │       ├── PlacesToVisit.jsx #   Places of interest
    │       ├── Markets.jsx      #    Local markets
    │       ├── Neighbourhoods.jsx#   Area guides
    │       ├── GettingAround.jsx #   Transportation guide
    │       ├── LocalEssentials.jsx # Safety, money, emergency info
    │       ├── SuggestedDayTrips.jsx # Nearby excursions
    │       ├── Extras.jsx       #    Rainy day, nightlife, family-friendly
    │       └── SectionNav.jsx   #    Scrollspy navigation sidebar
    │
    ├── edit-trip/
    │   └── [tripId]/
    │       └── index.jsx        # Trip editor (modify itinerary, activities)
    │
    ├── my-trips/
    │   └── index.jsx            # User's saved trips grid with search
    │
    ├── profile/
    │   └── index.jsx            # User profile with stats dashboard
    │
    ├── about/
    │   └── index.jsx            # About Us page (vision, methodology, mentors)
    │
    ├── lib/
    │   ├── utils.js             # clsx + tailwind-merge utility function
    │   ├── imageService.js      # Client-side image caching & URL handling
    │   └── useImageLuminance.js # Hook: analyze image brightness for text contrast
    │
    ├── constants/               # Static data constants
    └── utils/                   # General utility functions
```

---

## 🏗 Application Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     Provider Layer                                │ │
│  │  GoogleOAuthProvider → AuthProvider → ErrorBoundary → Router      │ │
│  └──────────────────────────────────┬───────────────────────────────┘ │
│                                     │                                 │
│  ┌──────────────────────────────────┴───────────────────────────────┐ │
│  │                     Layout Layer                                  │ │
│  │  Header ─── ScrollManager ─── Suspense(PageLoader) ─── Footer    │ │
│  └──────────────────────────────────┬───────────────────────────────┘ │
│                                     │                                 │
│  ┌──────────────────────────────────┴───────────────────────────────┐ │
│  │                     Page Layer (Lazy Loaded)                      │ │
│  │  App · Auth · CreateTrip · ViewTrip · EditTrip · MyTrips · ...   │ │
│  └──────────────────────────────────┬───────────────────────────────┘ │
│                                     │                                 │
│  ┌──────────────────────────────────┴───────────────────────────────┐ │
│  │                     Service Layer                                 │ │
│  │  tripService.js ──── API Client Layer (api/*.js)                  │ │
│  └──────────────────────────────────┬───────────────────────────────┘ │
│                                     │                                 │
│                          Axios + Interceptors                         │
│                          (Token Refresh Queue)                        │
└──────────────────────────────,──────┴──────────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │  Backend API       │
                    │  /api/*            │
                    └────────────────────┘
```

---

## 🗺 Pages & Routes

| Route | Component | Auth | Description |
|:---|:---|:---:|:---|
| `/` | `App.jsx` | ❌ | Landing page with hero, destinations carousel, how-it-works, FAQ |
| `/auth` | `AuthPage` | ❌ | Login / Register page with email + Google OAuth |
| `/create-trip` | `CreateTrip` | 🔒 | Multi-step trip creation wizard |
| `/view-trip/:tripId` | `ViewTrip` | ❌ | Full trip details viewer (public — shareable links) |
| `/edit-trip/:tripId` | `EditTrip` | 🔒 | Edit existing trip itinerary |
| `/my-trips` | `MyTrips` | 🔒 | Grid of user's saved trips |
| `/profile` | `Profile` | 🔒 | User profile & trip statistics |
| `/about` | `AboutPage` | ❌ | About Us — vision, methodology, mentors (bento grid layout) |

> **Legend:** 🔒 = Wrapped in `<ProtectedRoute>` — redirects to `/auth` if unauthenticated

### Route Protection Flow

```
User navigates to /create-trip
         │
         ▼
  ProtectedRoute checks
  AuthContext.isAuthenticated
         │
    ┌────┴────┐
    │ Yes     │ No
    ▼         ▼
 Render    Navigate to
 Page      /auth page
```

---

## 🧩 Components Hierarchy

```
main.jsx
├── GoogleOAuthProvider
│   └── AuthProvider
│       └── ErrorBoundary
│           └── RouterProvider
│               └── Layout
│                   ├── Header
│                   │   ├── Logo
│                   │   ├── Navigation Links
│                   │   ├── Auth Buttons / User Avatar
│                   │   └── Mobile Menu (Sheet)
│                   │
│                   ├── ScrollManager
│                   │
│                   ├── Suspense → PageLoader
│                   │   └── [Page Component]
│                   │       ├── App (Landing)
│                   │       │   ├── Hero
│                   │       │   ├── DestinationsSection (3D tilt cards carousel)
│                   │       │   ├── HowItWorksSections (SmartImage + text)
│                   │       │   └── FaqSection (iOS-style grouped list)
│                   │       │
│                   │       ├── CreateTrip
│                   │       │   ├── Destination Picker (Google Places)
│                   │       │   ├── Date Range Picker
│                   │       │   ├── Budget & Currency Selector
│                   │       │   ├── Traveler Count
│                   │       │   └── Transport Mode Selector
│                   │       │
│                   │       └── ViewTrip
│                   │           ├── SectionNav (Scrollspy sidebar)
│                   │           ├── InfoSection
│                   │           ├── Hotels
│                   │           ├── Restaurants
│                   │           ├── PlacesToVisit
│                   │           ├── Markets
│                   │           ├── Neighbourhoods
│                   │           ├── GettingAround
│                   │           ├── LocalEssentials
│                   │           ├── SuggestedDayTrips
│                   │           └── Extras
│                   │
│                   └── Footer
│
└── Toaster (Sonner — toast notifications)
```

---

## 🔌 API Integration Layer

The frontend communicates with the backend exclusively through the **`api/`** module. All API calls are proxied through the Express backend — the frontend never calls third-party APIs directly.

### API Client Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       api/client.js                               │
│                                                                   │
│  Axios Instance                                                   │
│  ├── baseURL: VITE_API_URL || localhost:5000/api                 │
│  ├── withCredentials: true  (sends httpOnly cookies)             │
│  │                                                                │
│  ├── Request Interceptor                                          │
│  │   └── Attaches `Authorization: Bearer <token>` header         │
│  │                                                                │
│  └── Response Interceptor (401 Handler)                           │
│      ├── If 401 & not already retrying:                           │
│      │   ├── POST /auth/refresh → get new access token           │
│      │   ├── Retry original request with new token               │
│      │   └── Process queued requests                              │
│      └── If refresh fails:                                        │
│          ├── Clear access token                                   │
│          └── Dispatch 'auth:expired' event → AuthContext logout   │
│                                                                   │
│  Token Queue:                                                     │
│  ├── Multiple 401s during refresh? Queued, not duplicated.       │
│  ├── All queued requests retry with fresh token                   │
│  └── Race condition: impossible (single isRefreshing flag)        │
└──────────────────────────────────────────────────────────────────┘
```

### API Module Map

| Module | Functions | Backend Route | Purpose |
|:---|:---|:---|:---|
| **`api/auth.js`** | `register`, `login`, `googleLogin`, `refresh`, `logout`, `getProfile` | `/api/auth/*` | User authentication |
| **`api/trips.js`** | `create`, `list`, `getById`, `update`, `delete`, `getStats` | `/api/trips/*` | Trip CRUD operations |
| **`api/ai.js`** | `generateTrip` | `/api/ai/generate-trip` | AI itinerary generation |
| **`api/images.js`** | `search` | `/api/images/search` | Pexels image search |
| **`api/places.js`** | `suggestions`, `details`, `search` | `/api/places/*` | Google Places autocomplete |
| **`api/weather.js`** | `getWeather` | `/api/weather` | Current weather data |

### Where Each API Is Used

| API Call | Used In | Trigger |
|:---|:---|:---|
| `authApi.login()` | `AuthContext` / Auth page | User submits login form |
| `authApi.register()` | `AuthContext` / Auth page | User submits register form |
| `authApi.googleLogin()` | `AuthContext` | Google OAuth callback |
| `authApi.refresh()` | `AuthContext` (init), `client.js` (interceptor) | App mount, 401 response |
| `authApi.logout()` | `AuthContext` | User clicks logout |
| `authApi.getProfile()` | Profile page | Page load |
| `aiApi.generateTrip()` | `tripService.js` → Create Trip page | User submits trip form |
| `tripApi.create()` | `tripService.js` → Create Trip page | After AI generation completes |
| `tripApi.list()` | My Trips page | Page load |
| `tripApi.getById()` | View Trip page | Page load with `:tripId` |
| `tripApi.update()` | Edit Trip page | User saves changes |
| `tripApi.delete()` | My Trips page | User deletes a trip |
| `tripApi.getStats()` | Profile page | Page load |
| `imageApi.search()` | `App.jsx` (hero), `SmartImage` component | Hero load, image rendering |
| `placesApi.suggestions()` | Create Trip page (destination picker) | User types destination |
| `placesApi.search()` | View Trip (place cards) | Viewing a place |
| `weatherApi.getWeather()` | View Trip page | Page load |

---

## 🔐 Authentication System

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AuthContext.jsx                             │
│                                                                  │
│  State:                                                          │
│  ├── user: Object | null       (current user profile)           │
│  ├── isAuthenticated: boolean  (derived from !!user)            │
│  └── isLoading: boolean        (true until initial auth check)  │
│                                                                  │
│  Actions:                                                        │
│  ├── login({ email, password })                                  │
│  ├── register({ name, email, password })                         │
│  ├── googleLogin(googleAccessToken)                              │
│  ├── logout()                                                    │
│  └── updateUser(partialUpdates)                                  │
│                                                                  │
│  On Mount:                                                       │
│  └── Calls authApi.refresh() silently                            │
│      ├── Success → Sets user + accessToken (session restored)   │
│      └── Failure → user = null (not logged in, expected)        │
│                                                                  │
│  Event Listener:                                                 │
│  └── 'auth:expired' → Clears state (triggered by 401 handler)  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Lifecycle

| Token | Storage | Lifetime | Purpose |
|:---|:---|:---:|:---|
| **Access Token** | JavaScript memory (`client.js`) | 15 min | Authenticates API requests |
| **Refresh Token** | httpOnly cookie (set by backend) | 7 days | Issues new access tokens |

> **Security note:** The access token is never stored in `localStorage` or `sessionStorage` — it lives only in memory. This prevents XSS attacks from stealing credentials.

---

## 📦 State Management

The app uses **React Context + hooks** for state management — no Redux or external state library.

| Context | Scope | Manages |
|:---|:---|:---|
| `AuthContext` | Global (entire app) | User state, authentication, tokens |
| `AppContext` | Landing page only | Hero image, FAQ state, navigation actions |

Page-level state is managed with local `useState` / `useReducer` hooks within each page component.

---

## 🤖 Trip Generation Flow

The end-to-end flow from user input to a saved trip:

```
┌─────────────────────── CREATE TRIP FLOW ────────────────────────┐
│                                                                  │
│  1. USER fills Create Trip form                                  │
│     ├── Destination (Google Places autocomplete)                 │
│     ├── Start Location                                           │
│     ├── Date Range (start + end)                                 │
│     ├── Budget + Currency                                        │
│     ├── Number of Travelers                                      │
│     └── Transport Mode                                           │
│                                                                  │
│  2. tripService.generateTrip() orchestrates:                     │
│     │                                                            │
│     ├── a) aiApi.generateTrip(params)                            │
│     │      → POST /api/ai/generate-trip                          │
│     │      → Backend sends prompt to Gemini 2.5 Flash            │
│     │      → Returns structured JSON itinerary                   │
│     │                                                            │
│     ├── b) normalizeTripData(rawAI)                              │
│     │      → Ensures all fields exist (arrays, objects)          │
│     │      → Handles missing/malformed AI responses              │
│     │      → Falls back to buildFallbackTrip() if needed         │
│     │                                                            │
│     ├── c) imageApi.search(destination, 1)                       │
│     │      → GET /api/images/search?q=Paris&per_page=1           │
│     │      → Gets cover photo for the trip                       │
│     │                                                            │
│     └── d) Returns { tripData, docId, enrichedFormData,          │
│            coverPhotoUrl }                                        │
│                                                                  │
│  3. tripService.saveAiTrip()                                     │
│     └── tripApi.create({ userSelection, tripData, coverPhoto })  │
│         → POST /api/trips                                        │
│         → Saved to MongoDB                                       │
│                                                                  │
│  4. Navigate to /view-trip/:tripId                               │
│     └── Full itinerary rendered with dynamic images              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Trip Data Structure (AI Output)

```
tripData
├── tripSummary         { title, description, totalDays, travelers, budget }
├── hotels[]            { name, address, priceRange, rating, description, image_query }
├── itinerary[]         { day, title, activities[] { time, activity, location, ... } }
├── restaurants[]       { name, cuisine, priceRange, rating, address, mustTry }
├── placesToVisit[]     { name, description, bestTime, entryFee, timeNeeded }
├── suggestedDayTrips[] { name, distance, description, highlights[] }
├── neighbourhoods[]    { name, vibe, bestFor, description }
├── markets[]           { name, type, bestFor, timings }
├── localEssentials     { emergency, currency, language, transportation, tips[] }
├── gettingAround       { overview, options[] { mode, details, cost } }
└── extras              { packingTips[], bestTimeToVisit, localCustoms[], usefulApps[] }
```

---

## 🎨 UI/UX Design System

### Design Philosophy

The UI draws heavy inspiration from **iOS/Apple's Human Interface Guidelines**:

| Principle | Implementation |
|:---|:---|
| **Glassmorphism** | Frosted glass backgrounds with `backdrop-blur`, semi-transparent borders |
| **Spring Physics** | Framer Motion spring animations on cards & hover states |
| **Depth & Layers** | Multiple shadow levels (subtle → elevated → deep) |
| **Micro-animations** | Scale-on-hover, 3D tilt on destination cards, smooth transitions |
| **Responsive Typography** | Fluid font sizes that scale with viewport |
| **Dark Mode Ready** | CSS variables for light/dark theme switching |

### Component Patterns

| Pattern | Used In |
|:---|:---|
| **3D Tilt Cards** | Destinations carousel (perspective + rotateXY) |
| **Infinite Loop Carousel** | Destinations (triple-buffer trick for seamless looping) |
| **iOS Grouped List** | FAQ section (rounded corners, separators, expand/collapse) |
| **Bento Grid** | About page (mixed-size cards in responsive grid) |
| **Scrollspy Navigation** | View Trip page (highlights active section) |
| **Smart Image** | Throughout — caches Pexels API results, shows loading skeleton |

---

## 🖼 Image Handling

### SmartImage Component

The `SmartImage` component is a core UI primitive that handles all image rendering:

```
SmartImage receives `query` prop
         │
         ▼
   Check in-memory imageCache
         │
    ┌────┴────┐
    │ Hit     │ Miss
    ▼         ▼
  Render    Call imageApi.search(query)
  cached      │
  URL         ▼
           Store in imageCache
           Render image URL
              │
              ▼
         On load error?
           │
      ┌────┴────┐
      │ Yes     │ No
      ▼         ▼
   Show gray   Display
   placeholder  image
```

### Image Luminance Hook

`useImageLuminance(url)` — Analyzes the brightness of a hero image to determine whether to use light or dark text for overlay content. Uses canvas pixel sampling.

---

## 🔧 Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# ─── Required ──────────────────────────────
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_AUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# ─── Optional ──────────────────────────────
VITE_APP_NAME=Vegaa AI
```

| Variable | Required | Description |
|:---|:---:|:---|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_GOOGLE_AUTH_CLIENT_ID` | ✅ | Google OAuth 2.0 client ID |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Backend server** running (see [Backend README](../backend/README.md))

### Installation

```bash
# 1. Navigate to frontend directory
cd Vegaa_AI/frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Edit .env.local with your values

# 4. Start development server
npm run dev

# 5. Open http://localhost:5173
```

### Available Scripts

| Script | Command | Description |
|:---|:---|:---|
| `dev` | `vite` | Dev server with HMR (port 5173) |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Run ESLint on all files |

---

## 🌐 Build & Deployment

### Vercel Deployment

The frontend is configured for **Vercel** deployment:

**`vercel.json`:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

This enables client-side routing — all paths are served by `index.html`.

### Build Optimization

The Vite config includes intelligent chunk splitting:

| Chunk | Contents | Rationale |
|:---|:---|:---|
| `vendor` | All `node_modules` (except Firebase) | Single vendor chunk for caching |
| `vendor-firebase` | Firebase SDK | Isolated — large, no React deps |
| Route chunks | Lazy-loaded pages | Only loaded when navigated to |

### Deployment Checklist

- [x] `VITE_API_URL` points to production backend
- [x] `VITE_GOOGLE_AUTH_CLIENT_ID` configured
- [x] Backend CORS whitelist includes frontend domain
- [x] `vercel.json` rewrite rules in place
- [x] Production build passes: `npm run build`

---

## 📐 Code Conventions

| Convention | Details |
|:---|:---|
| **File naming** | PascalCase for components (`Header.jsx`), camelCase for utilities (`tripService.js`) |
| **Imports** | `@/` alias resolves to `src/` directory |
| **API calls** | Always through `api/*.js` modules — never raw `fetch` or direct `axios` |
| **State** | React Context for global state, local hooks for page/component state |
| **Error handling** | `ErrorBoundary` at root, `try/catch` in services, toast notifications for user-facing errors |
| **Code splitting** | All page components are `lazy()` loaded |

---

<p align="center">
  <sub>Built with ❤️ by the Vegaa AI Team</sub>
</p>
