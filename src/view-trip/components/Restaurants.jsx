import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchPlaceRich } from "@/sevice/GlobalAPI";

const googleMapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;

// Simple in-memory cache for place lookups within this session
const placeCache = new Map(); // key: query -> { rating, ratingCount, website }

function Restaurants({ trip }) {
  const base = Array.isArray(trip?.tripData?.restaurants)
    ? trip.tripData.restaurants
    : Array.isArray(trip?.restaurants)
      ? trip.restaurants
      : [];

  // Destination context for fallback search
  const destination = useMemo(() => (
    trip?.userSelection?.destination?.label ||
    trip?.userSelection?.location?.label ||
    trip?.tripData?.destination ||
    trip?.destination ||
    ""
  ), [trip]);

  // Fallback results when AI returns empty
  const [fallback, setFallback] = useState([]);
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    let ignore = false;
    async function fetchFallback() {
      if (base.length > 0 || !destination) { setFallback([]); return; }
      try {
        setFinding(true);
        const queries = [
          `best restaurants in ${destination}`,
          `top restaurants ${destination}`,
          `restaurants ${destination}`,
        ];
        const seen = new Set();
        const items = [];
        for (const q of queries) {
          try {
            const resp = await searchPlaceRich(q);
            const places = resp?.data?.places || [];
            for (const p of places) {
              const name = p?.displayName?.text || "";
              const addr = p?.formattedAddress || "";
              const key = `${name}|${addr}`;
              if (!name || seen.has(key)) continue;
              seen.add(key);
              items.push({
                name,
                rating: p?.rating ? String(p.rating) : undefined,
                priceRange: "",
                location: addr || destination,
                cuisine: undefined,
                description: "",
                // photoUrl removed; SmartImage will use Pexels
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
            slice.map(async (r) => {
              const q = [r?.name || "", r?.location || ""].filter(Boolean).join(" ");
              if (!q) return;
              if (placeCache.has(q)) { results[q] = placeCache.get(q); return; }
              try {
                const resp = await searchPlaceRich(q);
                const place = resp?.data?.places?.[0];
                if (place) {
                  const info = {
                    rating: place?.rating || null,
                    ratingCount: place?.userRatingCount || null,
                    website: place?.websiteUri || null,
                  };
                  placeCache.set(q, info);
                  results[q] = info;
                }
              } catch {
                // ignore error for individual item
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

  const getInfo = (r) => {
    const q = [r?.name || "", r?.location || ""].filter(Boolean).join(" ");
    return placeInfo[q] || {};
  };

  // Dot pagination and precise scroll tracking
  const trackRef = useRef(null);
  const rafId = useRef(0);
  const [currentIdx, setCurrentIdx] = useState(0);

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.children;
    if (!slides || !slides.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < slides.length; i++) {
      const el = slides[i];
      const elCenter = el.offsetLeft - track.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < minDist) { minDist = dist; closestIdx = i; }
    }
    setCurrentIdx(closestIdx);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => { rafId.current = 0; updateActive(); });
  }, [updateActive]);

  const goTo = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.children;
    if (!slides || !slides.length) return;
    const clamped = Math.max(0, Math.min(idx, slides.length - 1));
    const el = slides[clamped];
    const left = el.offsetLeft - track.offsetLeft;
    track.scrollTo({ left, behavior: "smooth" });
    setCurrentIdx(clamped);
  }, []);

  if (list.length === 0) return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Recommended Restaurants</h2>
      <p className="text-muted-foreground">{finding ? "Finding restaurants nearby..." : "No restaurants found."}</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Recommended Restaurants</h2>
      <div
        ref={trackRef}
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
        onScroll={handleScroll}
        role="listbox"
        aria-label="Recommended restaurants carousel"
      >
        {list.map((r) => {
          const info = getInfo(r);
          const rating = info?.rating ?? "—";
          const location = r?.location || "";
          const key = [r?.name || "", location].filter(Boolean).join(" ");

          return (
            <article key={key} className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center">
              {/* Image */}
              <div className="w-full overflow-hidden bg-muted [aspect-ratio:4/3] sm:[aspect-ratio:3/2] md:[aspect-ratio:16/9]">
                <SmartImage
                  query={`${r?.name || ""} ${location}`}
                  alt={r?.name || "Restaurant"}
                  className="w-full h-full object-cover"
                  pexelsFallback={true}
                  sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-[18px] leading-tight line-clamp-2">{r?.name || "Restaurant"}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5" /> {location || "—"}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 text-yellow-500" /> {rating}
                  </span>
                  <span className="text-right">{r?.priceRange || ''}</span>
                </div>

                {r?.cuisine && <p className="text-sm text-foreground/90">{r.cuisine}</p>}

                <div className="mt-auto pt-2">
                  <a href={googleMapsUrl(`${r?.name || ''} ${location}`)} target="_blank" rel="noreferrer">
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
              aria-current={i === currentIdx ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === currentIdx ? "bg-foreground w-6" : "bg-gray-400"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const MemoizedRestaurants = React.memo(Restaurants);
export default MemoizedRestaurants;
