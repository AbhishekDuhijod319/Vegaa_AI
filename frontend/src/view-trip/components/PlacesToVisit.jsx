import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Star, Clock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/api/places";

function googleMapsUrl(name, location) {
  const q = [name || "", location || ""].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function PlacesToVisit({ trip }) {
  const destination = useMemo(
    () =>
      trip?.userSelection?.destination?.label ||
      trip?.userSelection?.location?.label ||
      trip?.tripData?.destination ||
      trip?.destination ||
      "",
    [trip]
  );

  // PRIMARY: Read from tripData.placesToVisit (the AI-generated flat list)
  const basePlaces = useMemo(() => {
    const places = Array.isArray(trip?.tripData?.placesToVisit)
      ? trip.tripData.placesToVisit
      : Array.isArray(trip?.placesToVisit)
      ? trip.placesToVisit
      : [];

    // Map to consistent shape
    const mapped = places
      .filter((p) => p && (p.name || p.title))
      .map((p) => ({
        title: p.name || p.title,
        location: p.location || p.address || destination || "",
        description: p.description || p.details || "",
        bestTime: p.bestTime || "",
        entryFee: p.entryFee || "",
        timeNeeded: p.timeNeeded || "",
      }));

    // De-duplicate by title
    const seen = new Set();
    const uniq = [];
    for (const p of mapped) {
      const key = p.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(p);
      }
    }

    return uniq;
  }, [trip, destination]);

  // FALLBACK: If placesToVisit is empty, try extracting from itinerary activities
  const itineraryFallback = useMemo(() => {
    if (basePlaces.length > 0) return [];

    const days = Array.isArray(trip?.tripData?.itinerary)
      ? trip.tripData.itinerary
      : Array.isArray(trip?.itinerary)
      ? trip.itinerary
      : [];

    const entries = days.flatMap((d) => {
      if (Array.isArray(d?.activities)) return d.activities;
      const slots = [d?.morning, d?.afternoon, d?.evening].filter(Boolean);
      return slots.flatMap((slot) =>
        Array.isArray(slot?.activities) ? slot.activities : [slot]
      );
    });

    const mapped = entries
      .filter((a) => a && (a.title || a.name || a.activity))
      .map((a) => ({
        title: a.title || a.name || a.activity,
        location: a.location || a.address || destination || "",
        description: a.description || a.details || "",
        bestTime: a.time || "",
        entryFee: a.estimatedCost || "",
        timeNeeded: "",
      }));

    const seen = new Set();
    const uniq = [];
    for (const a of mapped) {
      const key = a.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(a);
      }
    }

    return uniq.slice(0, 18);
  }, [basePlaces, trip, destination]);

  // Google Places API fallback when both are empty
  const [googleFallback, setGoogleFallback] = useState([]);
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    let ignore = false;
    async function fetchFallback() {
      if (basePlaces.length > 0 || itineraryFallback.length > 0 || !destination) {
        setGoogleFallback([]);
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
              const k = name.toLowerCase().trim();
              if (!name || seen.has(k)) continue;
              seen.add(k);
              items.push({
                title: name,
                location: addr,
                description: "",
                bestTime: "",
                entryFee: "",
                timeNeeded: "",
              });
            }
          } catch {}
        }
        const top = items.slice(0, 18);
        if (!ignore) setGoogleFallback(top);
      } finally {
        if (!ignore) setFinding(false);
      }
    }
    fetchFallback();
    return () => { ignore = true; };
  }, [basePlaces, itineraryFallback, destination]);

  // Final merged list: placesToVisit → itinerary fallback → Google fallback
  const attractions = useMemo(
    () =>
      basePlaces.length > 0
        ? basePlaces
        : itineraryFallback.length > 0
        ? itineraryFallback
        : googleFallback,
    [basePlaces, itineraryFallback, googleFallback]
  );

  // Enrich with Google Places data (ratings only)
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
                    photoRef: place?.photoRef || null,
                  };
                }
              } catch {}
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
    return () => { ignore = true; };
  }, [attractions]);

  const getInfo = (a) => {
    const q = [a?.title || "", a?.location || ""].filter(Boolean).join(" ");
    return placeInfo[q] || {};
  };

  // Dot pagination and scroll tracking
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

  if (attractions.length === 0) return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Places to Visit</h2>
      <p className="text-muted-foreground">{finding ? "Finding places nearby..." : "No places found."}</p>
    </div>
  );

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
        {attractions.map((a, idx) => {
          const info = getInfo(a);
          const rating = info?.rating ?? null;
          const location = a?.location || "";

          return (
            <article
              key={`${a?.title || idx}-${location}`}
              className="group relative rounded-2xl border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col snap-center"
            >
              {/* Image */}
              <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2]">
                <SmartImage
                  query={`${a?.title || ""} ${destination} landmark`}
                  alt={a?.title || "Attraction"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  googlePhotoRef={info?.photoRef}
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

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 text-yellow-500" /> {rating}
                    </span>
                  )}
                  {a?.entryFee && (
                    <span className="inline-flex items-center gap-1">
                      <Ticket className="size-3.5" /> {a.entryFee}
                    </span>
                  )}
                  {a?.timeNeeded && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {a.timeNeeded}
                    </span>
                  )}
                </div>

                {a?.bestTime && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Best time:</span> {a.bestTime}
                  </p>
                )}

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
          {attractions.map((_, i) => (
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
