# 🚀 Deploy to Vercel - Quick Fix Guide

## Problem Fixed ✅
The "Cannot read properties of undefined (reading 'useLayoutEffect')" error has been fixed by updating the build configuration.

## What Changed
- **vite.config.js** - Simplified chunking strategy to prevent React dependency errors
- **vercel.json** - Added SPA routing support for React Router

---

## Deploy Steps

### 1. Push the Fixed Code
```powershell
git add .
git commit -m "Fix Vercel deployment - simplified vendor chunking"
git push origin main
```

### 2. Add Environment Variables to Vercel

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables (get values from your local setup):

#### Firebase (Required)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

#### Google Services (Required)
```
VITE_GOOGLE_AUTH_CLIENT_ID
VITE_GOOGLE_GEMINI_AI_API_KEY
VITE_GOOGLE_PLACES_API_KEY
```

#### Optional APIs
```
VITE_PEXELS_API_KEY
VITE_RAPIDAPI_KEY (has fallback)
VITE_OPENWEATHER_API_KEY
VITE_MAPBOX_ACCESS_TOKEN
```

**Important:** For each variable, select all environments (Production, Preview, Development)

### 3. Vercel Will Auto-Deploy
Once you push to GitHub, Vercel will automatically:
1. Pull the new code
2. Build with the fixed configuration
3. Deploy the app

### 4. Verify the Deployment
1. Open your Vercel URL
2. Press **F12** → Console tab
3. Check for errors
4. Test navigation between pages

---

## What Was Fixed

### Before ❌
```javascript
// Multiple vendor chunks with React dependencies split apart
vendor-react.js    (154 KB) - React core
vendor-misc.js     (451 KB) - Has React components
vendor-ui.js       (60 KB)  - Has React components
vendor-date.js     (143 KB) - Has React components
// ❌ Caused: "Cannot read properties of undefined (reading 'useLayoutEffect')"
```

### After ✅
```javascript
// Simplified chunking - React and dependencies together
vendor.js          (839 KB) - React + all dependencies together
vendor-firebase.js (454 KB) - Firebase only (independent)
// ✅ Fixed: All React-dependent code loads together
```

---

## Troubleshooting

### Still showing white screen?
1. Check browser console (F12) for new errors
2. Verify all environment variables are added in Vercel
3. Try a hard refresh: **Ctrl + Shift + R**

### Vercel not auto-deploying?
1. Go to Vercel Dashboard → Deployments
2. Click **Redeploy** on the latest deployment
3. Uncheck "Use existing Build Cache"

---

## Files Modified
- ✅ `vite.config.js` - Fixed vendor chunking
- ✅ `vercel.json` - Added SPA routing support

**Ready to deploy!** Push your code and add the environment variables.
