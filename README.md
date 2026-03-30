# Vegaa AI – Travel Planner (React + Vite)

An AI-assisted travel planner built with React and Vite. It helps users plan trips with curated destinations, places to visit, hotels, restaurants, neighbourhoods, markets, and extras. The app integrates external services (Pexels, Google Places or Mapbox, OpenWeather) to enrich content, and uses responsive, high-quality images for a polished UI.

## Project Overview

### Project Idea
Develop an intelligent, web-based travel planner that leverages AI to create **personalized itineraries**, dynamically adapting to **real-time weather conditions** and specific **budget constraints**.

### Objective
To build an efficient, user-friendly tool that optimizes travel planning and enhances the overall user experience by delivering instant, organized, and actionable travel schedules.

### Problem Statement
Traditional travel planning is time-consuming, fragmented, and lacks real-time updates. Users often struggle with budget management and rigid itineraries, leading to stress and suboptimal travel experiences.

### Target Audience
Individual travelers, students, backpackers, and budget-conscious users seeking efficient and cost-effective travel solutions.

### Deliverables
A responsive web application featuring:
- **User Authentication**: Secure login and profile management.
- **AI Itinerary Creation**: Custom trip generation based on user preferences.
- **Real-time Weather**: Integration with OpenWeather for accurate forecasts.
- **Budget-Aligned Recommendations**: Smart suggestions for hotels and activities that fit the user's financial plan.

### Limitations
- **Platform**: Initial focus is strictly on the web platform.
- **Scope**: Advanced autonomous booking agents and real-time group collaboration features are deferred to future development phases.

## Technologies Used

### Front-End
- **React.js**: Component-based UI architecture.
- **Tailwind CSS**: Utility-first styling for responsive design.
- **React Router DOM**: Client-side routing.
- **Vite**: Fast build tool and development server.
- **Framer Motion**: Smooth animations and transitions.

### Back-End
- **Firebase**: Backend-as-a-Service (BaaS) for authentication and hosting.
- **Firebase Firestore**: NoSQL cloud database for storing trip data and user profiles.

### APIs
- **Google Gemini 2.5 Pro**: Advanced AI model for generating personalized travel itineraries.
- **Google Places API**: Location data, autocomplete, and place details.
- **OpenWeatherMap API**: Real-time weather conditions and forecasts.
- **Pexels API**: High-quality, curated imagery for destinations.

### Libraries
- **Axios**: Promise-based HTTP client for API requests.
- **Lucide React**: Consistent and lightweight icon set.
- **Sonner**: Toast notifications for user feedback.

## Requirements

### Functional Requirements
- **User Authentication**: Secure Google sign-in integration.
- **Itinerary Management**: Create, view, and save detailed trip plans.
- **Weather Display**: Current conditions and forecasts for destinations.
- **Interactive Maps**: Integration with Google Maps for location visualization.

### Non-Functional Requirements
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices.
- **Performance**: Optimized image loading (SmartImage) and efficient API caching.
- **User Experience**: Intuitive interface with smooth transitions and error handling.
- **Reliability**: Robust error management for API failures (90%+ uptime target).

## Features
- Popular destinations carousel with smooth snapping and pagination
- Trip “How it works” walkthrough with large responsive visuals
- View-trip pages: attractions, hotels, restaurants, markets, neighbourhoods, extras
- My-trips overview with fast, optimized image loading
- High-resolution, responsive images via Pexels with accurate `srcset`
- Provider-switchable place search (Google Places or Mapbox)
- Basic weather integration (OpenWeather) for city conditions and forecast

## Getting Started

### Prerequisites
- Node.js 18+ (Vite 7 requires Node 18 or newer)
- npm 9+ (or compatible)

### Installation
```bash
git clone <your-repo-url>
cd Vegaa_AI
npm install
```

### Development
```bash
# Start the dev server
npm run dev

# Lint the project
npm run lint

# Preview a production build locally
npm run build
npm run preview
```

Open the app at `http://localhost:5174/` (the port may vary based on your setup).

## Configuration

Create a `.env` file at the project root and supply the following variables as needed:

```env
# Pexels API (for high-quality images)
VITE_PEXELS_API_KEY=your_pexels_api_key

# Place provider selection: "google" (default) or "mapbox"
VITE_PLACES_PROVIDER=google

# Google Places (used when provider is google)
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Mapbox (used when provider is mapbox)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# OpenWeather (optional; used for weather integrations)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

Notes:
- If `VITE_PLACES_PROVIDER=mapbox`, the app uses Mapbox Geocoding for text search and suggestions with a normalized output shape. Some rich fields (ratings, photos) are only available via Google Places.
- Pexels is used for responsive image loading with compression and accurate width-based `srcset` to provide crisp visuals on all devices.

### UI Configuration
- Header offset: The global CSS variable `--app-header-offset` controls scroll alignment under the fixed header. It uses a clamp-based value for fluid scaling. You can tune it in `src/index.css`.
- Image behavior: `SmartImage` uses `sizes`, `srcset`, compression, and can eagerly load high-priority images via `fetchpriority="high"`.

## Usage Examples

### SmartImage (Responsive, high-quality images)
```jsx
import SmartImage from "@/components/ui/SmartImage";

// Inside a component render:
<div className="relative rounded-2xl overflow-hidden border bg-card">
  <div className="w-full h-[50vh] md:h-[60vh]">
    <SmartImage
      query="Paris cityscape"
      alt="Paris"
      className="w-full h-full object-cover"
      pexelsFallback={true}
      sizes="(min-width: 768px) 50vw, 100vw"
      width={1200}
      height={800}
      fetchpriority="low"
    />
  </div>
}</div>
```

### Switching Place Provider
```env
VITE_PLACES_PROVIDER=mapbox
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
```

```js
// GlobalAPI automatically switches based on VITE_PLACES_PROVIDER
// google: rich fields (ratings, photos)
// mapbox: normalized basic fields (id, name, address, lat/lng)
```

### Fetching a Stable Pexels Image
```jsx
import { getStableFirstImageForQuery } from "@/lib/pexels";

useEffect(() => {
  let ignore = false;
  const load = async () => {
    const set = await getStableFirstImageForQuery("travel destination landscape");
    if (!ignore) {
      // set.src is the default URL; set.srcSet is the responsive candidates
      setHeroBgUrl(set.src);
    }
  };
  load();
  return () => { ignore = true; };
}, []);
```

## Project Structure
```
src/
  App.jsx              # Main application and sections (Hero, Destinations, How It Works, FAQ)
  index.css            # Global styles, CSS variables (including --app-header-offset)
  components/
    ui/SmartImage.jsx  # Responsive image component with Pexels fallback
  lib/
    pexels.js          # Pexels client, caching, responsive srcset helpers
    useImageLuminance.js
  view-trip/           # Trip-specific pages and components
  my-trips/            # User trips overview
```

## Contribution Guidelines
- Fork the repository and create a feature branch: `feat/<short-feature-name>`
- Keep changes focused; follow existing code style and conventions
- Run `npm run lint` and ensure no warnings/errors
- Test locally with `npm run dev` and verify UI across breakpoints
- Open a pull request describing the problem, solution, and any trade-offs

## License
This project currently has no explicit open-source license. All rights reserved.

If you plan to open-source it, add a `LICENSE` file (e.g., MIT or Apache-2.0) and update this section accordingly.

## Resources
- React: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- Pexels API: https://www.pexels.com/api/
- Google Places API: https://developers.google.com/maps/documentation/places/web-service/overview
- Mapbox Geocoding: https://docs.mapbox.com/api/search/geocoding/
- OpenWeather API: https://openweathermap.org/api

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
