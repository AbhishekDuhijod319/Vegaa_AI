// GlobalAPI: add provider switch and Mapbox-based search with a similar output shape
import axios from "axios";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

// Provider selection (default: google)
const PROVIDER = (import.meta.env.VITE_PLACES_PROVIDER || "google").toLowerCase();

// Google Places config
const GOOGLE_BASE_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_HEADERS = {
  "Content-Type": "application/json",
  "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  "X-Goog-FieldMask":
    "places.id,places.displayName,places.location,places.formattedAddress,places.photos",
};

// Mapbox Geocoding config
const MAPBOX_BASE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Mapbox helpers to normalize data to Google-like shape
function mapboxSearch(textQuery, limit = 8) {
  if (!MAPBOX_TOKEN || !textQuery?.trim()) return Promise.resolve([]);
  const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(textQuery)}.json`;
  return axios
    .get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        limit,
        // You can add types=poi to focus POIs:
        // types: "poi"
      },
    })
    .then((resp) => resp?.data?.features || [])
    .catch(() => []);
}

function mapboxToPlaces(features = []) {
  return features.map((f) => ({
    id: f.id,
    displayName: { text: f.text || f.place_name || "" },
    formattedAddress: f.place_name || "",
    location: Array.isArray(f.center)
      ? { latitude: f.center[1], longitude: f.center[0] }
      : null,
    // Mapbox doesn't provide ratings/opening hours/photos directly
    rating: null,
    userRatingCount: null,
    photos: [],
  }));
}

// getPlaceDetails: text search (Google or Mapbox)
export const getPlaceDetails = (data) => {
  const q = data?.textQuery || "";
  if (PROVIDER === "mapbox") {
    return mapboxSearch(q, 8).then((features) => ({
      data: { places: mapboxToPlaces(features) },
    }));
  }
  return axios.post(GOOGLE_BASE_URL, data, { headers: GOOGLE_HEADERS });
};

// Fetch place details by ID (Google only; Mapbox has no direct feature-by-id endpoint)
export const getPlaceById = async (placeId) => {
  if (PROVIDER === "mapbox") {
    // Not supported; rely on getPlaceDetails(textQuery) instead
    return null;
  }
  if (!placeId) return null;
  const headers = {
    "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
    "X-Goog-FieldMask": "id,displayName,location,formattedAddress",
  };
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  try {
    const resp = await axios.get(url, { headers });
    return resp?.data || null;
  } catch (e) {
    console.error("getPlaceById error", e?.response?.data || e?.message);
    return null;
  }
};

// Suggestions (Google or Mapbox)
export const getPlaceSuggestions = async (query) => {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  if (PROVIDER === "mapbox") {
    const features = await mapboxSearch(q, 8);
    return features.slice(0, 8).map((f) => ({
      id: f.id,
      label: f.text || f.place_name || "",
      location: Array.isArray(f.center)
        ? { lat: f.center[1], lng: f.center[0] }
        : undefined,
      address: f.place_name || "",
    }));
  }
  try {
    const resp = await axios.post(GOOGLE_BASE_URL, { textQuery: q }, { headers: GOOGLE_HEADERS });
    const places = resp?.data?.places || [];
    return places.slice(0, 8).map((p) => ({
      id: p.id,
      label: p.displayName?.text || "",
      location: p.location
        ? { lat: p.location.latitude, lng: p.location.longitude }
        : undefined,
      address: p.formattedAddress,
    }));
  } catch (e) {
    console.error("Places suggestions error", e?.response?.data || e?.message);
    return [];
  }
};

// Rich search (ratings/photos available only with Google; Mapbox returns basic fields)
const RICH_FIELDS =
  "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.currentOpeningHours,places.types,places.photos,places.rating,places.userRatingCount";
export const searchPlaceRich = async (textQuery) => {
  if (PROVIDER === "mapbox") {
    const features = await mapboxSearch(textQuery, 8);
    return { data: { places: mapboxToPlaces(features) } };
  }
  try {
    const headers = {
      ...GOOGLE_HEADERS,
      "X-Goog-FieldMask": RICH_FIELDS,
    };
    const resp = await axios.post(GOOGLE_BASE_URL, { textQuery }, { headers });
    return resp;
  } catch (e) {
    console.error("searchPlaceRich error", e?.response?.data || e?.message);
    return null;
  }
};

// Weather API (OpenWeatherMap) — normalized with caching and graceful errors
const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

// Simple in-memory cache to avoid repeated calls and flicker
const WEATHER_CACHE = new Map(); // key -> { data, ts }
const WEATHER_PENDING = new Map(); // key -> Promise
const WEATHER_TTL_MS = 15 * 60 * 1000; // 15 minutes

const normalizeCity = (city) => {
  const raw = String(city || '').trim();
  if (!raw) return '';
  const basic = raw.split(',')[0].trim();
  return basic || raw;
};

export const getWeatherByCity = async (city) => {
  // In dev, optionally disable live weather calls to reduce noisy logs
  const devDisabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEATHER_DEV !== '1';
  if (devDisabled) {
    return { data: null, error: null, status: 'disabled' };
  }
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const q = normalizeCity(city);
  if (!q || !key) return null;

  const cacheKey = q.toLowerCase();
  const now = Date.now();
  const cached = WEATHER_CACHE.get(cacheKey);
  if (cached && (now - cached.ts) < WEATHER_TTL_MS) {
    return cached.data;
  }
  if (WEATHER_PENDING.has(cacheKey)) {
    try {
      return await WEATHER_PENDING.get(cacheKey);
    } catch {
      // fall through to a fresh request
    }
  }

  const request = (async () => {
    try {
      const resp = await axios.get(`${WEATHER_BASE}/weather`, {
        params: { q, units: 'metric', appid: key },
        timeout: 8000,
      });
      const data = resp?.data || null;
      if (data) WEATHER_CACHE.set(cacheKey, { data, ts: Date.now() });
      return data;
    } catch (e) {
      // Gracefully handle errors without noisy console output
      // Common cases: city not found (404), network issues
      return null;
    } finally {
      WEATHER_PENDING.delete(cacheKey);
    }
  })();

  WEATHER_PENDING.set(cacheKey, request);
  return await request;
};

export const getForecastByCity = async (city) => {
  const devDisabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEATHER_DEV !== '1';
  if (devDisabled) {
    return { data: null, error: null, status: 'disabled' };
  }
  if (!city) return null;
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!key) return null;
  try {
    // 5 day / 3 hour forecast
    const resp = await axios.get(`${WEATHER_BASE}/forecast`, {
      params: { q: city, units: 'metric', appid: key },
    });
    return resp.data; // contains list[ { dt_txt, weather, main } ]
  } catch (e) {
    console.error('Forecast API error', e?.response?.data || e?.message);
    return null;
  }
};