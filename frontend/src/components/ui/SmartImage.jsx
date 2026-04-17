import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { imageApi } from "@/api/images";
import { placesApi } from "@/api/places";

// ── In-memory cache ──────────────────────────────────────────────────
const imageCache = new Map(); // key → url string

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
 * Pick the best Pexels photo URL based on quality level.
 *  - "high" → large2x (1880px) or original (full res) for hero images
 *  - "standard" → large (940px) for cards
 */
function pickPhotoUrl(photo, quality = "standard") {
  if (!photo?.src) return null;
  if (quality === "high") {
    return photo.src.large2x || photo.src.original || photo.src.large || photo.src.landscape;
  }
  return photo.src.large || photo.src.medium || photo.src.landscape || photo.src.original;
}

/**
 * Pick the first Pexels photo from results that hasn't been used yet.
 */
function pickUniquePhoto(photos, quality = "standard") {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  for (const photo of photos) {
    const id = photo?.id;
    if (id && !usedPhotoIds.has(id)) {
      const url = pickPhotoUrl(photo, quality);
      if (url) {
        usedPhotoIds.add(id);
        return url;
      }
    }
  }
  // All used — return first anyway
  return pickPhotoUrl(photos[0], quality);
}

/**
 * SmartImage — robust image component with:
 *  1. Progressive loading (skeleton → smooth fade-in)
 *  2. Google Places Photo support (real venue images)
 *  3. Quality-aware Pexels fallback (high = 1920+ px, standard = 940px)
 *  4. Beautiful gradient fallback (never shows blank/broken)
 *  5. In-memory caching + global Pexels dedup
 *
 * Load priority: direct src → Google Places photo → Pexels → gradient
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
  googlePhotoRef = null,
  quality = "standard", // "high" for hero images (1920+ px), "standard" for cards
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

  // Memoize cache key
  const cacheKey = useMemo(
    () => (src ? `src:${src}` : googlePhotoRef ? `gref:${googlePhotoRef}` : `q:${query}:${quality}`),
    [src, query, googlePhotoRef, quality]
  );

  // Gradient fallback (deterministic per query)
  const fallbackGradient = useMemo(() => pickGradient(query || src || ""), [query, src]);

  // Try loading a single URL via Image object
  const tryLoad = useCallback(
    (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed: ${url}`));
        img.src = url;
      }),
    []
  );

  // Main load logic
  useEffect(() => {
    cancelledRef.current = false;
    retryCount.current = 0;

    // Check cache first
    const cached = imageCache.get(cacheKey);
    if (cached) {
      setImgSrc(cached);
      setState("loaded");
      onReadyRef.current?.(cached);
      return;
    }

    const load = async () => {
      setState("loading");

      // Strategy 1: Direct src prop
      if (src) {
        try {
          await tryLoad(src);
          if (!cancelledRef.current) {
            imageCache.set(cacheKey, src);
            setImgSrc(src);
            setState("loaded");
            onReadyRef.current?.(src);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // Strategy 2: Google Places Photo (actual venue images)
      if (googlePhotoRef) {
        try {
          const googleUrl = await placesApi.getPhotoUrl(googlePhotoRef, quality === "high" ? 1200 : 600);
          if (googleUrl && !cancelledRef.current) {
            await tryLoad(googleUrl);
            if (!cancelledRef.current) {
              imageCache.set(cacheKey, googleUrl);
              setImgSrc(googleUrl);
              setState("loaded");
              onReadyRef.current?.(googleUrl);
              return;
            }
          }
        } catch {
          // Fall through to Pexels
        }
      }

      // Strategy 3: Pexels (scenic/stock images with quality-aware resolution)
      if (pexelsFallback) {
        try {
          const perPage = quality === "high" ? 3 : 5;
          const data = await imageApi.search(query, perPage);
          const url = pickUniquePhoto(data.photos || [], quality);
          if (url) {
            await tryLoad(url);
            if (!cancelledRef.current) {
              imageCache.set(cacheKey, url);
              setImgSrc(url);
              setState("loaded");
              onReadyRef.current?.(url);
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      // Strategy 4: Retry once with modified query
      if (retryCount.current < 1 && !cancelledRef.current && pexelsFallback) {
        retryCount.current++;
        await new Promise((r) => setTimeout(r, 1200));
        if (!cancelledRef.current) {
          try {
            const retryQuery = `${query} landscape`;
            const data = await imageApi.search(retryQuery, 3);
            const url = pickUniquePhoto(data.photos || [], quality);
            if (url) {
              await tryLoad(url);
              if (!cancelledRef.current) {
                imageCache.set(cacheKey, url);
                setImgSrc(url);
                setState("loaded");
                onReadyRef.current?.(url);
                return;
              }
            }
          } catch {
            // Final fallback
          }
        }
      }

      // All strategies failed → gradient
      if (!cancelledRef.current) {
        setState("error");
      }
    };

    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [cacheKey, src, query, sizes, pexelsFallback, googlePhotoRef, quality, tryLoad]);

  // ── Render ──────────────────────────────────────────────────────────

  // Loading skeleton with gradient placeholder
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

  // Error state — beautiful gradient fallback with subtle label
  if (state === "error" && !imgSrc) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden flex items-end justify-start ${className}`}
        style={{ background: fallbackGradient }}
        role="img"
        aria-label={alt || query}
      >
        <span className="text-white/20 text-xs font-medium px-4 py-3 select-none">
          {alt || query}
        </span>
      </div>
    );
  }

  // Loaded image with smooth fade-in
  return (
    <img
      ref={containerRef}
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-700 ease-out opacity-100 ${
        enhance ? "brightness-105 contrast-105 saturate-110" : ""
      } ${className}`}
      loading={fetchpriority === "high" ? "eager" : "lazy"}
      decoding="async"
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
