import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/ui/SmartImage";
import TripMap from "@/components/ui/TripMap";
import { Button } from "@/components/ui/button";
import { FaShareAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Wallet,
  Users,
  ArrowRight,
  Plane,
  Train,
  Car,
  MapPin,
  Map as MapIcon,
} from "lucide-react";
import { placesApi } from "@/api/places";

function InfoSection({ trip }) {
  // Labels
  const originLabel =
    trip?.userSelection?.origin?.label ||
    trip?.userSelection?.location?.label ||
    trip?.userSelection?.origin ||
    trip?.userSelection?.location ||
    "";
  const destLabel =
    trip?.userSelection?.destination?.label ||
    trip?.userSelection?.location?.label ||
    trip?.tripData?.destination ||
    trip?.destination ||
    "Destination";

  const transportValue = (
    trip?.userSelection?.transportMode || ""
  ).toLowerCase();
  const transportIcon = useMemo(() => {
    switch (transportValue) {
      case "flight":
        return <Plane className="size-4" aria-label="Flight" />;
      case "train":
        return <Train className="size-4" aria-label="Train" />;
      case "car":
        return <Car className="size-4" aria-label="Car" />;
      default:
        return null;
    }
  }, [transportValue]);

  // Days (accurate total days)
  const days = useMemo(() => {
    const sel = trip?.userSelection || {};
    if (sel.noOfDays) return Number(sel.noOfDays) || 1;
    const sd = sel.startDate ? new Date(sel.startDate) : null;
    const ed = sel.endDate ? new Date(sel.endDate) : null;
    if (!sd || !ed) return 1;
    const diff = Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [trip]);

  // Budget & currency handling
  const selectedCurrency = (
    trip?.userSelection?.currency || "USD"
  ).toUpperCase();
  const parsedBudget = useMemo(() => {
    const u = trip?.userSelection || {};
    // Prefer explicit amount fields from create-trip form
    let amount = u.amount ?? u.budgetAmount ?? null;
    let currency = (u.currency || "").toUpperCase() || null;

    // Fallback: try parse from string like "USD 1500" or "₹ 50,000"
    if (
      (amount == null || isNaN(Number(amount))) &&
      typeof u.budget === "string"
    ) {
      const str = u.budget.trim();
      const match = str.match(
        /([A-Za-z]{3})?\s*([₹$€£¥]|INR|USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY)?\s*([\d,]+\.?\d*)/i
      );
      if (match) {
        const [, iso, sym, num] = match;
        amount = Number((num || "0").replace(/,/g, ""));
        currency = (iso || sym || currency || selectedCurrency || "USD")
          .toString()
          .replace(/[^A-Za-z]/g, "")
          .toUpperCase();
        if (sym && !iso) {
          const symMap = {
            "₹": "INR",
            $: "USD",
            "€": "EUR",
            "£": "GBP",
            "¥": "JPY",
          };
          currency = symMap[sym] || currency;
        }
      }
    }

    // Ensure sane defaults
    if (amount == null || isNaN(Number(amount))) amount = null;
    if (!currency) currency = selectedCurrency;
    return { amount: amount != null ? Number(amount) : null, currency };
  }, [trip, selectedCurrency]);

  const [convInfo, setConvInfo] = useState({
    amount: null,
    rate: null,
    from: null,
    to: null,
    error: null,
  });
  useEffect(() => {
    // Currency conversion removed — RapidAPI dependency eliminated.
    // If re-enabled, use a backend proxy endpoint instead.
  }, [parsedBudget, selectedCurrency]);

  const fmtCurrency = (val, cur) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cur,
      }).format(val);
    } catch {
      return `${cur} ${Number(val).toLocaleString()}`;
    }
  };

  const budgetLabel = useMemo(() => {
    const amt = parsedBudget?.amount;
    const cur = selectedCurrency;
    if (!amt) return trip?.userSelection?.budget || "";
    return fmtCurrency(amt, parsedBudget?.currency || cur);
  }, [parsedBudget, selectedCurrency, trip]);

  const convertedLabel = useMemo(() => {
    if (!convInfo?.amount || !convInfo?.to || !parsedBudget?.amount)
      return null;
    return `${fmtCurrency(convInfo.amount, convInfo.to)} (converted from ${
      convInfo.from
    })`;
  }, [convInfo, parsedBudget]);

  // Distance between origin and destination (km/mi)
  const [distance, setDistance] = useState({
    km: null,
    mi: null,
    destAddress: null,
  });
  useEffect(() => {
    let ignore = false;
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const load = async () => {
      try {
        const [oRes, dRes] = await Promise.all([
          originLabel
            ? placesApi.search(originLabel)
            : Promise.resolve(null),
          destLabel
            ? placesApi.search(destLabel)
            : Promise.resolve(null),
        ]);
        const op = oRes?.data?.places?.[0]?.location;
        const dp = dRes?.data?.places?.[0]?.location;
        const dAddr = dRes?.data?.places?.[0]?.formattedAddress || null;
        if (op?.latitude && dp?.latitude) {
          const km = haversine(
            op.latitude,
            op.longitude,
            dp.latitude,
            dp.longitude
          );
          const mi = km * 0.621371;
          if (!ignore) setDistance({ km, mi, destAddress: dAddr });
        } else if (dAddr && !ignore) {
          setDistance((prev) => ({ ...prev, destAddress: dAddr }));
        }
      } catch (e) {
        // silent
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [originLabel, destLabel]);

  // Extract popular attractions from itinerary
  const topAttractions = useMemo(() => {
    const daysArr = Array.isArray(trip?.tripData?.itinerary)
      ? trip.tripData.itinerary
      : Array.isArray(trip?.itinerary)
      ? trip.itinerary
      : [];

    // Support both schemas:
    // - New: day.activities = [ { title, ... }, ... ]
    // - Old: day.{morning,afternoon,evening} possibly with nested .activities
    const entries = daysArr.flatMap((d) => {
      if (Array.isArray(d?.activities)) return d.activities;
      const slots = [d?.morning, d?.afternoon, d?.evening].filter(Boolean);
      return slots.flatMap((s) =>
        Array.isArray(s?.activities) ? s.activities : [s]
      );
    });

    const titles = entries.map((a) => a?.title || a?.name).filter(Boolean);
    const uniq = Array.from(new Set(titles));
    return uniq.slice(0, 6);
  }, [trip]);

  // Use AI-generated description or build a concise fallback
  const description = useMemo(() => {
    // Primary: AI-generated trip summary description
    const aiDesc = trip?.tripData?.tripSummary?.description;
    if (aiDesc && aiDesc.length > 20) {
      const lines = [aiDesc];
      if (originLabel && distance?.km) {
        lines.push(
          `Distance from ${originLabel}: ${distance.km.toFixed(0)} km (${distance.mi.toFixed(0)} mi).`
        );
      }
      if (parsedBudget?.amount) {
        lines.push(
          `Budget: ${fmtCurrency(parsedBudget.amount, parsedBudget.currency)}${convertedLabel ? ` • ${convertedLabel}` : ""}.`
        );
      }
      return lines.join("\n");
    }

    // Fallback: concise auto-generated description
    const lines = [];
    const address = distance?.destAddress ? ` (${distance.destAddress})` : "";
    lines.push(`${destLabel}${address} is a destination known for its unique charm and local experiences.`);
    if (originLabel && distance?.km) {
      lines.push(`Distance from ${originLabel}: ${distance.km.toFixed(0)} km (${distance.mi.toFixed(0)} mi).`);
    }
    lines.push(`Your plan covers ${days} day${days === 1 ? "" : "s"}, balancing must‑see sights and downtime.`);
    if (transportValue) {
      lines.push(`Primary travel mode: ${transportValue.charAt(0).toUpperCase() + transportValue.slice(1)}.`);
    }
    if (parsedBudget?.amount) {
      lines.push(`Budget: ${fmtCurrency(parsedBudget.amount, parsedBudget.currency)}${convertedLabel ? ` • ${convertedLabel}` : ""}.`);
    }
    if (topAttractions.length) {
      lines.push(`Popular attractions: ${topAttractions.join(", ")}.`);
    }
    return lines.join("\n");
  }, [
    trip,
    destLabel,
    originLabel,
    distance,
    days,
    transportValue,
    parsedBudget,
    convertedLabel,
    topAttractions,
  ]);

  // Mobile: toggle between description and map
  const [showMap, setShowMap] = useState(false);

  // Fixed, accessible text colors over the hero background
  const titleColor = "text-white";
  const descColor = "text-white/90";
  const chipBg = "bg-white/10 text-white";

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/* Background hero image layer (Pexels-powered, high quality 1920+ px) */}
      <div className="absolute inset-0 -z-10">
        <SmartImage
          query={`${destLabel} city skyline landscape`}
          alt={`${destLabel} background`}
          className="absolute inset-0 w-full h-full object-cover"
          enhance={true}
          quality="high"
          sizes="100vw"
          fetchpriority="high"
        />
        {/* Multi-layer overlay for depth and readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.20) 35%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.60) 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="relative min-h-[100svh] grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[55%_45%] xl:grid-cols-[60%_40%]">

        {/* ── Left column: Destination info ── */}
        <div
          className={`p-6 md:p-8 pt-24 sm:pt-28 md:pt-32 flex flex-col justify-end ${titleColor}`}
        >
          {/* Route block: origin -> destination */}
          <div
            className={`flex items-center gap-2 text-sm sm:text-base ${descColor}`}
          >
            {originLabel ? (
              <>
                <MapPin className="size-4" aria-hidden />
                <span className="font-medium">{originLabel}</span>
                <ArrowRight className="size-4" aria-hidden />
                <MapPin className="size-4" aria-hidden />
                <span className="font-semibold">{destLabel}</span>
              </>
            ) : (
              <>
                <MapPin className="size-4" aria-hidden />
                <span className="font-semibold">{destLabel}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h2
            className="mt-4 font-bold leading-tight drop-shadow-md text-3xl sm:text-4xl md:text-5xl xl:text-6xl"
          >
            {destLabel}
          </h2>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${chipBg} backdrop-blur text-sm`}
            >
              <Calendar className="size-4" /> {days}{" "}
              {days === 1 ? "Day" : "Days"}
            </span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${chipBg} backdrop-blur text-sm`}
            >
              <Wallet className="size-4" /> {budgetLabel || "—"}
            </span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${chipBg} backdrop-blur text-sm`}
            >
              <Users className="size-4" />{" "}
              {trip?.userSelection?.numTravelers ||
                trip?.userSelection?.traveler ||
                "—"}
            </span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${chipBg} backdrop-blur text-sm`}
            >
              {transportIcon}{" "}
              {transportValue
                ? transportValue.charAt(0).toUpperCase() +
                  transportValue.slice(1)
                : "—"}
            </span>
          </div>

          {convertedLabel && (
            <p className={`mt-3 text-xs sm:text-sm ${descColor}`}>
              {convertedLabel}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            <Link to={`/edit-trip/${trip?._id || trip?.id}`} className="hidden sm:block">
              <Button
                className="bg-black text-white hover:bg-black/90"
                title="Edit trip"
              >
                Edit
              </Button>
            </Link>
            <Button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                } catch {
                  toast("Copy failed");
                }
              }}
              title="Share trip"
            >
              <FaShareAlt />
            </Button>

            {/* Mobile: toggle map button */}
            <Button
              variant="outline"
              className="md:hidden bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => setShowMap(!showMap)}
            >
              <MapIcon className="size-4 mr-1" />
              {showMap ? "Description" : "Map"}
            </Button>
          </div>

          {/* Description (desktop: always visible, mobile: toggleable) */}
          <div className={`mt-6 mb-6 ${showMap ? "hidden md:block" : "block"}`}>
            <div className="p-5 md:p-6 rounded-xl bg-black/30 backdrop-blur-md shadow-lg text-white max-h-[260px] overflow-y-auto custom-scrollbar">
              <h3 className="text-base sm:text-lg font-semibold mb-1">
                About {destLabel}
              </h3>
              <p className="text-white/90 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column: Interactive Map ── */}
        <div
          className={`
            ${showMap ? "block" : "hidden"} md:block
            p-3 md:p-4 lg:p-6
            md:pt-28 lg:pt-32
            md:pb-6 lg:pb-8
          `}
        >
          <div className="w-full h-[50vh] md:h-full min-h-[300px] md:min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <TripMap trip={trip} transportMode={transportValue} className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfoSection;
