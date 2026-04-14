const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

let genAI = null;
let model = null;

const initGemini = () => {
  if (!config.apis.gemini) {
    logger.warn('Gemini API key not configured. AI generation will fail.');
    return;
  }
  genAI = new GoogleGenerativeAI(config.apis.gemini);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
    if (!model) {
      throw new Error('AI service not configured. Check GEMINI_API_KEY.');
    }

    const prompt = `You are an expert travel planner. Generate an extremely detailed and comprehensive travel plan.

TRIP DETAILS:
- Destination: ${destination}
${startLocation ? `- Starting from: ${startLocation}` : ''}
- Duration: ${totalDays} days
- Travelers: ${travelers}
- Budget: ${budget} ${currency}
${transportMode ? `- Transport preference: ${transportMode}` : ''}
${startDate ? `- Start Date: ${startDate}` : ''}
${endDate ? `- End Date: ${endDate}` : ''}

CRITICAL REQUIREMENTS — YOU MUST FOLLOW ALL OF THESE:

1. HOTELS: Generate AT LEAST 5 hotels. Each hotel MUST include:
   - "name": Real hotel name that exists in ${destination}
   - "location": FULL street address (e.g., "123 Main Street, District Name, ${destination}")
   - "priceRange": Price per night in ${currency} (e.g., "${currency} 3,000 - 5,000 per night")
   - "rating": A realistic number between 3.0 and 5.0 (e.g., 4.3)
   - "description": 2-3 sentences describing the hotel, its ambiance, and key features
   - "amenities": Array of 4-6 amenities (e.g., ["Free WiFi", "Pool", "Spa", "Restaurant", "Airport Shuttle"])
   - "image_query": Search query for hotel image

2. RESTAURANTS: Generate AT LEAST 6 restaurants. Each MUST include:
   - "name": Real restaurant name in ${destination}
   - "cuisine": Type of cuisine
   - "priceRange": Meal cost range in ${currency} (e.g., "${currency} 500 - 1,500 per person")
   - "rating": Realistic number between 3.0 and 5.0
   - "location": FULL street address
   - "mustTry": 2-3 signature dishes as a string
   - "description": 2 sentences about atmosphere and food quality
   - "image_query": Search query for restaurant image

3. ITINERARY: Generate a day-by-day plan for ALL ${totalDays} days. Each day MUST have:
   - "day": Day number (1, 2, 3...)
   - "title": Catchy day title (e.g., "Historical Wonders & Street Food")
   - "activities": Array of 3-5 activities, each with:
     - "time": Specific time (e.g., "09:00 AM")
     - "activity": Activity name
     - "location": Full address or landmark name with area
     - "details": 2-3 sentences about what to do and expect
     - "estimatedCost": Cost in ${currency}
     - "image_query": Search query for activity image

4. PLACES TO VISIT: Generate AT LEAST 6 must-see places with:
   - "name", "description" (3 sentences), "bestTime", "entryFee" in ${currency}, "timeNeeded", "image_query"

5. SUGGESTED DAY TRIPS: Generate AT LEAST 3 day trips from ${destination}:
   - "name", "distance" from ${destination}, "description", "highlights" (array of 3-5 strings), "image_query"

6. NEIGHBOURHOODS: Generate AT LEAST 4 neighbourhoods/areas:
   - "name", "vibe" (1-2 words like "Bohemian", "Upscale"), "bestFor" (e.g., "Nightlife", "Shopping"), "description" (2-3 sentences)

7. MARKETS: Generate AT LEAST 4 markets/shopping areas:
   - "name", "type" (e.g., "Street Market", "Mall", "Bazaar"), "bestFor", "timings" (operating hours), "image_query"

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
   - "budget": "${budget} ${currency}"

DATA QUALITY RULES:
- NO empty strings anywhere. Every single field must contain real, accurate, locally-specific data.
- All ratings must be realistic numbers between 3.0 and 5.0 (not strings, actual numbers like 4.2).
- All addresses must be REAL locations, not just city names. Include street/area/district.
- All prices must be in ${currency} with realistic local pricing.
- Use "location" as the field name for addresses everywhere (NOT "address").
- The response must be culturally accurate and locally relevant.

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown code fences. No explanatory text before or after. Pure JSON object.

{
  "tripSummary": { "title": "...", "description": "...", "totalDays": ${totalDays}, "travelers": ${travelers}, "budget": "${budget} ${currency}" },
  "hotels": [{ "name": "...", "location": "...", "priceRange": "...", "rating": 4.2, "description": "...", "amenities": ["..."], "image_query": "..." }],
  "itinerary": [{ "day": 1, "title": "...", "activities": [{ "time": "...", "activity": "...", "location": "...", "details": "...", "estimatedCost": "...", "image_query": "..." }] }],
  "restaurants": [{ "name": "...", "cuisine": "...", "priceRange": "...", "rating": 4.5, "location": "...", "mustTry": "...", "description": "...", "image_query": "..." }],
  "placesToVisit": [{ "name": "...", "description": "...", "bestTime": "...", "entryFee": "...", "timeNeeded": "...", "image_query": "..." }],
  "suggestedDayTrips": [{ "name": "...", "distance": "...", "description": "...", "highlights": ["..."], "image_query": "..." }],
  "neighbourhoods": [{ "name": "...", "vibe": "...", "bestFor": "...", "description": "..." }],
  "markets": [{ "name": "...", "type": "...", "bestFor": "...", "timings": "...", "image_query": "..." }],
  "localEssentials": { "emergencyNumbers": [{"title":"...","description":"..."}], "currency": "...", "language": "...", "safetyTips": ["..."], "commonScams": ["..."], "etiquette": ["..."], "simAndConnectivity": { "simProviders": [{"name":"...","description":"..."}], "eSIM": [{"name":"...","description":"..."}], "wifiTips": "..." }, "money": { "currency": "...", "typicalCosts": { "meal": "...", "transport": "...", "coffee": "...", "water": "..." } } },
  "gettingAround": { "overview": "...", "publicTransit": { "types": [{"title":"...","description":"..."}], "tips": [{"title":"...","description":"..."}] }, "rideHailing": { "options": [{"title":"...","description":"..."}], "approximateCost": "..." }, "walkingBiking": { "tips": "..." }, "cardsAndPasses": [{"title":"...","priceRange":"...","validity":"...","whereToBuy":"..."}], "typicalTravelTimes": [{"title":"...","time":"...","mode":"..."}] },
  "extras": { "rainyDayIdeas": [{"title":"...","description":"...","location":"..."}], "nightlife": [{"title":"...","description":"...","location":"..."}], "familyFriendly": [{"title":"...","description":"...","location":"..."}], "packingTips": ["..."], "bestTimeToVisit": "...", "localCustoms": ["..."], "usefulApps": ["..."] }
}`;

    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const tripData = parseAiResponse(rawText);
      return tripData;
    } catch (error) {
      logger.error('AI generation failed:', error.message);

      // Classify error for user-friendly message
      const msg = error.message?.toLowerCase() || '';
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

      const err = new Error('Failed to generate trip plan. Please try again.');
      err.status = 500;
      throw err;
    }
  },
};

module.exports = aiService;
