import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/api/places";

const googleMapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;

// Simple in-memory cache for place lookups
const placeCache = new Map(); // key: query -> { rating, ratingCount }

export default function Markets({ trip }) {
  const base = Array.isArray(trip?.tripData?.markets)
    ? trip.tripData.markets
    : Array.isArray(trip?.markets)
      ? trip.markets
      : [];

  // Destination context for fallback search
  const destination = useMemo(() => (
    trip?.userSelection?.destination?.label ||
    trip?.userSelection?.location?.label ||
    trip?.tripData?.destination ||
    trip?.destination ||
    ""
  ), [trip]);

  // Fallback results
  const [fallback, setFallback] = useState([]);
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    let ignore = false;
    async function fetchFallback() {
      if (base.length > 0 || !destination) { setFallback([]); return; }
      try {
        setFinding(true);
        const queries = [
          `best shopping in ${destination}`,
          `markets in ${destination}`,
          `shopping malls ${destination}`,
          `bazaars ${destination}`,
        ];
        const seen = new Set();
        const items = [];
        for (const q of queries) {
          try {
            const resp = await placesApi.search(q);
            const places = resp?.data?.places || [];
            for (const p of places) {
              const name = p?.displayName?.text || "";
              const addr = p?.formattedAddress || "";
              const key = `${name}|${addr}`;
              if (!name || seen.has(key)) continue;
              seen.add(key);
              items.push({
                name,
                type: (p?.types || []).join(", ") || undefined,
                rating: p?.rating ? String(p.rating) : undefined,
                location: addr || destination,
                description: "",
                // photoUrl removed; Pexels will be used via SmartImage
              });
            }
          } catch {}
        }
        items.sort((a, b) => (parseFloat(b.rating || 0) - parseFloat(a.rating || 0)));
        const top = items.slice(0, 8);
        if (!ignore) setFallback(top);
      } finally {
        if (!ignore) setFinding(false);
      }
    }
    fetchFallback();
    return () => { ignore = true; };
  }, [base, destination]);

  const list = useMemo(() => (base.length ? base.slice(0, 8) : fallback), [base, fallback]);

  const [placeInfo, setPlaceInfo] = useState({});
  useEffect(() => {
    let ignore = false;
    async function load() {
      const results = {};
      const chunk = async (items, size) => {
        for (let i = 0; i < items.length; i += size) {
          const slice = items.slice(i, i + size);
          await Promise.all(
            slice.map(async (m) => {
              const q = [m?.name || "", m?.location || ""].filter(Boolean).join(" ");
              if (!q) return;
              if (placeCache.has(q)) { results[q] = placeCache.get(q); return; }
              try {
                const resp = await placesApi.search(q);
                const place = resp?.data?.places?.[0];
                if (place) {
                  const info = {
                    rating: place?.rating || null,
                    ratingCount: place?.userRatingCount || null,
                  };
                  placeCache.set(q, info);
                  results[q] = info;
                }
              } catch {
                // ignore
              }
            })
          );
        }
      };
      await chunk(list, 3);
      if (!ignore) setPlaceInfo(results);
    }
    if (list.length) {
      load();
    } else {
      setPlaceInfo({});
    }
    return () => { ignore = true; };
  }, [list]);

  const getInfo = (m) => {
    const q = [m?.name || "", m?.location || ""].filter(Boolean).join(" ");
    return placeInfo[q] || {};
  };

  // Hooks must be called unconditionally and in consistent order
  const trackRef = useRef(null);
  const rafId = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const updateActive = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const children = Array.from(el.children || []);
    let bestIdx = 0;
    let bestDist = Infinity;
    const mid = el.scrollLeft + el.clientWidth / 2;
    children.forEach((child, i) => {
      const rect = child.getBoundingClientRect();
      const childMid = rect.left + rect.width / 2 + el.scrollLeft - el.getBoundingClientRect().left;
      const d = Math.abs(childMid - mid);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    setCurrentIdx(bestIdx);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(updateActive);
  }, [updateActive]);

  const goTo = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children?.[i];
    if (!child) return;
    const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left, behavior: "smooth" });
  }, []);

  // Early return AFTER hooks are declared to keep hook count consistent
  if (list.length === 0) return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Market / Shopping</h2>
      <p className="text-muted-foreground">{finding ? "Finding shopping places nearby..." : "No market recommendations found."}</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Market / Shopping</h2>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        aria-label="Markets carousel"
        role="region"
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
      >
        {list.map((m) => {
          const info = getInfo(m);
          const rating = info?.rating ?? "—";
          const location = m?.location || "";
          const key = [m?.name || "", location].filter(Boolean).join(" ");

          return (
            <article key={key} className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center">
              {/* Image */}
              <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
                <SmartImage
                  query={`${m?.name || ""} ${location}`}
                  alt={m?.name || "Market"}
                  className="w-full h-full object-cover"
                  pexelsFallback={true}
                  sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-[18px] leading-tight line-clamp-2">{m?.name || "Market"}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5" /> {location || "—"}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 text-yellow-500" /> {rating}
                  </span>
                  <span className="text-right">{m?.type || ''}</span>
                </div>

                <div className="mt-auto pt-2">
                  <a href={googleMapsUrl(`${m?.name || ''} ${location}`)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="w-full">View on Map</Button>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Dot pagination */}
      <div className="flex justify-center mt-4 lg:hidden" aria-label="Carousel pagination">
        <div className="inline-flex items-center gap-2">
          {list.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === currentIdx ? 'true' : undefined}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === currentIdx ? 'bg-foreground w-6' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}