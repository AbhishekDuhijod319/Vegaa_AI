import React, { useEffect, useMemo, useRef, useState } from "react";
import { imageApi } from "@/api/images";

// Simple in-memory cache to avoid re-fetching/resolving the same image
const imageCache = new Map(); // key -> { src, srcSet, sizes }

// Reusable image with loading skeleton, responsive srcset, and optional Pexels fallback.
// Props: src? query? alt, className, sizes?, onReady?, enhance? (default true), pexelsFallback? (default true)
const SmartImage = ({
  src,
  query = "travel",
  alt = "",
  className = "",
  sizes,
  width,
  height,
  onReady,
  enhance = true,
  pexelsFallback = true,
  fetchpriority = "low",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSet, setImgSet] = useState({ src: null, srcSet: "", sizes });

  // Keep the latest onReady without causing effect re-runs
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const tryLoad = (url) =>
    new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(true);
      i.onerror = reject;
      i.src = url;
    });

  useEffect(() => {
    let cancelled = false;

    const key = src ? `src:${src}` : `q:${query}`;
    const cached = imageCache.get(key);

    const load = async () => {
      // Avoid flicker: if we already have an image showing, don't show skeleton again
      const hasDisplay = !!imgSet.src;
      if (!hasDisplay) setLoading(true);
      setError(false);

      // 0) Immediate cache hit
      if (cached && cached.src) {
        if (!cancelled) {
          setImgSet({ ...cached, sizes: cached.sizes || sizes });
          setLoading(false);
          onReadyRef.current && onReadyRef.current(cached.src);
        }
        return;
      }

      // 1) If src provided, try it first (keep showing current image until ready)
      if (src) {
        try {
          await tryLoad(src);
          if (!cancelled) {
            const set = { src, srcSet: "", sizes };
            imageCache.set(key, set);
            setImgSet(set);
            setLoading(false);
            onReadyRef.current && onReadyRef.current(src);
            return;
          }
        } catch {
          // fall through to next strategy
        }
      }

      // 2) Fallback to backend image proxy (only if enabled)
      if (pexelsFallback) {
        try {
          const data = await imageApi.search(query, 1);
          const photo = data.photos?.[0];
          if (photo) {
            const imgSrc = photo.src?.large || photo.src?.medium || photo.src?.original;
            await tryLoad(imgSrc);
            if (!cancelled) {
              const next = { src: imgSrc, srcSet: "", sizes };
              imageCache.set(key, next);
              setImgSet(next);
              setLoading(false);
              onReadyRef.current && onReadyRef.current(next.src);
            }
            return;
          }
        } catch (e) {
          // Silently fail; we'll render the fallback UI
        }
      }

      // 3) If all strategies fail
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [src, query, sizes, pexelsFallback]);

  // Skeleton / error UI
  if (loading && !imgSet.src) {
    return (
      <div
        className="w-full h-full bg-muted animate-pulse rounded-md"
        aria-busy="true"
        aria-label="Loading image"
      />
    );
  }
  if (error || !imgSet.src) {
    return (
      <div className="w-full h-full rounded-md border bg-gradient-to-br from-muted to-background grid place-items-center text-xs text-muted-foreground">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={imgSet.src}
      srcSet={imgSet.srcSet}
      sizes={imgSet.sizes}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 opacity-100 ${
        enhance ? "brightness-110 contrast-110 saturate-125" : ""
      } ${className}`}
      loading={fetchpriority === "high" ? "eager" : "lazy"}
      decoding="async"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => {
        setError(true);
      }}
      fetchpriority={fetchpriority}
      // {...rest}
    />
  );
};

export default SmartImage;
