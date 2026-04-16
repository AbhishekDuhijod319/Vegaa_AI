import React, { useMemo } from "react";
import {
  Train, Car, Bike, CreditCard, Clock,
  MapPin, Info, IndianRupee, Navigation,
} from "lucide-react";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split('.')?.reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === 'object') return val;
  }
  return null;
}

/* ── Reusable section card ──────────────────────────── */
function SectionCard({ icon: Icon, title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {Icon && <Icon className="size-4 text-primary" />}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Info row for items with title + description ───── */
function InfoRow({ icon: Icon, title, description, meta }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
        {meta && <p className="text-xs text-muted-foreground/70 mt-0.5">{meta}</p>}
      </div>
    </div>
  );
}

function normalizeItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((raw, idx) => {
      if (typeof raw === "string") return { title: raw, description: "" };
      const t = raw || {};
      return {
        title: t.title || t.name || `Item ${idx + 1}`,
        description: t.description || t.details || t.text || "",
        whereToBuy: t.whereToBuy || "",
        priceRange: t.priceRange || "",
        validity: t.validity || "",
        time: t.time || "",
        mode: t.mode || "",
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Getting Around</h2>
        <p className="text-muted-foreground">No transport guidance available.</p>
      </div>
    );
  }

  const transitTypes = normalizeItems(ga?.publicTransit?.types);
  const transitTips = normalizeItems(ga?.publicTransit?.tips);
  const rideOptions = normalizeItems(ga?.rideHailing?.options);
  const approxCost = ga?.rideHailing?.approximateCost || "";
  const passCards = normalizeItems(ga?.cardsAndPasses);
  const travelTimes = normalizeItems(ga?.typicalTravelTimes);
  const walkingTips = typeof ga?.walkingBiking?.tips === 'string'
    ? ga.walkingBiking.tips
    : "";

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6">Getting Around</h2>

      {/* Overview banner */}
      {ga?.overview && (
        <div className="rounded-2xl border bg-primary/5 border-primary/20 p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{ga.overview}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Public Transit */}
        {transitTypes.length > 0 && (
          <SectionCard icon={Train} title="Public Transit" className={transitTips.length > 0 ? "" : ""}>
            <div className="space-y-0">
              {transitTypes.map((it, idx) => (
                <InfoRow key={`type-${idx}`} icon={Train} title={it.title} description={it.description} />
              ))}
            </div>
            {transitTips.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tips</p>
                <ul className="space-y-1.5">
                  {transitTips.map((tip, idx) => (
                    <li key={`tip-${idx}`} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="text-primary mt-0.5 shrink-0">→</span>
                      <span>{tip.description || tip.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        )}

        {/* Ride-Hailing */}
        {rideOptions.length > 0 && (
          <SectionCard icon={Car} title="Ride-Hailing">
            <div className="space-y-0">
              {rideOptions.map((it, idx) => (
                <InfoRow key={`ride-${idx}`} icon={Navigation} title={it.title} description={it.description} />
              ))}
            </div>
            {approxCost && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <IndianRupee className="size-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Approx. cost: </span>{approxCost}
                </p>
              </div>
            )}
          </SectionCard>
        )}

        {/* Cards & Passes */}
        {passCards.length > 0 && (
          <SectionCard icon={CreditCard} title="Cards & Passes">
            <div className="space-y-3">
              {passCards.map((it, idx) => (
                <div key={`pass-${idx}`} className="rounded-xl bg-muted/50 border p-3">
                  <p className="text-sm font-semibold text-foreground">{it.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {it.priceRange && (
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee className="size-3" /> {it.priceRange}
                      </span>
                    )}
                    {it.validity && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> {it.validity}
                      </span>
                    )}
                    {it.whereToBuy && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {it.whereToBuy}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Walking / Biking */}
        {walkingTips && (
          <SectionCard icon={Bike} title="Walking & Biking">
            <p className="text-sm text-foreground/90 leading-relaxed">{walkingTips}</p>
          </SectionCard>
        )}

        {/* Typical Travel Times */}
        {travelTimes.length > 0 && (
          <SectionCard icon={Clock} title="Typical Travel Times" className="sm:col-span-2">
            <div className="grid sm:grid-cols-2 gap-x-8">
              {travelTimes.map((it, idx) => (
                <div key={`time-${idx}`} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
                  <span className="text-sm text-foreground font-medium">{it.title}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {it.time && <span className="font-medium text-foreground">{it.time}</span>}
                    {it.mode && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted border">{it.mode}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}