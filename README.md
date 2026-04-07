# Pulse

A social city intelligence app for Chicago. See where people are going out in real time, predict what will be hot tonight, and discover local knowledge about neighborhoods and venues.

## What It Does

- **Live Heatmap** — real-time map of where people are in Chicago, powered by anonymized location pings aggregated by venue and neighborhood
- **Call It** — predict which venues and neighborhoods will surge tonight. 10 calls per night. Early calls score 2x points; obvious calls score 0.5x
- **Heat Score** — rolling accuracy rating that builds your reputation as a local
- **Venue Cards** — current heat vs historical average, tonight's heat timeline, vibe tags, and practical info
- **Local Knowledge** — neighborhood histories, scene descriptions, and insider tips from verified locals

## Tech Stack

- **Mobile** — React Native + Expo SDK 52, Expo Router v4
- **Maps** — Mapbox (`@rnmapbox/maps`) with custom heatmap layers
- **Backend** — Supabase (PostgreSQL + PostGIS, real-time subscriptions, edge functions, auth)
- **State** — Zustand
- **Location** — expo-location with background task support

## Project Structure

```
pulse/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/             # Login, signup, onboarding
│   └── (tabs)/             # Map, Profile tabs
├── src/
│   ├── components/         # Map, venue, prediction components
│   ├── hooks/              # useAuth, useHeatmap, useVenue, usePredictions
│   ├── lib/                # Supabase client, location tracking, scoring logic
│   ├── stores/             # Zustand user store
│   └── types/              # Shared TypeScript types
├── supabase/
│   ├── migrations/         # PostgreSQL schema, seed data, RPCs
│   └── functions/          # score-predictions edge function (2am cron)
└── __tests__/              # Jest test suites
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Mapbox account

### Environment Variables

Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

For the Mapbox native SDK, add your secret token to `app.json` in the `@rnmapbox/maps` plugin config.

### Database Setup

```bash
npx supabase link --project-ref your_project_ref
npx supabase db push
```

### Run

```bash
npm install
npx expo start
```

### Tests

```bash
npx jest
```

## Architecture Notes

**Anonymized location:** Raw GPS coordinates never leave the device. Pings are snapped to the nearest venue within 50m or bucketed to neighborhood level before being sent. No user ID is stored with pings.

**Prediction scoring:** Runs nightly at 2am via a Supabase edge function. A prediction is correct if the venue's final heat score exceeds its historical average for that day/time bucket. Early calls (made before the venue crosses its 75th-percentile heat threshold) score 2x points.

**Chicago launch:** The app launches with 30 seeded venues across 6 neighborhoods: Wicker Park, Logan Square, River North, Wrigleyville, Pilsen, West Loop.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.
