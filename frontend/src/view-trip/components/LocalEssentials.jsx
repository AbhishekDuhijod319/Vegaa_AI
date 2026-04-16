import React, { useMemo } from "react";
import {
  Phone, Shield, AlertTriangle, HandHeart,
  Wifi, CreditCard, Languages, IndianRupee,
  Coffee, Bus, Droplets, UtensilsCrossed,
} from "lucide-react";

function coalesceObject(obj, paths) {
  for (const p of paths) {
    const val = p.split('.')?.reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val && typeof val === 'object') return val;
  }
  return null;
}

/* ── Reusable section card ─────────────────────────── */
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

/* ── Numbered list item ────────────────────────────── */
function ListItem({ title, description }) {
  return (
    <li className="text-sm text-foreground/90 leading-relaxed">
      {description ? (
        <>
          <span className="font-medium text-foreground">{title}</span>
          <span className="text-muted-foreground"> — {description}</span>
        </>
      ) : (
        <span>{title}</span>
      )}
    </li>
  );
}

/* ── Cost item row ─────────────────────────────────── */
function CostRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="size-3.5" />}
        <span className="capitalize">{label}</span>
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

const COST_ICONS = {
  meal: UtensilsCrossed,
  transport: Bus,
  coffee: Coffee,
  water: Droplets,
};

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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 md:mb-5">Local Essentials</h2>
        <p className="text-muted-foreground">No local essentials found.</p>
      </div>
    );
  }

  const emergencyNumbers = Array.isArray(le?.emergencyNumbers) ? le.emergencyNumbers : [];
  const safetyTips = Array.isArray(le?.safetyTips) ? le.safetyTips : [];
  const commonScams = Array.isArray(le?.commonScams) ? le.commonScams : [];
  const etiquette = Array.isArray(le?.etiquette) ? le.etiquette : [];
  const simProviders = le?.simAndConnectivity?.simProviders || [];
  const eSimOptions = le?.simAndConnectivity?.eSIM || [];
  const wifiTips = le?.simAndConnectivity?.wifiTips || "";
  const typicalCosts = le?.money?.typicalCosts || {};
  const currencyInfo = le?.money?.currency || le?.currency || "";
  const languageInfo = le?.language || "";

  const normalize = (item) => {
    if (typeof item === "string") return { title: item, description: "" };
    return {
      title: item?.title || item?.name || "",
      description: item?.description || item?.details || "",
    };
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6">Local Essentials</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Emergency Numbers */}
        {emergencyNumbers.length > 0 && (
          <SectionCard icon={Phone} title="Emergency Numbers">
            <div className="space-y-2">
              {emergencyNumbers.map((item, i) => {
                const { title, description } = normalize(item);
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                    <Phone className="size-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Currency & Language */}
        {(currencyInfo || languageInfo) && (
          <SectionCard icon={IndianRupee} title="Currency & Language">
            <div className="space-y-3">
              {currencyInfo && (
                <div className="flex items-start gap-3">
                  <CreditCard className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Currency</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{currencyInfo}</p>
                  </div>
                </div>
              )}
              {languageInfo && (
                <div className="flex items-start gap-3">
                  <Languages className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Language</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{languageInfo}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Safety Tips */}
        {safetyTips.length > 0 && (
          <SectionCard icon={Shield} title="Safety Tips">
            <ul className="space-y-2 list-none">
              {safetyTips.map((tip, i) => {
                const { title } = normalize(tip);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span>{title}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {/* Common Scams */}
        {commonScams.length > 0 && (
          <SectionCard icon={AlertTriangle} title="Common Scams">
            <ul className="space-y-2 list-none">
              {commonScams.map((scam, i) => {
                const { title } = normalize(scam);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                    <span>{title}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {/* Etiquette */}
        {etiquette.length > 0 && (
          <SectionCard icon={HandHeart} title="Local Etiquette">
            <ul className="space-y-2 list-none">
              {etiquette.map((item, i) => {
                const { title } = normalize(item);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                    <span>{title}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {/* Connectivity */}
        {(simProviders.length > 0 || eSimOptions.length > 0 || wifiTips) && (
          <SectionCard icon={Wifi} title="Connectivity">
            <div className="space-y-3">
              {[...simProviders, ...eSimOptions].map((item, i) => {
                const { title, description } = normalize(item);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <Wifi className="size-3.5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                    </div>
                  </div>
                );
              })}
              {wifiTips && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Wi‑Fi Tips: </span>{wifiTips}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Typical Costs */}
        {Object.keys(typicalCosts).length > 0 && (
          <SectionCard icon={IndianRupee} title="Typical Costs" className="sm:col-span-2">
            <div className="grid sm:grid-cols-2 gap-x-8">
              {Object.entries(typicalCosts).map(([key, value]) => (
                <CostRow
                  key={key}
                  icon={COST_ICONS[key] || IndianRupee}
                  label={key}
                  value={String(value || "")}
                />
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}