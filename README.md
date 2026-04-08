# Pulse

Real-time Chicago nightlife intelligence. See what's hot tonight, make predictions, and build your local rep.

## What it does

**Live heatmap** — anonymous location pings from users power a real-time heatmap across Chicago neighborhoods and venues. Darker = hotter.

**Calls** — you get 10 calls per night. Tap "Call It" on a venue you think will blow up before 2AM. Early calls (made before a venue gets crowded) score 2× points. Results drop at 2AM.

**Scenes** — each neighborhood has a live signal count, vibe tags, and a ranked list of active venues.

**Leaderboard** — your heat score accumulates over time. Track your rank vs. the city.

**Guest browse** — explore the heatmap and tonight's feed without an account. Sign up when you're ready to call it.

## Stack

- React Native 0.81.5 + Expo SDK 54 + Expo Router v6
- Supabase (auth, Postgres + PostGIS, realtime, edge functions)
- Mapbox GL (heatmap + venue/neighborhood layers)
- Zustand (client state)
- TypeScript strict mode throughout

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in:
   - `EXPO_PUBLIC_MAPBOX_TOKEN`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_CTA_API_KEY`
   - `EXPO_PUBLIC_TICKETMASTER_KEY`
3. `npm install`
4. `npx expo start --dev-client`

> This app uses `@rnmapbox/maps` which requires a native build — it will not run in Expo Go.

## Supabase setup

Run migrations in order from `supabase/migrations/`. The edge function at `supabase/functions/score-predictions/` needs to be deployed and scheduled to run nightly at 2AM CT.

## Build (TestFlight)

```bash
eas build --platform ios --profile preview
```

EAS project ID: `818ef116-1a4e-4b5f-bb88-db2f3bc80a68`

## Architecture

```
app/
  (auth)/     login (+ guest browse link), onboarding (3-step with Ionicons)
  (tabs)/     tonight feed, map, profile

src/
  hooks/      useTonightFeed, useHeatmap, usePredictions, useLeaderboard, useNotifications, ...
  components/
    ui/         SkeletonBox, Toast, GuestBanner
    venue/      VenueSheet, PingButton, HeatChart, VibeTags
    map/        HeatmapLayer, VenueMarker, NeighborhoodSheet
    tonight/    FirstCallSheet, GameBanner, SceneSection, EventsList
  stores/     userStore (Zustand) — profile, callsUsedTonight, browseMode
  lib/        supabase client, location logic, hours parsing, scoring logic
  types/      all TypeScript interfaces
```

## Scoring

Calling a venue early (before it reaches p75 historical heat) earns 2× points. Calling after the crowd is already there earns 0.5×. The nightly edge function scores all pending predictions at 2AM against final heat scores.

## Tests

```bash
npx jest --passWithNoTests
```
