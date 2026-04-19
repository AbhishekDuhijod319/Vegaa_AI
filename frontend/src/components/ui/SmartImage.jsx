import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { imageApi } from "@/api/images";
import { placesApi } from "@/api/places";

// ── In-memory cache ──────────────────────────────────────────────────
const imageCache = new Map(); // key → url string

// ── Global dedup: track Pexels photo IDs already used on this page ──
const usedPhotoIds = new Set();

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
 * ImageSkeleton — animated skeleton placeholder shown while images load
 * or when all image sources fail. Uses a shimmer animation instead of
 * static gradients for a modern, polished look.
 */
const ImageSkeleton = ({ className = "", label = "", showLabel = false }) => (
  <div
    className={`w-full h-full overflow-hidden relative ${className}`}
    role="img"
    aria-label={label || "Image loading"}
  >
    {/* Base layer */}
    <div className="absolute inset-0 bg-muted" />

    {/* Shimmer animation overlay */}
    <div
      className="absolute inset-0 skeleton-shimmer"
      style={{
        background: `linear-gradient(
          90deg,
          transparent 0%,
          hsl(var(--muted-foreground) / 0.06) 20%,
          hsl(var(--muted-foreground) / 0.12) 50%,
          hsl(var(--muted-foreground) / 0.06) 80%,
          transparent 100%
        )`,
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.8s ease-in-out infinite",
      }}
    />

    {/* Subtle icon placeholder */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-muted-foreground"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>

    {/* Label in error state */}
    {showLabel && label && (
      <span className="absolute bottom-2 left-3 text-muted-foreground/40 text-xs font-medium select-none">
        {label}
      </span>
    )}
  </div>
);

/**
 * SmartImage — robust image component with:
 *  1. Progressive loading (skeleton shimmer → smooth fade-in)
 *  2. Google Places Photo support (real venue images)
 *  3. Quality-aware Pexels fallback (high = 1920+ px, standard = 940px)
 *  4. Skeleton placeholder fallback (never shows blank/broken)
 *  5. In-memory caching + global Pexels dedup
 *
 * Load priority: direct src → Google Places photo → Pexels → skeleton
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

      // All strategies failed → skeleton placeholder
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

  // Loading state — animated skeleton shimmer
  if (state === "loading" && !imgSrc) {
    return <ImageSkeleton className={className} label={alt || query} />;
  }

  // Error state — skeleton with subtle label (never shows gradient)
  if (state === "error" && !imgSrc) {
    return <ImageSkeleton className={className} label={alt || query} showLabel={true} />;
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
