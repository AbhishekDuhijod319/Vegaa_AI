import React, { useMemo, useRef, useState, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === "object") return val;
  }
  return null;
}

function ChipList({ title, items }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((t, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-foreground/90 border">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function AccessibilityFooter({ tips }) {
  if (!tips) return null;
  const items = Array.isArray(tips) ? tips.slice(0, 6) : [tips];
  if (!items.length) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <h4 className="text-sm font-semibold text-muted-foreground">Accessibility Guidelines</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-foreground/90 border">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;

function normalizeList(items, destination = "") {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((raw, idx) => {
      if (typeof raw === "string") {
        return { title: raw, location: destination, description: "" };
      }
      const t = raw || {};
      return {
        title: t.title || t.name || `Place ${idx + 1}`,
        location: t.location || destination || "",
        description: t.description || t.details || "",
      };
    })
    .filter((x) => x.title);
}

export default function Extras({ trip }) {
  const extras = coalesceObject(trip, ["tripData.extras", "extras"]);

  const destination = useMemo(
    () =>
      trip?.userSelection?.destination?.label ||
      trip?.userSelection?.location?.label ||
      trip?.tripData?.destination ||
      trip?.destination ||
      "",
    [trip]
  );

  if (!extras) {
    return (
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Extras</h2>
        <p className="text-muted-foreground">No extras found for this trip.</p>
      </div>
    );
  }

  const rainy = normalizeList(extras?.rainyDayIdeas, destination);
  const night = normalizeList(extras?.nightlife, destination);
  const family = normalizeList(extras?.familyFriendly, destination);

  // Shared carousel helpers
  const useDots = () => {
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
    return { trackRef, handleScroll, currentIdx, goTo };
  };

  const rainyDots = useDots();
  const nightDots = useDots();
  const familyDots = useDots();

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Extras</h2>

      {/* Must Visit Places */}
      {rainy.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3 bg-slate-500 text-white rounded-md max-w-full text-center px-2 py-1">Must Visit Places</h3>
          <div
            ref={rainyDots.trackRef}
            onScroll={rainyDots.handleScroll}
            aria-label="Must Visit Places carousel"
            role="region"
            className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
          >
            {rainy.map((it, idx) => (
              <article
                key={`${it.title}|${idx}`}
                className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center" 
              >
                <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
                  <SmartImage
                    query={`${it.title} ${it.location || destination}`}
                    alt={it.title}
                    className="w-full h-full object-cover"
                    pexelsFallback={true}
                    sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="text-base font-semibold leading-tight line-clamp-2">{it.title}</h4>
                  {it.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3.5" /> {it.location}
                    </p>
                  )}
                  {it.description && (
                    <p className="text-sm text-foreground/90 line-clamp-4">{it.description}</p>
                  )}
                  <div className="mt-auto pt-2">
                    <a href={mapsUrl(`${it.title} ${it.location || destination}`)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="w-full">View on Map</Button>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-center mt-4 lg:hidden" aria-label="Carousel pagination">
            <div className="inline-flex items-center gap-2">
              {rainy.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to card ${i + 1}`}
                  aria-current={i === rainyDots.currentIdx ? 'true' : undefined}
                  onClick={() => rainyDots.goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === rainyDots.currentIdx ? 'bg-foreground w-6' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nightlife */}
      {night.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3  bg-slate-500 text-white rounded-md max-w-full text-center px-2 py-1">Nightlife</h3>
          <div
            ref={nightDots.trackRef}
            onScroll={nightDots.handleScroll}
            aria-label="Nightlife carousel"
            role="region"
            className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
          >
            {night.map((it, idx) => (
              <article
                key={`${it.title}|${idx}`}
                className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center"
              >
                <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
                  <SmartImage
                    query={`${it.title} ${it.location || destination}`}
                    alt={it.title}
                    className="w-full h-full object-cover"
                    pexelsFallback={true}
                    sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="text-base font-semibold leading-tight line-clamp-2">{it.title}</h4>
                  {it.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3.5" /> {it.location}
                    </p>
                  )}
                  {it.description && (
                    <p className="text-sm text-foreground/90 line-clamp-4">{it.description}</p>
                  )}
                  <div className="mt-auto pt-2">
                    <a href={mapsUrl(`${it.title} ${it.location || destination}`)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="w-full">View on Map</Button>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-center mt-4 lg:hidden" aria-label="Carousel pagination">
            <div className="inline-flex items-center gap-2">
              {night.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to card ${i + 1}`}
                  aria-current={i === nightDots.currentIdx ? 'true' : undefined}
                  onClick={() => nightDots.goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === nightDots.currentIdx ? 'bg-foreground w-6' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Family Friendly */}
      {family.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3  bg-slate-500 text-white rounded-md max-w-full text-center px-2 py-1">Family Friendly</h3>
          <div
            ref={familyDots.trackRef}
            onScroll={familyDots.handleScroll}
            aria-label="Family Friendly carousel"
            role="region"
            className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
          >
            {family.map((it, idx) => (
              <article
                key={`${it.title}|${idx}`}
                className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center"
              >
                <div className="w-full overflow-hidden bg-muted aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
                  <SmartImage
                    query={`${it.title} ${it.location || destination}`}
                    alt={it.title}
                    className="w-full h-full object-cover"
                    pexelsFallback={true}
                    sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="text-base font-semibold leading-tight line-clamp-2">{it.title}</h4>
                  {it.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3.5" /> {it.location}
                    </p>
                  )}
                  {it.description && (
                    <p className="text-sm text-foreground/90 line-clamp-4">{it.description}</p>
                  )}
                  <div className="mt-auto pt-2">
                    <a href={mapsUrl(`${it.title} ${it.location || destination}`)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="w-full">View on Map</Button>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-center mt-4 lg:hidden" aria-label="Carousel pagination">
            <div className="inline-flex items-center gap-2">
              {family.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to card ${i + 1}`}
                  aria-current={i === familyDots.currentIdx ? 'true' : undefined}
                  onClick={() => familyDots.goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${i === familyDots.currentIdx ? 'bg-foreground w-6' : 'bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}