import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWJoaXNoZWsyMDAzIiwiYSI6ImNtZWs2YTExZzAzMnoyanF5NGk1enVvcmYifQ.iWLd35-L0t_F2_47CJ9r9w";

// ── Category config ──────────────────────────────────────────────────
const CATEGORIES = {
  origin:      { color: "#6366f1", label: "Origin",        emoji: "🏠", order: 0 },
  destination: { color: "#ec4899", label: "Destination",   emoji: "📌", order: 1 },
  hotel:       { color: "#f59e0b", label: "Hotels",        emoji: "🏨", order: 2 },
  restaurant:  { color: "#ef4444", label: "Restaurants",   emoji: "🍽️", order: 3 },
  place:       { color: "#3b82f6", label: "Places",        emoji: "📍", order: 4 },
  market:      { color: "#a855f7", label: "Markets",       emoji: "🛍️", order: 5 },
  neighbourhood: { color: "#14b8a6", label: "Neighbourhoods", emoji: "🏘️", order: 6 },
  dayTrip:     { color: "#22c55e", label: "Day Trips",     emoji: "🚗", order: 7 },
  extra:       { color: "#f97316", label: "Extras",        emoji: "✨", order: 8 },
};

// Map user's transport mode to Mapbox Directions profile
const TRANSPORT_PROFILES = {
  flight: "driving",    // no flight profile; driving is closest
  train: "driving",     // no rail profile; driving is closest
  car: "driving",
  bus: "driving",
  bike: "cycling",
  bicycle: "cycling",
  walk: "walking",
  walking: "walking",
};

// ── Extract all locations ────────────────────────────────────────────
function extractLocations(trip) {
  const locations = [];
  const seen = new Set();

  const add = (name, category, detail, coords) => {
    const key = (name || "").trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    locations.push({ name: name.trim(), category, detail: detail || "", coords: coords || null });
  };

  const originLabel = trip?.userSelection?.origin?.label || trip?.userSelection?.location?.label || trip?.userSelection?.origin || "";
  const destLabel = trip?.userSelection?.destination?.label || trip?.tripData?.destination || trip?.destination || "";

  if (originLabel) add(originLabel, "origin", "Starting point", null);
  if (destLabel) add(destLabel, "destination", "Destination", null);

  (trip?.tripData?.hotels || []).forEach((h) => {
    if (h?.name || h?.hotelName) add(h.name || h.hotelName, "hotel", h?.priceRange || "", h?.coordinates);
  });

  (trip?.tripData?.restaurants || []).forEach((r) => {
    if (r?.name || r?.restaurantName) add(r.name || r.restaurantName, "restaurant", r?.cuisine || "", r?.coordinates);
  });

  (Array.isArray(trip?.tripData?.itinerary) ? trip.tripData.itinerary : []).forEach((day) => {
    const acts = Array.isArray(day?.activities) ? day.activities
      : [day?.morning, day?.afternoon, day?.evening].filter(Boolean).flatMap((s) => (Array.isArray(s?.activities) ? s.activities : [s]));
    acts.forEach((a) => {
      const name = a?.title || a?.name || a?.activity;
      if (name) add(name, "place", a?.estimatedCost || "", a?.coordinates);
    });
  });

  (trip?.tripData?.placesToVisit || []).forEach((p) => {
    if (p?.name || p?.title) add(p.name || p.title, "place", p?.entryFee || "", p?.coordinates);
  });

  const markets = trip?.tripData?.markets || trip?.tripData?.shopping || [];
  (Array.isArray(markets) ? markets : []).forEach((m) => {
    if (m?.name || m?.marketName) add(m.name || m.marketName, "market", m?.type || "", m?.coordinates);
  });

  (trip?.tripData?.neighbourhoods || []).forEach((n) => {
    const name = typeof n === "string" ? n : n?.name || n?.neighbourhood;
    if (name) add(name, "neighbourhood", "", typeof n === "object" ? n?.coordinates : null);
  });

  const dayTrips = trip?.tripData?.suggestedDayTrips || trip?.tripData?.dayTrips || [];
  (Array.isArray(dayTrips) ? dayTrips : []).forEach((dt) => {
    const name = typeof dt === "string" ? dt : dt?.name || dt?.destination;
    if (name) add(name, "dayTrip", dt?.distance || "", typeof dt === "object" ? dt?.coordinates : null);
  });

  return locations;
}

// ── Geocode fallback ─────────────────────────────────────────────────
async function geocode(query) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    if (data.features?.[0]?.center) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch { /* silent */ }
  return null;
}

/**
 * TripMap
 *
 * @param {object} trip — trip data
 * @param {string} transportMode — user's selected transport (flight/train/car/etc.)
 * @param {string} className
 */
