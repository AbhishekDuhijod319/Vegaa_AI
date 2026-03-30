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
    // Suppress noisy errors; return empty result for graceful fallbacks
    return { photos: [] };
  }
}

function withCompress(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    const params = u.searchParams;
    // Deduplicate and ensure compression params exist exactly once
    if (!params.has("auto")) params.set("auto", "compress");
    if (!params.has("cs")) params.set("cs", "tinysrgb");
    u.search = params.toString();
    return u.toString();
  } catch {
    // Fallback to naive append if URL parsing fails (unlikely for Pexels URLs)
    const hasQ = url.includes("?");
    const sep = hasQ ? "&" : "?";
    // Only append if not already present
    if (url.includes("auto=compress") || url.includes("cs=tinysrgb")) return url;
    return `${url}${sep}auto=compress&cs=tinysrgb`;
  }
}

function widthFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const w = Number(u.searchParams.get("w"));
    const dpr = Number(u.searchParams.get("dpr")) || 1;
    if (Number.isFinite(w) && w > 0) return Math.round(w * dpr);
    return null;
  } catch {
    return null;
  }
}

export function toImageSet(photo) {
  // Build responsive srcset using accurate width descriptors and apply compression
  const s = photo?.src || {};
  // Choose a sensible default src (prefer high quality variants)
  const src = withCompress(
    s.large2x || s.landscape || s.large || s.medium || s.original || s.small || s.portrait || s.tiny
  );

  const candidates = [];
  // Collect available variants with their true widths (accounting for DPR)
  const variants = [
    s.tiny,
    s.small,
    s.medium,
    s.large,
    s.large2x,
    s.landscape,
    s.portrait,
  ].filter(Boolean);

  for (const v of variants) {
    const w = widthFromUrl(v);
    if (w && w > 0) {
      candidates.push(`${withCompress(v)} ${w}w`);
    }
  }

  // Include original at its native width for ultra-wide / retina screens when available
  const origWidth = Number(photo?.width) || null;
  if (s.original && origWidth && Number.isFinite(origWidth)) {
    candidates.push(`${withCompress(s.original)} ${origWidth}w`);
  }

  // Deduplicate by width and sort ascending to help the browser
  const seen = new Set();
  const srcSet = candidates
    .map((c) => {
      const m = c.match(/\s(\d+)w$/);
      return m ? { w: Number(m[1]), s: c } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.w - b.w)
    .filter(({ w }) => {
      if (seen.has(w)) return false;
      seen.add(w);
      return true;
    })
    .map(({ s }) => s)
    .join(", ");

  return {
    src,
    srcSet,
    // Provide a sensible default; components can override with a context-aware sizes prop
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  };
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
    // Suppress noisy errors; signal absence by returning null
    return null;
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
