import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Star, IndianRupee, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/api/places";

const googleMapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;

const placeCache = new Map();

const CATEGORY_STYLES = {
  budget: { label: "Budget", className: "bg-green-600 text-white" },
  "mid-range": { label: "Mid-Range", className: "bg-blue-600 text-white" },
  premium: { label: "Premium", className: "bg-amber-600 text-white" },
};

function formatINR(value) {
  if (!value && value !== 0) return "—";
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, ''));
  if (isNaN(num)) return typeof value === 'string' ? value : "—";
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

function formatPriceRange(priceRange, pricePerPerson) {
  if (pricePerPerson && typeof pricePerPerson === 'number') {
    return `${formatINR(pricePerPerson)}/person`;
  }
  if (priceRange) {
    if (String(priceRange).includes('₹')) return priceRange;
    const m = /(\d[\d,]*)\s*-\s*(\d[\d,]*)/.exec(String(priceRange));
    if (m) return `₹${m[1]} - ₹${m[2]} per person`;
    return priceRange;
  }
  return "—";
}

function Restaurants({ trip }) {
  const base = Array.isArray(trip?.tripData?.restaurants)
    ? trip.tripData.restaurants
    : Array.isArray(trip?.restaurants)
      ? trip.restaurants
      : [];

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
            const resp = await placesApi.search(q);
            const places = resp?.data?.places || [];
            for (const p of places) {
              const name = p?.displayName?.text || "";
              const addr = p?.formattedAddress || "";
              const key = name.toLowerCase().trim();
              if (!name || seen.has(key)) continue;
              seen.add(key);
              items.push({
                name,
                rating: p?.rating ? String(p.rating) : undefined,
                priceRange: "",
                location: addr || destination,
                cuisine: undefined,
                description: "",
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
                const resp = await placesApi.search(q);
                const place = resp?.data?.places?.[0];
                if (place) {
                  const info = {
                    rating: place?.rating || null,
                    ratingCount: place?.userRatingCount || null,
                    website: place?.websiteUri || null,
                    photoRef: place?.photoRef || null,
                  };
                  placeCache.set(q, info);
                  results[q] = info;
                }
              } catch {}
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
          const rating = info?.rating ?? r?.rating ?? "—";
          const location = r?.location || "";
          const key = [r?.name || "", location].filter(Boolean).join(" ");
          const priceDisplay = formatPriceRange(r?.priceRange, r?.pricePerPerson);
          const category = r?.category || "";
          const catStyle = CATEGORY_STYLES[category];

          return (
            <article key={key} className="group relative rounded-2xl border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col snap-center">
              {/* Category badge */}
              {catStyle && (
                <span className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold ${catStyle.className}`}>
                  {catStyle.label}
                </span>
              )}

              {/* Image */}
              <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2]">
                <SmartImage
                  query={`${r?.name || ""} ${r?.cuisine || ""} restaurant ${destination}`}
                  alt={r?.name || "Restaurant"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  googlePhotoRef={info?.photoRef}
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
                  <span className="text-right font-medium text-foreground inline-flex items-center justify-end gap-1">
                    <IndianRupee className="size-3.5" /> {priceDisplay}
                  </span>
                </div>

                {r?.cuisine && (
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                    <UtensilsCrossed className="size-3.5" /> {r.cuisine}
                  </p>
                )}

                {r?.mustTry && (
                  <p className="text-sm text-foreground/90">
                    <span className="font-medium">Must try:</span> {r.mustTry}
                  </p>
                )}

                {r?.description && (
                  <p className="text-sm text-foreground/80 line-clamp-2">{r.description}</p>
                )}

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
