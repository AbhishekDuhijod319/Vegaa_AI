const { GoogleGenAI } = require('@google/genai');
const config = require('../config/env');
const logger = require('../utils/logger');

let ai = null;
const PRIMARY_MODEL = 'gemini-3.1-flash-lite-preview';
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];

const initGemini = () => {
  if (!config.apis.gemini) {
    logger.warn('Gemini API key not configured. AI generation will fail.');
    return;
  }
  ai = new GoogleGenAI({ apiKey: config.apis.gemini });
  logger.info(`AI service initialized — primary: ${PRIMARY_MODEL}, fallbacks: ${FALLBACK_MODELS.join(', ')}`);
};

// Initialize on first import
initGemini();

/**
 * Sanitize AI response — strip markdown fences, fix common JSON issues
 */
const sanitizeJsonResponse = (text) => {
  let cleaned = text.trim();
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // Fix trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  // Fix unquoted keys (basic)
  cleaned = cleaned.replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
  return cleaned;
};

/**
 * Attempt to parse JSON with multiple fallback strategies
 */
const parseAiResponse = (rawText) => {
  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(rawText),
    // Strategy 2: Sanitized parse
    () => JSON.parse(sanitizeJsonResponse(rawText)),
    // Strategy 3: Extract JSON object from text
    () => {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No JSON object found');
    },
    // Strategy 4: Extract JSON array from text
    () => {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      throw new Error('No JSON array found');
    },
  ];

  for (const strategy of strategies) {
    try {
      return strategy();
    } catch {
      continue;
    }
  }

  throw new Error('Failed to parse AI response as JSON after all strategies.');
};

