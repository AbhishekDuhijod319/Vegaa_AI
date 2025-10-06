// Lightweight Pexels API client with caching and fallbacks.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

function ensureKey() {
  if (!PEXELS_KEY) throw new Error("Missing VITE_PEXELS_API_KEY environment variable");
}

function cacheKey(query, perPage) {
  return `pexels:${query}:${perPage}`;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data || !parsed.ts) return null;
    if (Date.now() - parsed.ts > ONE_DAY_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore write errors
  }
}

// ------- Extended caching strategies -------
function readCacheNoExpiry(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function monthBucket() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function cacheKeyMonthly(query, perPage) {
  return `pexels:monthly:${monthBucket()}:${query}:${perPage}`;
}

function cacheKeyStable(query, perPage) {
  return `pexels:stable:${query}:${perPage}`;
}

export async function searchPexels(query, perPage = 6) {
  ensureKey();
  const key = cacheKey(query, perPage);
  const cached = readCache(key);
  if (cached) return cached;

  try {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!resp.ok) throw new Error(`Pexels ${resp.status}`);
    const json = await resp.json();
    writeCache(key, json);
    return json;
  } catch (err) {
    console.error("Pexels fetch failed:", err?.message || err);
    throw err;
  }
}

export function toImageSet(photo) {
  // Build responsive srcset using provided sizes
  const s = photo?.src || {};
  const src = s.large2x || s.large || s.medium || s.original || s.small || s.landscape || s.portrait || s.tiny;
  const srcSet = [
    s.small && `${s.small} 640w`,
    s.medium && `${s.medium} 800w`,
    s.large && `${s.large} 1080w`,
    s.large2x && `${s.large2x} 1600w`,
  ].filter(Boolean).join(", ");
  return { src, srcSet, sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" };
}

export async function getFirstImageForQuery(query) {
  const data = await searchPexels(query, 1);
  const photo = data?.photos?.[0];
  if (!photo) throw new Error("No Pexels photo found");
  return toImageSet(photo);
}

// New: fetch a specific Pexels photo by ID (useful for deterministic hero images)
export async function getPhotoById(id) {
  ensureKey();
  const key = `pexels-photo:${id}`;
  const cached = readCache(key);
  if (cached) return toImageSet(cached);

  try {
    const resp = await fetch(`https://api.pexels.com/v1/photos/${id}`, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (!resp.ok) throw new Error(`Pexels photo ${id} ${resp.status}`);
    const json = await resp.json();
    writeCache(key, json);
    return toImageSet(json);
  } catch (err) {
    console.error("Pexels getPhotoById failed:", err?.message || err);
    throw err;
  }
}

// --------- Monthly and Stable image helpers ---------
export async function getMonthlyFirstImageForQuery(query) {
  ensureKey();
  const key = cacheKeyMonthly(query, 1);
  const cached = readCacheNoExpiry(key);
  if (cached) {
    const photo = cached?.photos?.[0];
    if (photo) return toImageSet(photo);
  }
  const resp = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!resp.ok) throw new Error(`Pexels ${resp.status}`);
  const json = await resp.json();
  writeCache(key, json);
  const photo = json?.photos?.[0];
  if (!photo) throw new Error("No Pexels photo found");
  return toImageSet(photo);
}

export async function getStableFirstImageForQuery(query) {
  ensureKey();
  const key = cacheKeyStable(query, 1);
  const cached = readCacheNoExpiry(key);
  if (cached) {
    const photo = cached?.photos?.[0];
    if (photo) return toImageSet(photo);
  }
  const resp = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!resp.ok) throw new Error(`Pexels ${resp.status}`);
  const json = await resp.json();
  writeCache(key, json);
  const photo = json?.photos?.[0];
  if (!photo) throw new Error("No Pexels photo found");
  return toImageSet(photo);
}
