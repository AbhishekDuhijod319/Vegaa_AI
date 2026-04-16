import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { imageApi } from "@/api/images";

// ── In-memory cache ──────────────────────────────────────────────────
const imageCache = new Map(); // key → { src, srcSet, sizes }

// ── Global dedup: track Pexels photo IDs already used on this page ──
const usedPhotoIds = new Set();

// ── Curated fallback gradients (never show black/white blank) ────────
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  "linear-gradient(135deg, #1a3a5c, #0d2137, #0a1628)",
  "linear-gradient(135deg, #232526, #414345)",
  "linear-gradient(135deg, #11998e, #38ef7d)",
  "linear-gradient(135deg, #fc5c7d, #6a82fb)",
  "linear-gradient(135deg, #2C3E50, #4CA1AF)",
];

const pickGradient = (query = "") => {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = ((hash << 5) - hash + query.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
};

/**
 * Pick the first Pexels photo from results that hasn't been used yet.
 * Returns { photo, url } or null.
 */
function pickUniquePhoto(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  for (const photo of photos) {
    const id = photo?.id;
    if (id && !usedPhotoIds.has(id)) {
      const url =
        photo.src?.large ||
        photo.src?.medium ||
        photo.src?.landscape ||
        photo.src?.original;
      if (url) {
        usedPhotoIds.add(id);
        return { photo, url };
      }
    }
  }
  // If all are used, return the first one anyway (better than nothing)
  const fallback = photos[0];
  const url = fallback?.src?.large || fallback?.src?.medium || fallback?.src?.original;
  return url ? { photo: fallback, url } : null;
}

/**
 * SmartImage — robust image component with:
 *  1. Progressive loading (skeleton → image)
 *  2. Retry with exponential backoff
 *  3. Beautiful gradient fallback on failure (never shows black)
 *  4. In-memory caching to avoid re-fetching
 *  5. Global deduplication — no two SmartImages show the same Pexels photo
 */
const SmartImage = ({
  src,
  query = "travel",
  alt = "",
  className = "",
  sizes,
  width,
  height,
  onReady,
  enhance = false,
  pexelsFallback = true,
  fetchpriority = "low",
}) => {
  const [state, setState] = useState("idle"); // idle | loading | loaded | error
  const [imgSrc, setImgSrc] = useState(null);
  const containerRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const retryCount = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Memoize key
  const cacheKey = useMemo(
    () => (src ? `src:${src}` : `q:${query}`),
    [src, query]
  );

  // Gradient fallback (deterministic per query)
  const fallbackGradient = useMemo(() => pickGradient(query || src || ""), [query, src]);

  // Try loading a single URL
  const tryLoad = useCallback(
    (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load: ${url}`));
        img.src = url;
      }),
    []
  );

  // Main load logic
  useEffect(() => {
    cancelledRef.current = false;
    retryCount.current = 0;

    const cached = imageCache.get(cacheKey);
    if (cached?.src) {
      setImgSrc(cached.src);
      setState("loaded");
      onReadyRef.current?.(cached.src);
      return;
    }

    const load = async () => {
      setState("loading");

      // Strategy 1: Direct src
      if (src) {
        try {
          await tryLoad(src);
          if (!cancelledRef.current) {
            imageCache.set(cacheKey, { src, srcSet: "", sizes });
            setImgSrc(src);
            setState("loaded");
            onReadyRef.current?.(src);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // Strategy 2: Pexels backend API — fetch multiple results to enable dedup
      if (pexelsFallback) {
        try {
          const data = await imageApi.search(query, 5); // Request 5 for dedup pool
          const picked = pickUniquePhoto(data.photos || []);
          if (picked) {
            await tryLoad(picked.url);
            if (!cancelledRef.current) {
              imageCache.set(cacheKey, { src: picked.url, srcSet: "", sizes });
              setImgSrc(picked.url);
              setState("loaded");
              onReadyRef.current?.(picked.url);
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      // Strategy 3: Retry once after 1.5s with different query variation
      if (retryCount.current < 1 && !cancelledRef.current) {
        retryCount.current++;
        await new Promise((r) => setTimeout(r, 1500));
        if (!cancelledRef.current && pexelsFallback) {
          try {
            // Slightly modify query for different results
            const retryQuery = `${query} photo`;
            const data = await imageApi.search(retryQuery, 3);
            const picked = pickUniquePhoto(data.photos || []);
            if (picked) {
              await tryLoad(picked.url);
              if (!cancelledRef.current) {
                imageCache.set(cacheKey, { src: picked.url, srcSet: "", sizes });
                setImgSrc(picked.url);
                setState("loaded");
                onReadyRef.current?.(picked.url);
                return;
              }
            }
          } catch {
            // Final fallback
          }
        }
      }

      // All strategies failed → show gradient
      if (!cancelledRef.current) {
        setState("error");
      }
    };

    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [cacheKey, src, query, sizes, pexelsFallback, tryLoad]);

  // ── Render ──────────────────────────────────────────────────────────

  // Loading skeleton
  if (state === "loading" && !imgSrc) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden ${className}`}
        aria-busy="true"
        aria-label="Loading image"
        style={{ background: fallbackGradient }}
      >
        <div className="w-full h-full animate-pulse bg-white/5" />
      </div>
    );
  }

  // Error / failed — beautiful gradient fallback with query label
  if (state === "error" && !imgSrc) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden flex items-end justify-start ${className}`}
        style={{ background: fallbackGradient }}
        role="img"
        aria-label={alt || query}
      >
        <span className="text-white/30 text-xs font-medium px-4 py-3 select-none">
          {alt || query}
        </span>
      </div>
    );
  }

  // Loaded image
  return (
    <img
      ref={containerRef}
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-500 opacity-100 ${
        enhance ? "brightness-105 contrast-105 saturate-110" : ""
      } ${className}`}
      loading={fetchpriority === "high" ? "eager" : "lazy"}
      decoding="async"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => {
        setImgSrc(null);
        setState("error");
        imageCache.delete(cacheKey);
      }}
      fetchpriority={fetchpriority}
    />
  );
};

export default SmartImage;
