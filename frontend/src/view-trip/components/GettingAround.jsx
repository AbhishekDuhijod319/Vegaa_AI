import React, { useMemo } from "react";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split('.')?.reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === 'object') return val;
  }
  return null;
}

function normalizeItems(items, destination = "") {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((raw, idx) => {
      if (typeof raw === "string") {
        return { title: raw, description: "" };
      }
      const t = raw || {};
      return {
        title: t.title || t.name || `Item ${idx + 1}`,
        description: t.description || t.details || t.text || "",
        whereToBuy: t.whereToBuy || "",
        priceRange: t.priceRange || "",
        validity: t.validity || "",
        time: t.time,
        mode: t.mode,
      };
    })
    .filter((x) => x.title);
}

export default function GettingAround({ trip }) {
  const ga = coalesceObject(trip, [
    "tripData.gettingAround",
    "gettingAround",
    "tripData.transportation",
    "transportation",
  ]);

  const destination = useMemo(
    () =>
      trip?.userSelection?.destination?.label ||
      trip?.userSelection?.location?.label ||
      trip?.tripData?.destination ||
      trip?.destination ||
      "",
    [trip]
  );

  if (!ga) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Getting Around</h2>
        <p className="text-muted-foreground">No transport guidance available.</p>
      </div>
    );
  }

  const transitTypes = normalizeItems(ga?.publicTransit?.types, destination);
  const transitTips = normalizeItems(ga?.publicTransit?.tips, destination);
  const walkingBikingTips = normalizeItems([ga?.walkingBiking?.tips].filter(Boolean), destination);
  const rideOptions = normalizeItems(ga?.rideHailing?.options, destination);
  const approxCost = ga?.rideHailing?.approximateCost || "";
  const passCards = normalizeItems(ga?.cardsAndPasses, destination);
  const travelTimeCards = normalizeItems(ga?.typicalTravelTimes, destination);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Getting Around</h2>

      {ga?.overview && (
        <article className="rounded-2xl border bg-card p-4 mb-6">
          <h3 className="text-base font-semibold">Overview</h3>
          <p className="text-sm text-foreground/90 mt-2">{ga.overview}</p>
        </article>
      )}

      {(transitTypes.length > 0 || transitTips.length > 0) && (
        <div className="mb-6">
          <h3 className="section-subheading">Public Transit</h3>
          {transitTypes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Transit Types</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90 mt-2">
                {transitTypes.map((it, idx) => (
                  <li key={`${it.title}|${idx}`}>
                    <span className="font-medium">{it.title}</span>
                    {it.description ? <> — {it.description}</> : null}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {transitTips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground">Transit Tips</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90 mt-2">
                {transitTips.map((it, idx) => (
                  <li key={`tip-${idx}`}>{it.description || it.title}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {rideOptions.length > 0 && (
        <div className="mb-6">
          <h3 className="section-subheading">Ride‑Hailing</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {rideOptions.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {([it.description, approxCost].filter(Boolean).length > 0) && (
                  <> — {[it.description, approxCost].filter(Boolean).join(". ")}</>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {passCards.length > 0 && (
        <div className="mb-6">
          <h3 className="section-subheading">Cards & Passes</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {passCards.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {([it.priceRange, it.validity].filter(Boolean).length > 0) && (
                  <> — {[it.priceRange, it.validity].filter(Boolean).join(" • ")}</>
                )}
                {it.whereToBuy && (
                  <> — Where to buy: {it.whereToBuy}</>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {travelTimeCards.length > 0 && (
        <div className="mb-6">
          <h3 className="section-subheading">Typical Travel Times</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {travelTimeCards.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {([it.time, it.mode].filter(Boolean).length > 0) && (
                  <> — {[it.time, it.mode].filter(Boolean).join(" • ")}</>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {walkingBikingTips.length > 0 && (
        <div className="mb-6">
          <h3 className="section-subheading">Walking / Biking</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {walkingBikingTips.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {it.description ? <> — {it.description}</> : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}