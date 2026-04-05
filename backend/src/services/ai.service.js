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

    const prompt = `Generate a complete travel plan for a trip.
Destination: ${destination}
${startLocation ? `Starting from: ${startLocation}` : ''}
Duration: ${totalDays} days
Travelers: ${travelers}
Budget: ${budget} ${currency}
${transportMode ? `Transport: ${transportMode}` : ''}
${startDate ? `Start Date: ${startDate}` : ''}
${endDate ? `End Date: ${endDate}` : ''}

Generate a detailed travel plan in JSON format only. No markdown, no text — pure JSON.

The JSON MUST have this structure:
{
  "tripSummary": { "title": "", "description": "", "totalDays": ${totalDays}, "travelers": ${travelers}, "budget": "${budget} ${currency}" },
  "hotels": [{ "name": "", "address": "", "priceRange": "", "rating": "", "description": "", "image_query": "" }],
  "itinerary": [{ "day": 1, "title": "", "activities": [{ "time": "", "activity": "", "location": "", "details": "", "image_query": "", "estimatedCost": "" }] }],
  "restaurants": [{ "name": "", "cuisine": "", "priceRange": "", "rating": "", "address": "", "mustTry": "", "image_query": "" }],
  "placesToVisit": [{ "name": "", "description": "", "bestTime": "", "entryFee": "", "timeNeeded": "", "image_query": "" }],
  "suggestedDayTrips": [{ "name": "", "distance": "", "description": "", "highlights": [], "image_query": "" }],
  "neighbourhoods": [{ "name": "", "vibe": "", "bestFor": "", "description": "" }],
  "markets": [{ "name": "", "type": "", "bestFor": "", "timings": "", "image_query": "" }],
  "localEssentials": { "emergency": "", "currency": "", "language": "", "transportation": "", "tips": [] },
  "gettingAround": { "overview": "", "options": [{ "mode": "", "details": "", "cost": "" }] },
  "extras": { "packingTips": [], "bestTimeToVisit": "", "localCustoms": [], "usefulApps": [] }
}

IMPORTANT: Return ONLY valid JSON. No markdown code fences. No explanatory text.`;

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
