import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import SmartImage from "@/components/ui/SmartImage";
import { Globe, MapPin, Star, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placesApi } from "@/api/places";

function googleMapsUrl(name, location) {
  const q = [name || "", location || ""].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function formatINR(value) {
  if (!value && value !== 0) return "—";
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.]/g, ''));
  if (isNaN(num)) return typeof value === 'string' ? value : "—";
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

function formatPriceRange(priceRange, pricePerNight) {
  // Prefer pricePerNight numeric value for consistent INR formatting
  if (pricePerNight && typeof pricePerNight === 'number') {
    return `${formatINR(pricePerNight)}/night`;
  }
  if (priceRange) {
    // If it already has ₹ symbol, return as-is
    if (String(priceRange).includes('₹')) return priceRange;
    // Try to extract numbers and format
    const m = /(\d[\d,]*)\s*-\s*(\d[\d,]*)/.exec(String(priceRange));
    if (m) return `₹${m[1]} - ₹${m[2]} per night`;
    return priceRange;
  }
  return "—";
}

const CATEGORY_STYLES = {
  budget: { label: "Budget", className: "bg-green-600 text-white" },
  "mid-range": { label: "Mid-Range", className: "bg-blue-600 text-white" },
  premium: { label: "Premium", className: "bg-amber-600 text-white" },
};

function Hotels({ trip }) {
  const hotels = Array.isArray(trip?.tripData?.hotels)
    ? trip.tripData.hotels
    : Array.isArray(trip?.hotels)
      ? trip.hotels
      : [];

  const list = hotels;

  // Resolve rich place info (website, opening hours)
  const [placeInfo, setPlaceInfo] = useState({});
  useEffect(() => {
    let ignore = false;
    async function load() {
      const results = {};
      const chunk = async (items, size) => {
        for (let i = 0; i < items.length; i += size) {
          const slice = items.slice(i, i + size);
          await Promise.all(slice.map(async (h) => {
            const q = [h?.name || "", h?.location || ""].filter(Boolean).join(" ");
            if (!q) return;
            try {
              const resp = await placesApi.search(q);
              const place = resp?.data?.places?.[0];
              if (place) {
                results[q] = {
                  website: place?.websiteUri || null,
                  opening: place?.currentOpeningHours || null,
                };
              }
            } catch {
              // ignore individual errors
            }
          }));
        }
      };
      await chunk(list.slice(0, 9), 3);
      if (!ignore) setPlaceInfo(results);
    }
    load();
    return () => { ignore = true };
  }, [list]);

  const getInfo = (h) => {
    const q = [h?.name || "", h?.location || ""].filter(Boolean).join(" ");
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
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setCurrentIdx(closestIdx);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      updateActive();
    });
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
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Hotel Recommendations</h2>
      <div
        ref={trackRef}
        className="grid gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth grid-flow-col auto-cols-[minmax(280px,85vw)] sm:auto-cols-[minmax(320px,75vw)] md:auto-cols-[minmax(360px,45%)] min-[1200px]:grid-flow-row min-[1200px]:grid-cols-3 min-[1200px]:overflow-visible"
        onScroll={handleScroll}
        role="listbox"
        aria-label="Hotel recommendations carousel"
      >
        {list.map((hotel) => {
          const isOYO = typeof hotel?.name === 'string' && /\boyo\b/i.test(hotel.name);
          const location = hotel?.location || "";
          const rating = hotel?.rating ?? "—";
          const priceDisplay = formatPriceRange(hotel?.priceRange, hotel?.pricePerNight);
          const info = getInfo(hotel);
          const qKey = [hotel?.name || "", location].filter(Boolean).join(" ");
          const category = hotel?.category || "";
          const catStyle = CATEGORY_STYLES[category];

          // Derive check-in/out times when available from opening hours text
          const checkInOut = (() => {
            const periods = info?.opening?.weekdayDescriptions || [];
            const line = periods.find((s) => /check[- ]?in|check[- ]?out/i.test(s)) || "";
            return line || null;
          })();

          return (
            <article key={qKey} className="relative rounded-2xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col snap-center">
              {/* Category badge */}
              {catStyle && (
                <span className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold ${catStyle.className}`}>
                  {catStyle.label}
                </span>
              )}

              {/* Image */}
              <div className="w-full overflow-hidden bg-muted [aspect-ratio:4/3] sm:[aspect-ratio:3/2] md:[aspect-ratio:16/9]">
                <SmartImage
                  query={`${hotel?.name || ""} ${location}`}
                  alt={hotel?.name || "Hotel"}
                  className="w-full h-full object-cover"
                  pexelsFallback={true}
                  sizes="(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[18px] leading-tight line-clamp-2">
                    {hotel?.name || "Hotel"}
                  </h3>
                  {isOYO && (
                    <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs bg-red-600 text-white">OYO</span>
                  )}
                </div>

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

                {/* Description and amenities */}
                {hotel?.description && (
                  <p className="text-sm text-foreground/90 line-clamp-3">{hotel.description}</p>
                )}
                {Array.isArray(hotel?.amenities) && hotel.amenities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground">Amenities</h4>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {hotel.amenities.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground/80 border">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website and check-in/out when available */}
                {(info?.website || checkInOut) && (
                  <div className="text-xs text-muted-foreground flex flex-col gap-1">
                    {info?.website && (
                      <a href={info.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground hover:underline">
                        <Globe className="size-3.5" /> Official website
                      </a>
                    )}
                    {checkInOut && <div>{checkInOut}</div>}
                  </div>
                )}

                <div className="mt-auto pt-2">
                  <a href={googleMapsUrl(hotel?.name, location)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="w-full">View on Map</Button>
                  </a>
                </div>
              </div>
            </article>
          );
        })}

        {list.length === 0 && (
          <div className="text-muted-foreground p-3">No hotels found.</div>
        )}
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
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === currentIdx ? "bg-foreground w-6" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Hotels);
