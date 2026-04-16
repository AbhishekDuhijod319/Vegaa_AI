import React, { useMemo, useRef, useState, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { MapPin, CloudRain, Moon, Users, Backpack, Sun, BookOpen, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === "object") return val;
  }
  return null;
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

/* ── Reusable carousel hook ────────────────────────── */
function useCarousel() {
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
}

/* ── Card carousel sub-component ─────────────────── */
function CardCarousel({ items, destination, label, carousel }) {
  if (!items.length) return null;
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3">{label}</h3>
      <div
        ref={carousel.trackRef}
        onScroll={carousel.handleScroll}
        aria-label={`${label} carousel`}
        role="region"
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
      >
        {items.map((it, idx) => (
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
                  <MapPin className="size-3.5 shrink-0" /> <span className="line-clamp-1">{it.location}</span>
                </p>
              )}
              {it.description && (
                <p className="text-sm text-foreground/90 line-clamp-3">{it.description}</p>
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
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === carousel.currentIdx ? 'true' : undefined}
              onClick={() => carousel.goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === carousel.currentIdx ? 'bg-foreground w-6' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Chip grid for simple string arrays ───────────── */
function ChipSection({ icon: Icon, title, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((item, i) => (
          <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground/90 border leading-snug">
            {typeof item === 'string' ? item : item?.title || item?.name || JSON.stringify(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Info card for single string values ───────────── */
function InfoCard({ icon: Icon, title, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{value}</p>
    </div>
  );
}

/* ── Main component ───────────────────────────────── */
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

  // Carousels must be called unconditionally (React hooks rule)
  const rainyCarousel = useCarousel();
  const nightCarousel = useCarousel();
  const familyCarousel = useCarousel();

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

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6">Extras</h2>

      {/* Card carousels */}
      <CardCarousel items={rainy} destination={destination} label="☔ Rainy Day Ideas" carousel={rainyCarousel} />
      <CardCarousel items={night} destination={destination} label="🌙 Nightlife" carousel={nightCarousel} />
      <CardCarousel items={family} destination={destination} label="👨‍👩‍👧‍👦 Family Friendly" carousel={familyCarousel} />

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard icon={Sun} title="Best Time to Visit" value={extras?.bestTimeToVisit} />
        <ChipSection icon={Backpack} title="Packing Tips" items={extras?.packingTips} />
        <ChipSection icon={BookOpen} title="Local Customs" items={extras?.localCustoms} />
        <ChipSection icon={Smartphone} title="Useful Apps" items={extras?.usefulApps} />
      </div>
    </div>
  );
}