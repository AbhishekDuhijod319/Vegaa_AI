// Trip service for AI trip generation and management
// All API calls go through the backend — no direct Gemini or Firestore here

import { aiApi } from '@/api/ai';
import { tripApi } from '@/api/trips';
import { imageApi } from '@/api/images';
import { toast } from 'sonner';

// ─── JSON Normalization (processes backend AI response) ─────

function normalizeTripData(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const ensureArr = (v) => (Array.isArray(v) ? v : []);
  const ensureObj = (v) => (v && typeof v === 'object' ? v : {});

  const ga = ensureObj(obj.gettingAround);
  const ttt = ensureArr(ga.typicalTravelTimes).map((item) => {
    const it = ensureObj(item);
    const time = it.time || it["Approx Time"] || it.approxTime || '';
    return {
      title: it.title || `${it.from || ''}${it.to ? ` → ${it.to}` : ''}`.trim(),
      time,
      mode: it.mode || it.transport || '',
    };
  });

  const normalized = {
    summary: obj.summary || '',
    hotels: ensureArr(obj.hotels),
    restaurants: ensureArr(obj.restaurants),
    markets: ensureArr(obj.markets),
    neighborhoods: ensureArr(obj.neighborhoods),
    gettingAround: {
      ...ga,
      publicTransit: ensureObj(ga.publicTransit),
      rideHailing: ensureObj(ga.rideHailing),
      walkingBiking: ensureObj(ga.walkingBiking),
      cardsAndPasses: ensureArr(ga.cardsAndPasses),
      typicalTravelTimes: ttt,
    },
    localEssentials: ensureObj(obj.localEssentials),
    suggestedDayTrips: ensureArr(obj.suggestedDayTrips),
    extras: ensureObj(obj.extras),
    itinerary: ensureArr(obj.itinerary),
  };

  normalized.extras.rainyDayIdeas = ensureArr(normalized.extras.rainyDayIdeas);
  normalized.extras.nightlife = ensureArr(normalized.extras.nightlife);
  normalized.extras.familyFriendly = ensureArr(normalized.extras.familyFriendly);

  const le = normalized.localEssentials;
  le.safetyTips = ensureArr(le.safetyTips);
  le.commonScams = ensureArr(le.commonScams);
  le.etiquette = ensureArr(le.etiquette);
  le.emergencyNumbers = ensureArr(le.emergencyNumbers);
  le.simAndConnectivity = ensureObj(le.simAndConnectivity);
  le.money = ensureObj(le.money);

  return normalized;
}

function buildFallbackTrip({ destinationLabel = '', totalDays = 3 } = {}) {
  return {
    summary: `A practical ${totalDays}-day overview for ${destinationLabel}.`,
    hotels: [],
    restaurants: [],
    markets: [],
    neighborhoods: [],
    gettingAround: {
      overview: `Use metro and taxis to navigate ${destinationLabel}.`,
      publicTransit: { types: ["Metro", "Bus"], tips: ["Buy a day pass if riding 3+ times"] },
      rideHailing: { options: ["Local taxi"], approximateCost: "Short ride ~$8-12 in center" },
      walkingBiking: { tips: "Central areas are walkable; use caution at night." },
      cardsAndPasses: [],
      typicalTravelTimes: [
        { title: "Airport → Center", time: "35-50 min", mode: "Metro/Taxi" },
      ],
    },
    localEssentials: {
      safetyTips: ["Keep valuables secured", "Avoid unlicensed taxis"],
      commonScams: ["Overpriced tours"],
      etiquette: ["Respect religious sites dress codes"],
      emergencyNumbers: ["Police 100", "Ambulance 102"],
      simAndConnectivity: { simProviders: [], eSIM: [], wifiTips: ["Cafes offer Wi‑Fi"] },
      money: { currency: "Local", typicalCosts: { metro: "$2", coffee: "$2-4", meal: "$8-15", taxiAirportToCenter: "$25-40" } },
    },
    suggestedDayTrips: [],
    extras: { rainyDayIdeas: [], nightlife: [], familyFriendly: [] },
    itinerary: Array.from({ length: totalDays }).map((_, i) => ({ day: i + 1, activities: [], notes: "" })),
  };
}

/**
 * Generate a trip using the backend AI proxy.
 * @param {Object} formData - Trip form data from create-trip form
 * @param {Function} onSuccess - Called with { tripData, docId, enrichedFormData, coverPhotoUrl }
 * @param {Function} onError - Called on failure
 */
export const generateTrip = async (formData, onSuccess, onError) => {
  try {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const destinationLabel = formData.destination?.label || formData.location?.label || '';

    // Call backend AI proxy
    let tripData;
    try {
      const response = await aiApi.generateTrip({
        destination: destinationLabel,
        startLocation: formData.startLocation?.label || '',
        totalDays,
        travelers: formData.numTravelers || 1,
        budget: formData.amount || 0,
        currency: formData.currency || 'INR',
        transportMode: formData.transportMode || '',
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      tripData = response.tripData;
    } catch (error) {
      const msg = error.response?.data?.error || 'Trip generation failed';
      toast.error(msg);
      if (onError) onError(new Error(msg));
      throw error;
    }

    // Normalize data for view-trip compatibility
    if (!tripData || typeof tripData !== 'object') {
      tripData = buildFallbackTrip({ destinationLabel, totalDays });
      toast.warning('AI response was invalid; loaded a minimal trip outline instead.');
    } else {
      tripData = normalizeTripData(tripData);
    }

    // Generate doc ID
    const docId = crypto.randomUUID();

    // Get cover photo via backend image proxy
    let coverPhotoUrl = '';
    try {
      if (destinationLabel) {
        const imgResult = await imageApi.search(destinationLabel, 1);
        if (imgResult.photos?.length > 0) {
          coverPhotoUrl = imgResult.photos[0].src?.large || imgResult.photos[0].src?.medium || '';
        }
      }
    } catch (photoError) {
      console.warn('Failed to fetch cover photo:', photoError);
    }

    const enrichedFormData = {
      ...formData,
      noOfDays: totalDays,
    };

    if (onSuccess) {
      await onSuccess({ tripData, docId, enrichedFormData, coverPhotoUrl });
    }

    return { tripData, docId, enrichedFormData, coverPhotoUrl };
  } catch (error) {
    console.error('Error generating trip:', error);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * Save AI-generated trip to MongoDB via backend API.
 */
export const saveAiTrip = async (tripData, docId, user, formData, coverPhotoUrl) => {
  try {
    const result = await tripApi.create({
      userSelection: formData,
      tripData: tripData,
      coverPhotoUrl: coverPhotoUrl || '',
      summary: tripData.summary || '',
    });
    return result.trip;
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
};

/**
 * Update an existing trip via backend API.
 */
export const updateTrip = async (tripId, updatedData) => {
  try {
    const result = await tripApi.update(tripId, updatedData);
    return result.trip;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

/**
 * Calculate days between two dates.
 */
export const calculateDaysBetween = (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diffDays, 1);
  } catch (error) {
    console.error('Error calculating days:', error);
    return 1;
  }
};