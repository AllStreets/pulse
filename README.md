# Pulse

A live social nightlife intelligence app for Chicago. See where people are going out in real time, predict what venue will surge tonight, and earn credibility for reading the scene early.

## Demo

> Built as a portfolio project demonstrating a full-stack React Native app with real-time geospatial data, predictive mechanics, and nightly ML-style scoring.

**Features working in the current build:**
- Email auth with Supabase (sign up → onboarding → heatmap)
- Live Mapbox heatmap that updates in real time as location pings arrive
- 56 real Chicago venues across 8 neighborhoods (Wicker Park, Logan Square, River North, Wrigleyville, Lincoln Park, Boystown, Pilsen, South Loop)
- Tap any venue → bottom sheet with heat chart, vibe tags, and prediction button
- "Call It" prediction system — 10 calls per night, boldness multiplier scoring
- Profile screen showing Heat Score, streak, and tonight's accuracy
- Background location tracking (anonymized — no user IDs stored in pings)
- Nightly edge function scores all pending predictions automatically

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Navigation | Expo Router v6 (file-based) |
| Maps | Mapbox GL (@rnmapbox/maps) |
| Backend | Supabase (Postgres + PostGIS + Realtime) |
| Auth | Supabase Auth (email/password) |
| State | Zustand |
| Gestures | React Native Gesture Handler + Bottom Sheet |
| Edge Functions | Supabase Deno functions |
| Build | EAS Build (iOS dev client) |

---

## Architecture

```
app/
  (auth)/login.tsx          # Email login + signup
  (auth)/onboarding.tsx     # Location permission request
  (tabs)/index.tsx          # Live Mapbox heatmap
  (tabs)/profile.tsx        # User stats + sign out
src/
  hooks/
    useAuth.ts              # Supabase session lifecycle
    useHeatmap.ts           # Real-time venue + ping aggregation
    useVenue.ts             # Per-venue data (history, predictions, tags)
    usePredictions.ts       # Call It logic (10/night, dedup, scoring)
  components/
    map/HeatmapLayer.tsx    # Mapbox heatmap from ping GeoJSON
    map/VenueMarker.tsx     # Tappable venue dots
    venue/VenueSheet.tsx    # Bottom sheet with full venue card
    venue/HeatChart.tsx     # Tonight's 2-hour bucket bar chart
    venue/VibeTags.tsx      # Community vibe tag pills
    predictions/CallItButton.tsx
    predictions/CallCounter.tsx
  lib/
    location.ts             # haversine snap-to-venue + anonymized pings
    locationTask.ts         # Expo background task handler
    scoring.ts              # Boldness multiplier + prediction outcome logic
    supabase.ts             # Client with AsyncStorage session persistence
  stores/userStore.ts       # Zustand: profile + nightly call count
supabase/
  migrations/               # 8 migrations: schema, Chicago seed, history seed
  functions/score-predictions/  # Nightly edge function
```

---

## Database Schema

### Core Tables

**venues** — 30 Chicago bars/clubs with PostGIS coordinates, music genre, age policy, cover price, current heat score

**location_pings** — Anonymized pings (venue_id + neighborhood_id, NO user_id). Aggregated into heatmap weights over a rolling 30-minute window.

**venue_heat_history** — Historical averages by day_of_week × hour_bucket (2h buckets). Used by the scoring function to determine if tonight's heat beats the historical average.

**predictions** — User predictions: target venue, time_window (tonight/weekend/event), heat_at_call_time, boldness_score (0.5–2.0×), outcome (pending→correct/incorrect/voided).

**profiles** — heat_score, local_rep, credibility_badge (casual→regular→local→legend), day streak.

### Key Design Decisions

- **Privacy by design**: `location_pings` has no `user_id` column. Pings are permanently anonymous.
- **Boldness multiplier**: Calling a venue before it hits p75 historical heat → 2.0× points. Calling after the crowd is already there → 0.5×. Rewards local knowledge.
- **Correctness definition**: A prediction is correct if `finalHeatScore > historicalAvgHeat` for that venue × day × hour combination.
- **Real-time**: Heatmap auto-updates via Supabase Realtime channel subscriptions on location_pings INSERT.

---

## Running Locally

### Prerequisites
- Node 20 (`.nvmrc` pins this — use `nvm use`)
- Xcode 15+ with iOS Simulator
- Mapbox account (for native SDK download token)

### Setup

```bash
# Install deps
npm install --legacy-peer-deps

# Set environment variables
cp .env.local.example .env.local
# Fill in: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_MAPBOX_TOKEN

# Build and run on iOS Simulator
npx expo run:ios
```

> ⚠️ This app uses @rnmapbox/maps which requires a native build. It will NOT run in Expo Go.

### First Run

After the native build completes (3–5 min), Metro connects automatically. From then on, `npx expo start --dev-client` hot-reloads JS changes without rebuilding.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- EAS Build setup and secrets
- Supabase migrations via CLI
- Nightly scoring cron job configuration

---

## Scoring Logic

```typescript
// From src/lib/scoring.ts
function scorePrediction(input: ScoreInput): ScoreOutput {
  const isCorrect = input.finalHeatScore > input.historicalAvgHeat;
  
  // Boldness: called before the venue hit p75 heat = 2x points
  const boldness = input.heatAtCallTime < input.p75Heat ? 2.0 : 0.5;
  
  return {
    outcome: isCorrect ? 'correct' : 'incorrect',
    boldnessScore: boldness,
    pointsAwarded: isCorrect ? BASE_POINTS * boldness : 0,
  };
}
```

The nightly edge function (`supabase/functions/score-predictions`) runs all pending predictions against final venue heat scores and awards points.

---

## What's Next

- [ ] Leaderboard — rank users by heat_score
- [ ] Insider tips — community-sourced venue knowledge
- [ ] Social follows — see predictions from people you follow
- [ ] Neighborhood-level predictions
- [ ] TestFlight distribution (Apple Developer enrollment pending)
