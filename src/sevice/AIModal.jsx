import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite"
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json"
};

export const chatSession = model.startChat({
    generationConfig,
    history: []
});

// Provide a fresh chat session per request to avoid cross-call context bleeding
export const getFreshChatSession = () => model.startChat({
    generationConfig,
    history: []
});

// AI prompt spec migrated from src/constants/options.jsx and enhanced with location-specific categories
export const AI_PROMPT = `Create a detailed travel plan for {location} for {totalDays} days for {traveler} with a {budget} budget.Get the currency details for the location in india in INR and for outside india in USD.

Requirements for hotels:
- Provide 8 to 12 hotel options in the "hotels" array.
- Include OYO brand listings if available in the destination (use their official names; it's fine if the name already includes OYO).
- If a hotel has a lounge facility, ensure "Lounge" appears in the "amenities" list.
- Sort the hotels in order of best match to the user's preferences: align with {budget}, suitable for {traveler}, proximity to major attractions in {location}; when tied, prefer higher rating.
- Prefer centrally located options with good public transport access.
- If the location has available ashrams or dharmashalas , include "Ashram" or "Dharmashala" in the "hotel".

Requirements for restaurants (top picks across cuisines and budgets):
- Provide 8 to 12 items in the "restaurants" array.
- Include a mix of local cuisine and popular categories (e.g., street food, casual, fine dining) suitable for {traveler}.
- When available, include cuisine types and a price range.

Requirements for markets / shopping:
- Provide 6 to 12 items in the "markets" array.
- Include major shopping malls, famous local markets/bazaars, and specialty streets.

Requirements for attractions (places to visit):
- Ensure the day-by-day "itinerary" highlights notable attractions, landmarks, and points of interest across {location}.
- Balance iconic must-see spots with a few lesser-known local gems.

Enhance with comprehensive location-specific categories:
- neighborhoods: 5–8 key areas with their vibe and best-for (e.g., nightlife, family, food scene), plus 1–2 highlights each.
- gettingAround: public transit, ride-hailing/taxis, walking/biking, and cards/passes with price ranges and where to buy; include typical travel times between popular areas.
- localEssentials: safety tips, common scams to avoid, etiquette and cultural norms, emergency numbers, SIM/eSIM and connectivity tips, and money basics with typical local costs (coffee, metro, meal, airport → center taxi).
- suggestedDayTrips: 3–6 strong options with travel time, transport, highlights, and best season/day.
- extras: Provide detailed objects for rainy-day ideas, nightlife, and family-friendly activities (each 6–9 items), plus accessibility tips. Include for each item: name/title, exact location or neighborhood, brief description (1–2 lines), and optional photoUrl.

Return ONLY a JSON object in the following strict format without any additional text:
{
  "summary": "Brief overview of the complete trip in 2-3 sentences",
  "hotels": [
    {
      "name": "Exact hotel name",
      "rating": "4.5",
      "priceRange": "$200-$300",
      "location": "Exact hotel address or area",
      "amenities": ["Pool", "Spa", "Restaurant", "WiFi"],
      "description": "Brief description of hotel highlights and why it's recommended",
      "photoUrl": "Optional hotel photo URL"
    }
  ],
  "restaurants": [
    {
      "name": "Exact restaurant name",
      "rating": "4.6",
      "priceRange": "$$",
      "location": "Exact address or neighborhood",
      "cuisine": "Italian, Seafood",
      "description": "Brief reason why it’s recommended",
      "photoUrl": "Optional photo URL"
    }
  ],
  "markets": [
    {
      "name": "Exact market/mall name",
      "type": "Mall | Local Market | Bazaar | Outlet",
      "rating": "4.4",
      "location": "Exact address or neighborhood",
      "description": "Brief highlight (e.g., souvenirs, food, fashion)",
      "photoUrl": "Optional photo URL"
    }
  ],
  "neighborhoods": [
    {
      "name": "Neighborhood name",
      "vibe": "Trendy | Historic | Family-friendly | Nightlife | Waterfront",
      "bestFor": ["Food", "Shopping", "Museums"],
      "highlights": ["Key street or landmark", "Signature venue"]
    }
  ],
  "gettingAround": {
    "overview": "How visitors typically move around the city",
    "publicTransit": {
      "types": ["Metro", "Bus", "Tram"],
      "tips": ["Buy a day pass if riding 3+ times", "Tap-in/tap-out rules"]
    },
    "rideHailing": {
      "options": ["Uber", "Local app"],
      "approximateCost": "Short ride ~$8-12 in city center"
    },
    "walkingBiking": { "tips": "Areas good for walking/biking, safety notes" },
    "cardsAndPasses": [
      {
        "name": "Transit Card/Pass name",
        "whereToBuy": "Kiosks, stations, convenience stores",
        "priceRange": "$5-$25",
        "validity": "24h | 72h | Weekly"
      }
    ],
    "typicalTravelTimes": [
      { "Approx Time": "35-50 min", "from": "Airport", "to": "City Center", "mode": "Metro/Taxi" },
      { "Approx Time": "15-25 min", "from": "Old Town", "to": "Museum District", "mode": "Bus/Walk" }
    ]
  },
  "localEssentials": {
    "safetyTips": ["Keep valuables zipped", "Avoid unlicensed taxis"],
    "commonScams": ["Overpriced tours", "Closed shop redirect"],
    "etiquette": ["Tipping norms", "Dress code at religious sites"],
    "emergencyNumbers": ["Police 100", "Ambulance 102"],
    "simAndConnectivity": {
      "simProviders": ["Provider A", "Provider B"],
      "eSIM": ["Airalo", "Nomad"],
      "wifiTips": ["Cafes often provide Wi‑Fi with purchase"]
    },
    "money": {
      "currency": "Local currency code",
      "typicalCosts": {
        "metro": "$1.5",
        "coffee": "$2-4",
        "meal": "$8-15",
        "taxiAirportToCenter": "$25-40"
      }
    }
  },
  "suggestedDayTrips": [
    {
      "name": "Nearby destination",
      "travelTime": "1h 15m",
      "transport": "Train | Bus | Car",
      "highlights": ["Top attraction 1", "Top attraction 2"],
      "whenToGo": "Best months or days"
    }
  ],
  "extras": {
    "rainyDayIdeas": [
      { "name": "Aquarium Name", "location": "Exact address / area", "description": "Indoor attraction ideal for wet days", "photoUrl": "Optional" },
      { "name": "Covered Market", "location": "Neighborhood / street", "description": "Explore local food and crafts under cover", "photoUrl": "Optional" }
    ],
    "nightlife": [
      { "name": "Rooftop Bar", "location": "Neighborhood / tower", "description": "City views, cocktails, and DJs", "photoUrl": "Optional" },
      { "name": "Live Music Venue", "location": "Exact venue name / district", "description": "Local bands and touring acts", "photoUrl": "Optional" }
    ],
    "familyFriendly": [
      { "name": "Science Museum", "location": "Exact museum / area", "description": "Hands-on exhibits for kids", "photoUrl": "Optional" },
      { "name": "Zoo / Park", "location": "Exact site / district", "description": "Animal encounters and playgrounds", "photoUrl": "Optional" }
    ],
  },
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "title": "Activity name",
          "time": "10:00 AM - 12:00 PM",
          "location": "Exact location name",
          "description": "Brief description of activity",
          "photoUrl": "Optional activity photo URL"
        },
        {
          "title": "Next activity name",
          "time": "1:30 PM - 3:00 PM",
          "location": "Exact location name",
          "description": "Brief description of activity",
          "photoUrl": "Optional activity photo URL"
        }
      ],
      "notes": "Optional notes for the day",
      "transportBetween": [
        { "fromTitle": "Activity name", "toTitle": "Next activity name", "mode": "Metro", "time": "15 min" }
      ]
    }
  ]
}`;

