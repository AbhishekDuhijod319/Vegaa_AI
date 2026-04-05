import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/api/places";

function googleMapsUrl(name, location) {
  const q = [name || "", location || ""].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    q
  )}`;
}

function PlacesToVisit({ trip }) {
  // Destination context for fallback search
  const destination = useMemo(
    () =>
      trip?.userSelection?.destination?.label ||
      trip?.userSelection?.location?.label ||
      trip?.tripData?.destination ||
      trip?.destination ||
      "",
    [trip]
  );

  // Extract activities from itinerary: supports both {day.activities:[...]} and old slot-based
  const baseAttractions = useMemo(() => {
    const days = Array.isArray(trip?.tripData?.itinerary)
      ? trip.tripData.itinerary
      : Array.isArray(trip?.itinerary)
      ? trip.itinerary
      : [];

    const entries = days.flatMap((d) => {
      if (Array.isArray(d?.activities)) return d.activities;
      const slots = [d?.morning, d?.afternoon, d?.evening].filter(Boolean);
      return slots.flatMap((slot) => (Array.isArray(slot?.activities) ? slot.activities : [slot]));
    });

    const mapped = entries
      .filter((a) => a && (a.title || a.name))
      .map((a) => ({
        title: a.title || a.name,
        location: a.location || a.address || destination || "",
        time: a.time || a.slot || "",
        description: a.description || a.details || "",
        // Remove direct photoUrl to enforce Pexels usage
        // photoUrl: a.photoUrl || null,
      }));

    // De-duplicate by title+location
    const seen = new Set();
    const uniq = [];
    for (const a of mapped) {
      const key = `${a.title}|${a.location}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(a);
      }
    }

    // Limit based on trip length
    const daysCount = Number(trip?.userSelection?.days || trip?.days || 3);
    const target = Math.min(Math.max(daysCount * 3, 9), 18);
    return uniq.slice(0, target);
  }, [trip, destination]);

  // Fallback when AI itinerary is empty
  const [fallback, setFallback] = useState([]);
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    let ignore = false;
    async function fetchFallback() {
      if (baseAttractions.length > 0 || !destination) {
        setFallback([]);
        return;
      }
      try {
        setFinding(true);
        const queries = [
          `top attractions in ${destination}`,
          `famous landmarks ${destination}`,
          `points of interest ${destination}`,
          `things to do in ${destination}`,
        ];
        const seen = new Set();
        const items = [];
        for (const q of queries) {
          try {
            const resp = await placesApi.search(q);
            const places = resp?.data?.places || [];
            for (const p of places) {
              const name = p?.displayName?.text || "";
              const addr = p?.formattedAddress || destination || "";
              const k = `${name}|${addr}`;
              if (!name || seen.has(k)) continue;
              seen.add(k);
              items.push({
                title: name,
                location: addr,
                time: "",
                description: "",
                // photoUrl removed; SmartImage will fetch via Pexels using query
              });
            }
          } catch {}
        }
        items.sort((a, b) => 0); // keep discovery order
        const top = items.slice(0, 18);
        if (!ignore) setFallback(top);
      } finally {
        if (!ignore) setFinding(false);
      }
    }
    fetchFallback();
    return () => {
      ignore = true;
    };
  }, [baseAttractions, destination]);

  const attractions = useMemo(
    () => (baseAttractions.length ? baseAttractions : fallback),
    [baseAttractions, fallback]
  );

  // Enrich with Google Places data (ratings only; no photos)
  const [placeInfo, setPlaceInfo] = useState({});
  useEffect(() => {
    let ignore = false;
    async function load() {
      const results = {};
      const chunk = async (items, size) => {
        for (let i = 0; i < items.length; i += size) {
          const slice = items.slice(i, i + size);
          await Promise.all(
            slice.map(async (a) => {
              const q = [a?.title || "", a?.location || ""].filter(Boolean).join(" ");
              if (!q) return;
              try {
                const resp = await placesApi.search(q);
                const place = resp?.data?.places?.[0];
                if (place) {
                  results[q] = {
                    rating: place?.rating || null,
                    ratingCount: place?.userRatingCount || null,
                    // photoUrl removed
                  };
                }
              } catch (e) {
                // ignore individual errors
              }
            })
          );
        }
      };
      if (attractions.length) {
        await chunk(attractions, 3);
        if (!ignore) setPlaceInfo(results);
      } else {
        if (!ignore) setPlaceInfo({});
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [attractions]);

  const getInfo = (a) => {
    const q = [a?.title || "", a?.location || ""].filter(Boolean).join(" ");
    return placeInfo[q] || {};
  };

  // Bayesian rating-based ranking (minimal drop-in)
  const bayesianScore = (rating, count, C = 4.2, m = 50) => {
    const v = Number(count) || 0;
    const R = Number(rating) || 0;
    if (!R || !isFinite(R)) return 0;
    return (v / (v + m)) * R + (m / (v + m)) * C;
  };

  const sortedAttractions = useMemo(() => {
    // If no enrichment yet, keep original order
    if (!attractions.length) return [];
    return [...attractions].sort((a, b) => {
      const ia = getInfo(a);
      const ib = getInfo(b);
      const sa = bayesianScore(ia.rating, ia.ratingCount);
      const sb = bayesianScore(ib.rating, ib.ratingCount);
      // Remove photo bias; images now fetched via Pexels uniformly
      const photoBiasA = 0;
      const photoBiasB = 0;
      return sb + photoBiasB - (sa + photoBiasA);
    });
  }, [attractions, placeInfo]);

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

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Places to Visit</h2>
      <div
        ref={trackRef}
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
        onScroll={handleScroll}
        role="listbox"
        aria-label="Places to visit carousel"
      >
        {(sortedAttractions.length ? sortedAttractions : attractions).map((a, idx) => {
          const info = getInfo(a);
          const rating = info?.rating ?? "—";
          const location = a?.location || "";

          return (
            <article
              key={`${a?.title || idx}-${location}`}
              className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center"
            >
              {/* Image */}
              <div className="w-full overflow-hidden bg-muted [aspect-ratio:4/3] sm:[aspect-ratio:3/2] md:[aspect-ratio:16/9]">
                <SmartImage
                  query={`${a?.title || ""} ${location}`}
                  alt={a?.title || "Attraction"}
                  className="w-full h-full object-cover"
                  pexelsFallback={true}
                  sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="text-base font-semibold leading-tight line-clamp-2">
                    {a?.title || "Attraction"}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5" /> {location || "—"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 text-yellow-500" /> {rating}
                    </span>
                    <span className="text-right">{a?.time || ""}</span>
                  </div>

                  {a?.description && (
                    <p className="text-sm text-foreground/90 line-clamp-4">{a.description}</p>
                  )}

                  <div className="mt-auto pt-2">
                    <a href={googleMapsUrl(a?.title, location)} target="_blank" rel="noreferrer">
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
          {(sortedAttractions.length ? sortedAttractions : attractions).map((_, i) => (
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

export default React.memo(PlacesToVisit);
