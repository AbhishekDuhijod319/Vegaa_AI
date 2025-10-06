// Trip service for AI trip generation and management
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../sevice/firebaseConfig';

// Keep GlobalAPI for other non-image tasks if needed, but do not use Google Places photos here
// import { getPlaceDetails } from '../sevice/GlobalAPI';
import { getFreshChatSession, AI_PROMPT } from '../sevice/AIModal';
import { toast } from 'sonner';
import { getStableFirstImageForQuery } from '@/lib/pexels';

// Add robust error handling helpers for Gemini and JSON parsing
const GEMINI_KEY = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
function humanizeGeminiError(error) {
  const msg = (error?.message || error?.toString?.() || '').toLowerCase();
  if (msg.includes('api key')) return 'Invalid Gemini API key. Verify VITE_GOOGLE_GEMINI_AI_API_KEY and restart the dev server.';
  if (msg.includes('permission') || msg.includes('access')) return 'Gemini API access denied. Enable Generative Language API for your project.';
  if (msg.includes('quota') || msg.includes('rate')) return 'Gemini quota exceeded or rate limited. Please try again later.';
  if (msg.includes('model') && msg.includes('not')) return 'Requested Gemini model is not available. Ensure gemini-2.5-flash-lite is enabled for your project.';
  if (msg.includes('billing')) return 'Google Cloud billing issue detected for Gemini API. Please enable billing.';
  return 'Trip generation failed due to an AI service error.';
}
function tryParseJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Attempt to sanitize and extract valid JSON from a noisy response
function sanitizeJsonText(text) {
  let t = String(text || '');
  // Remove Markdown code fences and hints
  t = t.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''));
  t = t.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // Normalize smart quotes
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // Remove trailing commas before } or ]
  t = t.replace(/,\s*([}\]])/g, '$1');
  return t;
}

// Extract the largest plausible JSON object using brace matching
function extractLargestJsonObject(text) {
  const s = String(text || '');
  let start = -1;
  let depth = 0;
  let best = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = s.slice(start, i + 1);
        if (candidate.length > best.length) best = candidate;
      }
    }
  }
  return best || null;
}

function normalizeTripData(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const ensureArr = (v) => (Array.isArray(v) ? v : []);
  const ensureObj = (v) => (v && typeof v === 'object' ? v : {});

  // Normalize gettingAround.typicalTravelTimes keys
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

  // Ensure extras subcategories are arrays
  normalized.extras.rainyDayIdeas = ensureArr(normalized.extras.rainyDayIdeas);
  normalized.extras.nightlife = ensureArr(normalized.extras.nightlife);
  normalized.extras.familyFriendly = ensureArr(normalized.extras.familyFriendly);

  // Ensure localEssentials shape
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
 * Generate a trip using AI based on form data
 * @param {Object} formData - Trip form data
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const generateTrip = async (formData, onSuccess, onError) => {
  try {
    // Calculate trip duration
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Prepare the AI prompt
    const FINAL_PROMPT = AI_PROMPT
      .replace('{location}', formData.destination?.label || formData.location?.label)
      .replace('{totalDays}', totalDays)
      .replace('{traveler}', `${formData.numTravelers} travelers`)
      .replace('{budget}', `${formData.currency} ${formData.amount}`);

    // Early check for Gemini API key
    if (!GEMINI_KEY) {
      const err = new Error('Missing Gemini API key. Set VITE_GOOGLE_GEMINI_AI_API_KEY in .env.local and restart the dev server.');
      toast.error(err.message);
      if (onError) onError(err);
      throw err;
    }

    // Generate trip using AI with a fresh session per request
    let result;
    try {
      const session = getFreshChatSession();
      result = await session.sendMessage(FINAL_PROMPT);
    } catch (error) {
      const friendly = humanizeGeminiError(error);
      toast.error(friendly);
      if (onError) onError(new Error(friendly));
      throw error;
    }

    // Parse JSON safely with multiple strategies
    let tripData = null;
    try {
      tripData = JSON.parse(result.response.text());
    } catch {
      const rawText = typeof result?.response?.text === 'function' ? result.response.text() : (result?.response?.text || '');
      const sanitized = sanitizeJsonText(rawText);
      tripData = tryParseJson(sanitized);
      if (!tripData) {
        const largest = extractLargestJsonObject(sanitized);
        if (largest) {
          tripData = tryParseJson(largest);
        }
      }
    }
    // One retry with stricter JSON-only instruction if still invalid
    if (!tripData) {
      try {
        const strictPrompt = `${FINAL_PROMPT}\n\nReturn ONLY valid JSON with no markdown, no code fences, and no trailing commas. If you cannot, return an empty JSON object: {}`;
        const strictSession = getFreshChatSession();
        const retryResult = await strictSession.sendMessage(strictPrompt);
        const retryText = typeof retryResult?.response?.text === 'function' ? retryResult.response.text() : (retryResult?.response?.text || '');
        const sanitizedRetry = sanitizeJsonText(retryText);
        tripData = tryParseJson(sanitizedRetry) || tryParseJson(extractLargestJsonObject(sanitizedRetry));
      } catch (e) {
        console.warn('Strict retry failed:', e);
      }
    }

    // Final fallback: build a minimal skeleton to prevent UI breakage
    if (!tripData) {
      const destinationLabel = formData.destination?.label || formData.location?.label || '';
      tripData = buildFallbackTrip({ destinationLabel, totalDays });
      toast.warning('AI response was invalid; loaded a minimal trip outline instead.');
    }

    // Normalize to align with view-trip expectations
    tripData = normalizeTripData(tripData);

    // Generate document ID
    const docId = Date.now().toString();

    // Get cover photo for destination via Pexels
    let coverPhotoUrl = '';
    try {
      const destinationLabel = formData.destination?.label || formData.location?.label;
      if (destinationLabel) {
        const set = await getStableFirstImageForQuery(destinationLabel);
        coverPhotoUrl = set?.src || '';
      }
    } catch (photoError) {
      console.warn('Failed to fetch cover photo:', photoError);
    }

    // Enrich form data with calculated values
    const enrichedFormData = {
      ...formData,
      noOfDays: totalDays,
    };

    // Call success callback
    if (onSuccess) {
      await onSuccess({ tripData, docId, enrichedFormData, coverPhotoUrl });
    }

    return { tripData, docId, enrichedFormData, coverPhotoUrl };
  } catch (error) {
    console.error('Error generating trip:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Save AI-generated trip to Firestore
 * @param {Object} tripData - AI-generated trip data
 * @param {string} docId - Document ID
 * @param {Object} user - User information
 * @param {Object} formData - Original form data
 * @param {string} coverPhotoUrl - Cover photo URL
 */
export const saveAiTrip = async (tripData, docId, user, formData, coverPhotoUrl) => {
  try {
    const tripDocument = {
      id: docId,
      userSelection: formData,
      tripData: tripData,
      userEmail: user?.email,
      userName: user?.name,
      userPhoto: user?.picture,
      coverPhotoUrl: coverPhotoUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'AITrips', docId), tripDocument);
    return tripDocument;
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
};

/**
 * Update an existing trip
 * @param {string} tripId - Trip ID
 * @param {Object} updatedData - Updated trip data
 */
export const updateTrip = async (tripId, updatedData) => {
  try {
    const updatePayload = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'AITrips', tripId), updatePayload, { merge: true });
    return updatePayload;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

/**
 * Calculate days between two dates
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {number} - Number of days
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