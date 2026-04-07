# Deployment Guide

## Overview

Pulse has three deployment targets:
1. **Mobile app** — Expo EAS Build → App Store + Google Play
2. **Database + Backend** — Supabase (managed)
3. **Edge Functions** — Supabase Edge Functions (Deno)

---

## 1. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your launch market (us-east-1 for Chicago)
3. Note your project URL and anon key

### Apply Migrations

```bash
npx supabase link --project-ref your_project_ref
npx supabase db push
```

This applies all migrations in order:
- `001_initial_schema.sql` — tables, indexes, RLS policies, auto-profile trigger
- `002_seed_chicago.sql` — 6 neighborhoods, 30 venues
- `003_neighborhood_rpc.sql` — neighborhood point-lookup function
- `004_scoring_rpc.sql` — heat score increment function

### Enable PostGIS

PostGIS is enabled by the first migration (`create extension if not exists postgis`). Verify it's enabled in the Supabase dashboard under Database → Extensions.

### Deploy Edge Function

```bash
npx supabase functions deploy score-predictions
```

### Set Cron Schedule (2am Chicago time = 8am UTC)

In Supabase dashboard → Edge Functions → score-predictions → Schedules:
```
0 8 * * *
```

### Environment Variables for Edge Function

In Supabase dashboard → Edge Functions → score-predictions → Secrets, the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected — no manual configuration needed.

---

## 2. Mapbox Setup

1. Create an account at [mapbox.com](https://mapbox.com)
2. Create a **public token** (for the app, starts with `pk.`)
3. Create a **secret token** (for native SDK download, starts with `sk.`)
4. Add the public token to `.env.local` as `EXPO_PUBLIC_MAPBOX_TOKEN`
5. Add the secret token to `app.json` in the `@rnmapbox/maps` plugin config:

```json
["@rnmapbox/maps", { "RNMapboxMapsDownloadToken": "sk.your_secret_token" }]
```

**Never commit the secret token to git.** Use EAS Secrets for CI builds.

---

## 3. EAS Build (App Store + Google Play)

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Configure EAS

```bash
eas build:configure
```

This creates `eas.json`. Use this configuration:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_anon_key",
        "EXPO_PUBLIC_MAPBOX_TOKEN": "your_mapbox_token"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_anon_key",
        "EXPO_PUBLIC_MAPBOX_TOKEN": "your_mapbox_token"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Use EAS Secrets for production keys** instead of hardcoding in `eas.json`:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_value
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_value
eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value your_value
eas secret:create --scope project --name MAPBOX_SECRET_TOKEN --value sk.your_secret_token
```

### Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

### Submit to Stores

```bash
# App Store (requires Apple Developer account)
eas submit --platform ios

# Google Play (requires Google Play Console account)
eas submit --platform android
```

---

## 4. iOS-Specific Setup

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Create an App ID with bundle identifier `com.pulse.app`
3. Enable capabilities: Background Modes (Location updates, Background fetch)
4. EAS will handle provisioning profiles automatically

---

## 5. Android-Specific Setup

1. Create a Google Play Console account ($25 one-time)
2. Create an app with package `com.pulse.app`
3. For background location: Android 14+ requires `FOREGROUND_SERVICE_LOCATION` permission — add to `app.json` before production build:

```json
"android": {
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION",
    "FOREGROUND_SERVICE",
    "FOREGROUND_SERVICE_LOCATION"
  ]
}
```

---

## 6. Beta Launch Checklist

- [ ] Supabase project created and migrations applied
- [ ] 30 seed venues visible in Supabase Table Editor
- [ ] Edge function deployed and cron schedule set
- [ ] Mapbox tokens configured
- [ ] `.env.local` filled with real values (not committed)
- [ ] EAS build succeeds for iOS and Android
- [ ] TestFlight / internal track build distributed to beta testers
- [ ] Background location tested on physical device (simulator cannot test background tasks)
- [ ] Auth flow tested end-to-end (signup → onboarding → map → call it)
- [ ] At least one prediction manually verified through nightly scoring
