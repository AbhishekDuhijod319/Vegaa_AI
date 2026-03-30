import axios from "axios";

const RAPID_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "";

if (!RAPID_KEY) {
  console.warn("RapidAPI key not configured. Set VITE_RAPIDAPI_KEY in .env.local");
}

// Generic RapidAPI GET
export async function rapidGet(host, path, params = {}, extraHeaders = {}) {
  if (!host?.trim()) throw new Error("rapidGet: 'host' is required");
  if (!path?.trim()) throw new Error("rapidGet: 'path' is required (e.g. '/v1/...')");

  const url = `https://${host}${path}`;
  const headers = {
    "X-RapidAPI-Key": RAPID_KEY,
    "X-RapidAPI-Host": host,
    ...extraHeaders,
  };

  const resp = await axios.get(url, { params, headers });
  return resp.data;
}

// Booking.com API helpers (RapidAPI host below)
const BOOKING_HOST = "booking-com.p.rapidapi.com";

export const bookingApi = {
  // Low-level passthrough
  get: (path, params = {}, headers = {}) => rapidGet(BOOKING_HOST, path, params, headers),

  // Convenience wrappers (verify exact paths/params per your chosen endpoints)
  hotelsSearch: (params) => rapidGet(BOOKING_HOST, "/v1/hotels/search", params),
  hotelsV2Search: (params) => rapidGet(BOOKING_HOST, "/v2/hotels/search", params),
  carRentalsSearch: (params) => rapidGet(BOOKING_HOST, "/v1/car-rental/search", params),
  attractionsSearch: (params) => rapidGet(BOOKING_HOST, "/v1/attractions/search", params),
  flightsSearch: (params) => rapidGet(BOOKING_HOST, "/v1/flights/search", params),
  exchangeRates: (params) => rapidGet(BOOKING_HOST, "/v1/exchange-rates", params),
};

// Trains: provide the specific RapidAPI host for your train provider when calling
// Example usage: trainsApi.get("railway.p.rapidapi.com", "/v1/some-train-endpoint", { from: "...", to: "..." })
export const trainsApi = {
  get: (host, path, params = {}, headers = {}) => rapidGet(host, path, params, headers),
};