const aiService = {
  async generateTrip({ destination, startLocation, totalDays, travelers, budget, currency, transportMode, startDate, endDate }) {
    if (!ai) {
      throw new Error('AI service not configured. Check GEMINI_API_KEY.');
    }

    const dailyBudget = Math.round(budget / totalDays);
    const hotelBudgetPerNight = Math.round(dailyBudget * 0.4); // ~40% of daily budget for accommodation

    const prompt = `You are an expert Indian travel planner. Generate an extremely detailed and comprehensive travel plan.
ALL PRICES MUST BE IN INR (₹) — Indian Rupees. This is mandatory.

TRIP DETAILS:
- Destination: ${destination}
${startLocation ? `- Starting from: ${startLocation}` : ''}
- Duration: ${totalDays} days
- Travelers: ${travelers}
- TOTAL Budget for entire trip: ₹${budget} (${currency}) for ALL ${totalDays} days
- Daily budget per person: approximately ₹${dailyBudget}
- Hotel budget per night: approximately ₹${hotelBudgetPerNight}
${transportMode ? `- Transport preference: ${transportMode}` : ''}
${startDate ? `- Start Date: ${startDate}` : ''}
${endDate ? `- End Date: ${endDate}` : ''}

BUDGET AWARENESS — CRITICAL:
The total budget of ₹${budget} is for the ENTIRE trip of ${totalDays} days, NOT per day.
- Hotels should cost around ₹${hotelBudgetPerNight} per night or less
- Include budget-friendly options like OYO rooms, lodges, guesthouses, dharamshalas
- Restaurants should match the budget — include street food stalls, dhabas, affordable eateries along with mid-range options
- All prices must be realistic for the Indian market in INR

CRITICAL REQUIREMENTS — YOU MUST FOLLOW ALL OF THESE:

1. HOTELS: Generate EXACTLY 6 hotels sorted by price (cheapest first). MUST include a mix of:
   - 2 budget options (OYO, lodges, guesthouses, dharamshalas) under ₹${hotelBudgetPerNight}/night
   - 2 mid-range options around ₹${hotelBudgetPerNight}/night
   - 2 premium options (for travelers who want to splurge)
   Each hotel MUST include:
   - "name": Real hotel/OYO/lodge name that actually exists in ${destination}
   - "location": FULL street address (e.g., "123 Main Street, District Name, ${destination}")
   - "pricePerNight": Exact price per night as a number in INR (e.g., 1200)
   - "priceRange": Price per night as string (e.g., "₹800 - ₹1,200 per night")
   - "rating": A realistic number between 2.5 and 5.0 (e.g., 3.8)
   - "description": 2-3 sentences describing the hotel, its ambiance, cleanliness, and key features
   - "amenities": Array of ALL available amenities (e.g., ["Free WiFi", "AC", "Hot Water", "TV", "Room Service", "Parking", "24/7 Front Desk", "CCTV", "Power Backup"])
   - "category": One of "budget", "mid-range", or "premium"
   - "image_query": Search query for hotel image

2. RESTAURANTS: Generate EXACTLY 8 restaurants matching the budget. Include:
   - 3 street food / dhaba / affordable options (₹50-200 per person)
   - 3 mid-range restaurants (₹200-800 per person)
   - 2 premium dining options
   Each MUST include:
   - "name": Real restaurant/dhaba/stall name in ${destination}
   - "cuisine": Type of cuisine (e.g., "North Indian", "Street Food", "Mughlai", "South Indian")
   - "pricePerPerson": Average cost per person as a number in INR (e.g., 150)
   - "priceRange": Cost range as string (e.g., "₹100 - ₹250 per person")
   - "rating": Realistic number between 3.0 and 5.0
   - "location": FULL street address
   - "mustTry": 2-3 signature dishes as a string
   - "description": 2 sentences about atmosphere and food quality
   - "category": One of "budget", "mid-range", or "premium"
   - "image_query": Search query for restaurant image

3. ITINERARY: Generate a day-by-day plan for ALL ${totalDays} days. Each day MUST have:
   - "day": Day number (1, 2, 3...)
   - "title": Catchy day title (e.g., "Historical Wonders & Street Food")
   - "activities": Array of 4-6 activities as a FLAT LIST (NOT grouped by morning/afternoon/evening), each with:
     - "time": Specific time (e.g., "09:00 AM")
     - "activity": Activity name
     - "location": Full address or landmark name with area
     - "details": 2-3 sentences about what to do and expect
     - "estimatedCost": Cost in INR as string (e.g., "₹200")
     - "image_query": Search query for activity image

4. PLACES TO VISIT: Generate AT LEAST 8 must-see places as a FLAT LIST (NOT grouped by time of day). Each MUST have:
   - "name": Name of the place
   - "location": Full address with area/district in ${destination}
   - "description": 3 detailed sentences about what makes this place special
   - "bestTime": Best time of day to visit
   - "entryFee": Entry fee in INR (e.g., "₹50" or "Free")
   - "timeNeeded": How long to spend (e.g., "2-3 hours")
   - "image_query": Descriptive search query for this specific place

5. SUGGESTED DAY TRIPS: Generate AT LEAST 3 day trips from ${destination}:
   - "name", "distance" from ${destination}, "description", "highlights" (array of 3-5 strings), "image_query"

6. NEIGHBOURHOODS: Generate AT LEAST 4 neighbourhoods/areas:
   - "name", "vibe" (1-2 words like "Bohemian", "Upscale"), "bestFor" (e.g., "Nightlife", "Shopping"), "description" (2-3 sentences)

7. MARKETS: Generate AT LEAST 5 markets/shopping areas. Each MUST include:
   - "name": Real market name
   - "type": Category (e.g., "Street Market", "Mall", "Bazaar", "Flea Market")
   - "bestFor": What to buy there (e.g., "Traditional handicrafts, spices, textiles")
   - "timings": Operating hours (e.g., "10:00 AM - 9:00 PM, closed on Mondays")
   - "description": 2-3 sentences describing what the market is like, the atmosphere, bargaining tips
   - "location": Full address with area
   - "image_query": Search query for market image

8. LOCAL ESSENTIALS — complete object with:
   - "emergencyNumbers": Array of objects [{title, description}] — at least 3 (police, ambulance, fire)
   - "currency": Local currency name and exchange tips
   - "language": Primary language(s) and useful phrases
   - "safetyTips": Array of 5+ safety tips as strings
   - "commonScams": Array of 3+ common tourist scams as strings
   - "etiquette": Array of 4+ local etiquette rules as strings
   - "simAndConnectivity": { "simProviders": [{name, description}], "eSIM": [{name, description}], "wifiTips": "..." }
   - "money": { "currency": "...", "typicalCosts": { "meal": "...", "transport": "...", "coffee": "...", "water": "..." } }

9. GETTING AROUND — complete object with:
   - "overview": 2-3 sentence overview of transport in ${destination}
   - "publicTransit": { "types": [{title, description}], "tips": [{title, description}] }
   - "rideHailing": { "options": [{title, description}], "approximateCost": "..." }
   - "walkingBiking": { "tips": "..." }
   - "cardsAndPasses": [{title, priceRange, validity, whereToBuy}]
   - "typicalTravelTimes": [{title, time, mode}]

10. EXTRAS — complete object with:
   - "rainyDayIdeas": Array of 3+ objects [{title, description, location}]
   - "nightlife": Array of 3+ objects [{title, description, location}]
   - "familyFriendly": Array of 3+ objects [{title, description, location}]
   - "packingTips": Array of 5+ strings
   - "bestTimeToVisit": String describing best seasons
   - "localCustoms": Array of 4+ strings
   - "usefulApps": Array of 4+ strings

11. TRIP SUMMARY:
   - "title": Catchy trip title
   - "description": 3-4 sentence overview of what makes this destination special and what the traveler will experience
   - "totalDays": ${totalDays}
   - "travelers": ${travelers}
   - "budget": "₹${budget}"

DATA QUALITY RULES:
- NO empty strings or empty arrays anywhere. Every single field must contain real, accurate, locally-specific data.
- All ratings must be realistic numbers between 2.5 and 5.0 (not strings, actual numbers like 4.2).
- All addresses must be REAL locations with street/area/district — not just city names.
- ALL prices MUST be in INR (₹) with realistic Indian market pricing. No USD or other currencies.
- Use "location" as the field name for addresses everywhere (NOT "address").
- The "placesToVisit" array MUST contain AT LEAST 8 items — this is a separate section from itinerary.
- The response must be culturally accurate and locally relevant.

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown code fences. No explanatory text before or after. Pure JSON object.

{
  "tripSummary": { "title": "...", "description": "...", "totalDays": ${totalDays}, "travelers": ${travelers}, "budget": "₹${budget}" },
  "hotels": [{ "name": "...", "location": "...", "pricePerNight": 1200, "priceRange": "...", "rating": 4.2, "description": "...", "amenities": ["..."], "category": "budget", "image_query": "..." }],
  "itinerary": [{ "day": 1, "title": "...", "activities": [{ "time": "...", "activity": "...", "location": "...", "details": "...", "estimatedCost": "...", "image_query": "..." }] }],
  "restaurants": [{ "name": "...", "cuisine": "...", "pricePerPerson": 200, "priceRange": "...", "rating": 4.5, "location": "...", "mustTry": "...", "description": "...", "category": "budget", "image_query": "..." }],
  "placesToVisit": [{ "name": "...", "location": "...", "description": "...", "bestTime": "...", "entryFee": "...", "timeNeeded": "...", "image_query": "..." }],
  "suggestedDayTrips": [{ "name": "...", "distance": "...", "description": "...", "highlights": ["..."], "image_query": "..." }],
  "neighbourhoods": [{ "name": "...", "vibe": "...", "bestFor": "...", "description": "..." }],
  "markets": [{ "name": "...", "type": "...", "bestFor": "...", "timings": "...", "description": "...", "location": "...", "image_query": "..." }],
  "localEssentials": { "emergencyNumbers": [{"title":"...","description":"..."}], "currency": "...", "language": "...", "safetyTips": ["..."], "commonScams": ["..."], "etiquette": ["..."], "simAndConnectivity": { "simProviders": [{"name":"...","description":"..."}], "eSIM": [{"name":"...","description":"..."}], "wifiTips": "..." }, "money": { "currency": "...", "typicalCosts": { "meal": "...", "transport": "...", "coffee": "...", "water": "..." } } },
  "gettingAround": { "overview": "...", "publicTransit": { "types": [{"title":"...","description":"..."}], "tips": [{"title":"...","description":"..."}] }, "rideHailing": { "options": [{"title":"...","description":"..."}], "approximateCost": "..." }, "walkingBiking": { "tips": "..." }, "cardsAndPasses": [{"title":"...","priceRange":"...","validity":"...","whereToBuy":"..."}], "typicalTravelTimes": [{"title":"...","time":"...","mode":"..."}] },
  "extras": { "rainyDayIdeas": [{"title":"...","description":"...","location":"..."}], "nightlife": [{"title":"...","description":"...","location":"..."}], "familyFriendly": [{"title":"...","description":"...","location":"..."}], "packingTips": ["..."], "bestTimeToVisit": "...", "localCustoms": ["..."], "usefulApps": ["..."] }
}`;

    // Try primary model first, fallback if unavailable (503)
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      try {
        logger.info(`Attempting generation with model: ${currentModel}`);
        const result = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
        });
        const rawText = result.text;
        const tripData = parseAiResponse(rawText);
        if (i > 0) {
          logger.info(`Successfully generated with fallback model: ${currentModel}`);
        }
        return tripData;
      } catch (error) {
        const msg = error.message?.toLowerCase() || '';
        const isUnavailable = msg.includes('unavailable') || msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded');

        // If the model is unavailable and we have a fallback, try next
        if (isUnavailable && i < modelsToTry.length - 1) {
          logger.warn(`Model ${currentModel} unavailable, falling back to ${modelsToTry[i + 1]}`);
          continue;
        }

        logger.error(`AI generation failed (${currentModel}):`, error.message);

        // Classify error for user-friendly message
        if (msg.includes('quota') || msg.includes('rate')) {
          const err = new Error('AI service is temporarily busy. Please try again in a few minutes.');
          err.status = 429;
          throw err;
        }
        if (msg.includes('safety') || msg.includes('blocked')) {
          const err = new Error('The request was blocked by content safety filters. Please try a different destination.');
          err.status = 400;
          throw err;
        }
        if (isUnavailable) {
          const err = new Error('AI models are experiencing high demand. Please try again in a few minutes.');
          err.status = 503;
          throw err;
        }

        const err = new Error('Failed to generate trip plan. Please try again.');
        err.status = 500;
        throw err;
      }
    }
  },
};

module.exports = aiService;