export default function TripMap({ trip, transportMode = "", className = "" }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [phase, setPhase] = useState("globe");
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  const [legendOpen, setLegendOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const locations = useMemo(() => extractLocations(trip), [trip]);
  const dirProfile = TRANSPORT_PROFILES[(transportMode || "").toLowerCase()] || "driving";

  // ── Init map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 20.5937],
      zoom: 1.5,
      projection: "globe",
      attributionControl: false,
      antialias: true,
    });

    m.on("style.load", () => {
      m.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });
    });

    m.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
    m.on("load", () => setMapLoaded(true));
    map.current = m;

    return () => { m.remove(); map.current = null; };
  }, []);

  // ── Resize map on fullscreen toggle + lock body scroll ─────────────
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Mapbox needs multiple resize nudges as the CSS transition completes
    if (map.current) {
      const timers = [50, 150, 300, 500, 800].map((ms) =>
        setTimeout(() => map.current?.resize(), ms)
      );
      return () => {
        timers.forEach(clearTimeout);
        document.body.style.overflow = "";
      };
    }

    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  // ── Toggle category ────────────────────────────────────────────────
  const toggleCategory = useCallback((cat) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      (markersRef.current[cat] || []).forEach((m) => {
        m.getElement().style.display = next.has(cat) ? "none" : "flex";
      });
      return next;
    });
  }, []);

  // ── Fullscreen toggle ──────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Close fullscreen on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

  // ── Build markers & routes ─────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !map.current || locations.length === 0) return;
    let cancelled = false;

    const build = async () => {
      const bounds = new mapboxgl.LngLatBounds();
      const resolved = [];
      let originCoords = null;
      let destCoords = null;

      // Resolve all coordinates
      for (let i = 0; i < locations.length; i++) {
        if (cancelled) return;
        const loc = locations[i];
        let coords = null;

        if (loc.coords && Number.isFinite(loc.coords.lat) && Number.isFinite(loc.coords.lng)) {
          coords = [loc.coords.lng, loc.coords.lat];
        } else {
          const geo = await geocode(loc.name);
          if (geo) coords = [geo.lng, geo.lat];
          if (i < locations.length - 1) await new Promise((r) => setTimeout(r, 80));
        }

        if (coords) {
          resolved.push({ ...loc, lngLat: coords });
          bounds.extend(coords);
          if (loc.category === "origin") originCoords = coords;
          if (loc.category === "destination") destCoords = coords;
        }
      }

      if (cancelled || resolved.length === 0) return;

      // Fly from globe
      setPhase("flying");
      const center = bounds.getCenter();
      map.current.flyTo({
        center: [center.lng, center.lat],
        zoom: 12, pitch: 50, bearing: -20,
        duration: 4500, curve: 1.5, essential: true,
      });

      await new Promise((r) => setTimeout(r, 3500));
      if (cancelled) return;

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 70, bottom: 50, left: 50, right: 50 },
          maxZoom: 14, duration: 2000, pitch: 0, bearing: 0,
        });
      }

      await new Promise((r) => setTimeout(r, 1500));
      if (cancelled) return;
      setPhase("ready");

      // Add markers
      markersRef.current = {};
      for (let i = 0; i < resolved.length; i++) {
        if (cancelled) return;
        const loc = resolved[i];
        const cat = CATEGORIES[loc.category] || CATEGORIES.place;
        const isKeyPoint = loc.category === "origin" || loc.category === "destination";

        const el = document.createElement("div");
        el.style.cssText = `
          display:flex; flex-direction:column; align-items:center;
          cursor:pointer; opacity:0; transform:scale(0.3);
          transition: opacity 0.4s ease, transform 0.4s ease;
          pointer-events:auto;
        `;

        // Bigger marker for origin/destination, smaller for others
        const dotSize = isKeyPoint ? 20 : 14;
        const dot = document.createElement("div");
        dot.style.cssText = `
          width:${dotSize}px; height:${dotSize}px; border-radius:50%;
          background:${cat.color}; border:${isKeyPoint ? 3 : 2.5}px solid white;
          box-shadow:0 1px 6px rgba(0,0,0,0.5);
          transition: transform 0.15s;
          ${isKeyPoint ? `box-shadow: 0 0 0 4px ${cat.color}40, 0 2px 8px rgba(0,0,0,0.5);` : ""}
        `;

        const label = document.createElement("div");
        const fontSize = isKeyPoint ? "10px" : "9px";
        const fontWeight = isKeyPoint ? "700" : "600";
        label.style.cssText = `
          margin-top:2px; padding:1px 4px; border-radius:3px;
          background:rgba(0,0,0,0.75); color:white;
          font-size:${fontSize}; font-weight:${fontWeight}; font-family:system-ui,sans-serif;
          white-space:nowrap; max-width:${isKeyPoint ? "160px" : "100px"}; overflow:hidden;
          text-overflow:ellipsis; pointer-events:none;
        `;
        const displayName = loc.name.length > 18 ? loc.name.slice(0, 16) + "…" : loc.name;
        label.textContent = isKeyPoint ? `${cat.emoji} ${displayName}` : displayName;

        el.appendChild(dot);
        el.appendChild(label);

        el.addEventListener("mouseenter", () => {
          dot.style.transform = "scale(1.5)";
          dot.style.boxShadow = `0 0 12px ${cat.color}`;
          label.style.maxWidth = "220px";
          label.textContent = `${cat.emoji} ${loc.name}`;
          el.style.zIndex = "100";
        });
        el.addEventListener("mouseleave", () => {
          dot.style.transform = "scale(1)";
          dot.style.boxShadow = isKeyPoint
            ? `0 0 0 4px ${cat.color}40, 0 2px 8px rgba(0,0,0,0.5)`
            : "0 1px 6px rgba(0,0,0,0.5)";
          label.style.maxWidth = isKeyPoint ? "160px" : "100px";
          label.textContent = isKeyPoint ? `${cat.emoji} ${displayName}` : displayName;
          el.style.zIndex = "1";
        });

        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "scale(1)";
        }, 200 + i * 50);

        const popup = new mapboxgl.Popup({
          offset: 12, closeButton: true, closeOnClick: false,
          className: "trip-map-popup", maxWidth: "240px",
        }).setHTML(`
          <div style="padding:8px 10px;font-family:system-ui,sans-serif;">
            <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:4px;">${cat.emoji} ${loc.name}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5);">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cat.color};margin-right:4px;vertical-align:middle;"></span>
              ${cat.label}${loc.detail ? ` · ${loc.detail}` : ""}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(loc.lngLat).setPopup(popup).addTo(map.current);

        if (!markersRef.current[loc.category]) markersRef.current[loc.category] = [];
        markersRef.current[loc.category].push(marker);
      }

      // ── Route 1: Origin → Destination (user's transport mode) ──────
      if (originCoords && destCoords && map.current && !cancelled) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/${dirProfile}/${originCoords.join(",")};${destCoords.join(",")}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
          );
          const data = await res.json();
          if (data.routes?.[0]?.geometry && !cancelled) {
            map.current.addSource("travel-route", { type: "geojson", data: data.routes[0].geometry });
            map.current.addLayer({
              id: "travel-route-glow", type: "line", source: "travel-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#6366f1", "line-width": 10, "line-opacity": 0.15, "line-blur": 6 },
            });
            map.current.addLayer({
              id: "travel-route-line", type: "line", source: "travel-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#6366f1", "line-width": 4, "line-opacity": 0.9 },
            });
          }
        } catch {
          // Fallback: straight line
          if (map.current && !cancelled) {
            map.current.addSource("travel-route", {
              type: "geojson",
              data: { type: "Feature", geometry: { type: "LineString", coordinates: [originCoords, destCoords] } },
            });
            map.current.addLayer({
              id: "travel-route-line", type: "line", source: "travel-route",
              paint: { "line-color": "#6366f1", "line-width": 3, "line-opacity": 0.6, "line-dasharray": [6, 3] },
            });
          }
        }
      }

      // ── Route 2: Places to visit route (within destination) ────────
      const placeCoords = resolved
        .filter((l) => ["place", "hotel", "destination"].includes(l.category))
        .map((l) => l.lngLat);

      if (placeCoords.length >= 2 && map.current && !cancelled) {
        try {
          const waypoints = placeCoords.slice(0, 25);
          const coordsStr = waypoints.map((c) => c.join(",")).join(";");
          const res = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
          );
          const data = await res.json();
          if (data.routes?.[0]?.geometry && !cancelled) {
            map.current.addSource("trip-route", { type: "geojson", data: data.routes[0].geometry });
            map.current.addLayer({
              id: "trip-route-glow", type: "line", source: "trip-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#a78bfa", "line-width": 8, "line-opacity": 0.15, "line-blur": 5 },
            });
            map.current.addLayer({
              id: "trip-route-line", type: "line", source: "trip-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#a78bfa", "line-width": 3, "line-opacity": 0.85 },
            });
          }
        } catch {
          if (map.current && !cancelled) {
            map.current.addSource("trip-route", {
              type: "geojson",
              data: { type: "Feature", geometry: { type: "LineString", coordinates: placeCoords } },
            });
            map.current.addLayer({
              id: "trip-route-line", type: "line", source: "trip-route",
              paint: { "line-color": "#a78bfa", "line-width": 2, "line-opacity": 0.5, "line-dasharray": [4, 2] },
            });
          }
        }
      }
    };

    build();

    return () => {
      cancelled = true;
      Object.values(markersRef.current).flat().forEach((m) => m.remove());
      markersRef.current = {};
      ["trip-route-line", "trip-route-glow", "travel-route-line", "travel-route-glow"].forEach((id) => {
        if (map.current?.getLayer(id)) map.current.removeLayer(id);
      });
      ["trip-route", "travel-route"].forEach((id) => {
        if (map.current?.getSource(id)) map.current.removeSource(id);
      });
    };
  }, [mapLoaded, locations, dirProfile]);

  const activeCategories = useMemo(() => {
    const cats = new Set(locations.map((l) => l.category));
    return Object.keys(CATEGORIES).filter((k) => cats.has(k));
  }, [locations]);

  // ── Fullscreen wrapper classes ─────────────────────────────────────
  const wrapperClass = isFullscreen
    ? "trip-map-fullscreen fixed inset-0 z-[9999] bg-black trip-map-bounce-in"
    : `relative w-full h-full rounded-xl overflow-hidden ${className}`;

  return (
    <div ref={containerRef} className={wrapperClass}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Globe phase */}
      {phase === "globe" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="text-4xl">🌍</span>
            <span className="text-white/80 text-xs font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
              Locating your destinations...
            </span>
          </div>
        </div>
      )}

      {/* Flying phase */}
      {phase === "flying" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
            <span className="animate-bounce">✈️</span> Flying to destination...
          </div>
        </div>
      )}

      {/* ── Top-right controls: Fullscreen + location count ────────── */}
      {phase === "ready" && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {/* Location count */}
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
            📍 {locations.length} locations
          </div>
        </div>
      )}

      {/* Fullscreen toggle button */}
      {phase === "ready" && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-14 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      )}

      {/* Close button in fullscreen */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-colors text-lg font-bold"
          title="Close fullscreen (Esc)"
        >
          ✕
        </button>
      )}

      {/* Trip info panel in fullscreen */}
      {isFullscreen && phase === "ready" && (
        <div className="absolute top-4 left-4 z-10 max-w-xs">
          <div className="px-4 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white space-y-2">
            <h3 className="font-bold text-sm">
              {trip?.userSelection?.destination?.label || trip?.tripData?.destination || "Trip Map"}
            </h3>
            {trip?.userSelection?.origin?.label && (
              <div className="text-[11px] text-white/60 flex items-center gap-1.5">
                🏠 From: {trip.userSelection.origin.label}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {trip?.userSelection?.noOfDays && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                  📅 {trip.userSelection.noOfDays} days
                </span>
              )}
              {transportMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                  🚀 {transportMode.charAt(0).toUpperCase() + transportMode.slice(1)}
                </span>
              )}
              {trip?.userSelection?.numTravelers && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">
                  👥 {trip.userSelection.numTravelers}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend with category toggles */}
      {phase === "ready" && activeCategories.length > 0 && (
        <div className={`absolute ${isFullscreen ? "bottom-6 left-6" : "bottom-3 left-3"} z-10`}>
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10 hover:bg-black/70 transition-colors"
          >
            🗺️ {legendOpen ? "Hide Legend" : "Show Legend"}
          </button>

          {legendOpen && (
            <div className="mt-2 px-2 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[140px]">
              {activeCategories.map((cat) => {
                const c = CATEGORIES[cat];
                const isHidden = hiddenCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-[11px] transition-all ${
                      isHidden ? "text-white/30 hover:text-white/50" : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                      style={{ background: c.color, opacity: isHidden ? 0.2 : 1 }} />
                    <span>{c.emoji}</span>
                    <span className={isHidden ? "line-through" : ""}>{c.label}</span>
                  </button>
                );
              })}
              {/* Route legend */}
              <div className="pt-1 mt-1 border-t border-white/10 px-2 space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="w-4 h-[3px] bg-indigo-500 rounded" /> Travel Route
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="w-4 h-[3px] bg-violet-400 rounded" /> Visit Route
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .trip-map-popup .mapboxgl-popup-content {
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .trip-map-popup .mapboxgl-popup-tip { border-top-color: rgba(15, 23, 42, 0.92); }
        .trip-map-popup .mapboxgl-popup-close-button { color: rgba(255,255,255,0.4); font-size: 14px; padding: 2px 6px; }
        .trip-map-popup .mapboxgl-popup-close-button:hover { color: white; background: transparent; }
        .mapboxgl-ctrl-attrib { font-size: 9px !important; opacity: 0.4; }

        /* Fullscreen container */
        .trip-map-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100vh !important;
        }
        .trip-map-fullscreen .mapboxgl-map {
          width: 100% !important;
          height: 100% !important;
        }

        /* Bounce-in animation */
        @keyframes tripMapBounceIn {
          0%   { transform: scale(0.92); opacity: 0.8; }
          40%  { transform: scale(1.02); opacity: 1; }
          70%  { transform: scale(0.99); }
          100% { transform: scale(1); }
        }
        .trip-map-bounce-in {
          animation: tripMapBounceIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
