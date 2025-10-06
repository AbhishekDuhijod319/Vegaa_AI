import React, { useMemo } from "react";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split('.')?.reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === 'object') return val;
  }
  return null;
}

// Removed maps and images; render clean numbered lists instead

function normalizeStrings(items = [], destination = "") {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((raw, idx) => {
      if (typeof raw === "string") {
        return { title: raw, location: destination, description: "" };
      }
      const t = raw || {};
      return {
        title: t.title || t.name || `Item ${idx + 1}`,
        location: t.location || destination || "",
        description: t.description || t.details || "",
      };
    })
    .filter((x) => x.title);
}

export default function LocalEssentials({ trip }) {
  const le = coalesceObject(trip, [
    "tripData.localEssentials",
    "localEssentials",
    "tripData.essentials",
    "essentials",
  ]);

  const destination = useMemo(() => (
    trip?.userSelection?.destination?.label ||
    trip?.userSelection?.location?.label ||
    trip?.tripData?.destination ||
    trip?.destination ||
    ""
  ), [trip]);

  if (!le) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Local Essentials</h2>
        <p className="text-muted-foreground">No local essentials found.</p>
      </div>
    );
  }

  // Build standardized card lists
  const safetyEtiquette = normalizeStrings([
    ...(Array.isArray(le?.safetyTips) ? le.safetyTips : []),
    ...(Array.isArray(le?.commonScams) ? le.commonScams : []),
    ...(Array.isArray(le?.etiquette) ? le.etiquette : []),
  ], destination);

  const emergencyCards = normalizeStrings(Array.isArray(le?.emergencyNumbers) ? le.emergencyNumbers : [], destination);

  const simProviders = normalizeStrings(le?.simAndConnectivity?.simProviders || [], destination);
  const eSimOptions = normalizeStrings(le?.simAndConnectivity?.eSIM || [], destination);

  const typicalCostsCards = (() => {
    const obj = le?.money?.typicalCosts || null;
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([k, v]) => ({ title: k, location: destination, description: String(v || "") }));
  })();

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Local Essentials</h2>

      {/* Safety & Etiquette */}
      {safetyEtiquette.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3 bg-slate-500 text-white px-2 py-1 rounded-md text-center">Safety & Etiquette</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {safetyEtiquette.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {it.description ? <> — {it.description}</> : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Emergency Numbers */}
      {emergencyCards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3  bg-slate-500 text-white px-2 py-1 rounded-md text-center">Emergency Numbers</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {emergencyCards.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {it.description ? <> — {it.description}</> : null}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Connectivity */}
      {(simProviders.length > 0 || eSimOptions.length > 0 || le?.simAndConnectivity?.wifiTips) && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3  bg-slate-500 text-white px-2 py-1 rounded-md text-center">Connectivity</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {[...simProviders, ...eSimOptions].map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium">{it.title}</span>
                {it.description ? <> — {it.description}</> : null}
              </li>
            ))}
            {le?.simAndConnectivity?.wifiTips && (
              <li key="wifi-tips">
                <span className="font-medium">Wi‑Fi Tips</span>: {le.simAndConnectivity.wifiTips}
              </li>
            )}
          </ol>
        </div>
      )}

      {/* Money & Typical Costs */}
      {(typicalCostsCards.length > 0 || le?.money?.currency) && (
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3  bg-slate-500 text-white px-2 py-1 rounded-md text-center">Money & Typical Costs</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90">
            {le?.money?.currency && (
              <li key="currency"><span className="font-medium">Currency</span>: {le.money.currency}</li>
            )}
            {typicalCostsCards.map((it, idx) => (
              <li key={`${it.title}|${idx}`}>
                <span className="font-medium capitalize">{it.title}</span>
                {it.description ? <> — {it.description}</> : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}