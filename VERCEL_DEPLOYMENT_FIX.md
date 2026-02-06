# Vercel Deployment Fix - Environment Variables Checklist

## Required Environment Variables for Vercel

Copy these from your local development setup and add them to Vercel:

### Firebase Configuration (Required)
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] VITE_FIREBASE_MEASUREMENT_ID

### Google Services (Required)
- [ ] VITE_GOOGLE_AUTH_CLIENT_ID
- [ ] VITE_GOOGLE_GEMINI_AI_API_KEY
- [ ] VITE_GOOGLE_PLACES_API_KEY

### Other APIs (Optional but recommended)
- [ ] VITE_PEXELS_API_KEY
- [ ] VITE_RAPIDAPI_KEY
- [ ] VITE_OPENWEATHER_API_KEY
- [ ] VITE_MAPBOX_ACCESS_TOKEN

## How to Add to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project "Vegaa_AI"
3. Click **Settings** → **Environment Variables**
4. For each variable:
   - Name: (e.g., VITE_FIREBASE_API_KEY)
   - Value: (paste your API key)
   - Environment: Select "Production", "Preview", and "Development"
   - Click **Save**

## After Adding Variables

1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Select **Redeploy**
4. Check "Use existing Build Cache" (faster)
5. Click **Redeploy**

## Files Changed
- ✅ Created vercel.json for React Router support

## Next Steps
1. Add all environment variables listed above
2. Redeploy on Vercel
3. Check if the white screen is fixed
4. If still white, check browser console for remaining errors
