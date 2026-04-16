import React, { useRef, useState, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, Navigation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const mapsUrl = (q) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;

function coalesceArray(obj, paths) {
  for (const p of paths) {
    const val = p.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
    if (Array.isArray(val) && val.length) return val;
  }
  return [];
}

export default function SuggestedDayTrips({ trip }) {
  const items = coalesceArray(trip, [
    "tripData.suggestedDayTrips",
    "suggestedDayTrips",
    "tripData.dayTrips",
    "dayTrips",
    "tripData.suggestedTrips",
    "suggestedTrips",
    "tripData.nearbyDayTrips",
    "nearbyDayTrips",
  ]);

  const destination =
    trip?.userSelection?.destination?.label ||
    trip?.userSelection?.location?.label ||
    trip?.tripData?.destination ||
    trip?.destination ||
    "";

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

  if (!items?.length) {
    return (
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Suggested Day Trips</h2>
        <p className="text-muted-foreground">No day trips suggested.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Suggested Day Trips</h2>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        aria-label="Suggested Day Trips carousel"
        role="region"
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
      >
        {items.map((raw, idx) => {
          const it = typeof raw === "string" ? { title: raw } : raw || {};
          const title = it?.title || it?.name || `Day Trip ${idx + 1}`;
          const location = it?.location || it?.distanceFrom || destination || "";
          const description = it?.description || it?.details || "";
          const distance = it?.distance || "";
          const highlights = Array.isArray(it?.highlights) ? it.highlights : [];
          const key = `${title}|${idx}`;

          return (
            <article key={key} className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center">
              {/* Distance badge */}
              {distance && (
                <span className="absolute top-3 left-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-600 text-white inline-flex items-center gap-1">
                  <Navigation className="size-3" /> {distance}
                </span>
              )}

              <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
                <SmartImage
                  query={`${title} tourist destination`}
                  alt={title}
                  className="w-full h-full object-cover"
                  pexelsFallback={true}
                  sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-[18px] leading-tight line-clamp-2">{title}</h3>

                {location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" /> <span className="line-clamp-1">{location}</span>
                  </p>
                )}

                {description && (
                  <p className="text-sm text-foreground/90 line-clamp-3">{description}</p>
                )}

                {/* Highlights */}
                {highlights.length > 0 && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Highlights</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {highlights.map((h, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground/80 border">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-2">
                  <a href={mapsUrl(`${title} ${location || destination}`)} target="_blank" rel="noreferrer">
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
          {items.map((_, i) => (
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
