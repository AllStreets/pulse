# Pulse — Design Spec
**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Pulse is a mobile app (iOS + Android) for people who go out in cities. It combines a live heatmap of where people are right now, a social prediction market for calling what will be hot tonight, and a crowdsourced local knowledge layer with neighborhood history and insider context.

Launch city: Chicago. Expansion triggered at 1,000 weekly active users.

The core differentiator is the **"Call It" prediction mechanic** — users predict which venues and neighborhoods will surge each night, build a reputation score based on accuracy, and see their predictions validated or busted by real-time location data. This drives daily retention and creates a social layer that Google Maps, Yelp, and Instagram cannot replicate.

---

## Architecture

### Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile | React Native + Expo | Single codebase for iOS/Android, Connor's React background, Expo handles background location + push notifications + OTA |
| Maps | Mapbox | Custom heatmap layers, 3D rendering, already used in Chicago Explorer |
| Backend / DB | Supabase | PostGIS for geospatial queries, real-time subscriptions for live heatmap, built-in auth, edge functions for prediction scoring, scales without re-architecture |
| Background location | Expo Location API | Background task support, clean permission handling |
| Push notifications | Expo Notifications | Prediction outcomes, surge alerts, social activity |

### Data Flow

1. User's phone sends anonymized location pings → Supabase
2. Pings are snapped to nearest venue within 50m or bucketed to neighborhood level — raw coordinates never stored
3. Supabase aggregates heat scores by venue/neighborhood in real time
4. Real-time subscriptions push heatmap updates to all open clients
5. At 2am nightly, a scheduled Supabase edge function scores all open predictions against final heat data and updates user Heat Scores

### Core Data Models

**Venues**
- id, name, neighborhood_id, coordinates (PostGIS point), category, cover, age_policy, music_genre, dress_code
- current_heat_score, historical_heat_data (JSONB by day/hour)

**Neighborhoods**
- id, name, city_id, boundary (PostGIS polygon), scene_description, history, best_for

**Location Pings**
- venue_id (nullable), neighborhood_id, timestamp, aggregated_count — no user_id, no raw coordinates

**Predictions**
- id, user_id, target_type (venue | neighborhood), target_id, time_window (tonight | weekend | event), created_at, outcome (pending | correct | incorrect), boldness_score, points_awarded

**Local Knowledge**
- id, author_id, target_type, target_id, type (vibe_tag | insider_tip | scene_description | history), content, upvotes, created_at

**Users**
- id, username, heat_score, local_rep, credibility_badge (casual | regular | local | legend), streak, following[], created_at

---

## Features

### 1. Live Heatmap

The home screen is a Mapbox map of Chicago showing live heat intensity.

- Neighborhood-level by default, zooms to venue-level as user gets closer
- Heat intensity reflects anonymized location density in the last 30 minutes, 2 hours, and full tonight (toggleable)
- Venues pulse visually when surging above their historical average for that time slot
- Prediction pins overlay the map — call volume determines pin size, color shifts blue (predicted) → orange (confirmed hot) → red (peak)
- Weather and major Chicago events (Bears/Cubs/Blackhawks games, festivals) available as contextual overlays

**Historical scrubber:** Tap any venue or neighborhood and scrub back in time to see heat patterns by day of week, time of night, season.

### 2. "Call It" Prediction Mechanic

The daily engagement loop.

- Users get **10 calls per night**, resetting at noon each day
- Call types:
  - **Tonight** — venue or neighborhood, closes and scores at 2am
  - **This weekend** — broader area or vibe category, closes Sunday night
  - **Event calls** — tied to specific events, scored when event ends
- A call predicts the target will exceed its historical average heat score for that time window. Historical averages are computed in 2-hour buckets (e.g., 8–10pm, 10pm–12am, 12–2am) by day of week — a Friday 10pm call is compared against all previous Friday 10pm readings for that venue.
- **Early Call Bonus:** Calls made before a venue crosses its 75th-percentile historical heat threshold score at 2x points — rewards genuine local knowledge over following the crowd
- Calls made after a venue has already crossed its 75th-percentile threshold score at 0.5x points

**Scoring:** Nightly edge function runs at 2am, compares prediction targets against final heat data, awards points based on accuracy and boldness score, updates Heat Scores and streaks.

**Seed venues at launch:** 30 venues across 6 Chicago neighborhoods (Wicker Park, Logan Square, River North, Wrigleyville, Pilsen, West Loop). New venues added by community suggestion + admin approval.

### 3. Venue Cards

Tap any venue on the map:

- Current heat vs. historical average for this time/day
- Live prediction count and predictors (with their Heat Scores)
- Tonight's heat timeline — curve graph across the night so far
- Historical heat chart — best nights, peak hours, seasonal patterns
- Vibe tags — crowd-sourced short descriptors, upvoted by community
- Practical info — cover, age policy, music genre, dress code (contributed by locals, kept current)

### 4. Neighborhood Cards

Same structure as venue cards, zoomed out:

- Neighborhood heat pattern and driving venues
- Scene description (wiki-style, written by verified locals)
- History — cultural/historical context
- Best for — when it peaks, what crowd, what to expect
- Insider tips — short, specific, upvoted

### 5. Local Knowledge Layer

Structured cultural depth for travelers and newcomers.

- All knowledge tied to venues or neighborhoods, not free-form posts
- Contribution types: vibe tags, insider tips, scene descriptions, history entries
- Contributions are upvoted by community, feeding Local Rep score
- Scene descriptions and history are wiki-style — editable by users with Local Rep ≥ 50
- New contributions by users with Local Rep < 50 go into a moderation queue before publishing

### 6. Social Layer & Reputation

**Two reputation tracks:**
- **Heat Score** — rolling prediction accuracy, weighted by boldness and streak. Primary reputation signal.
- **Local Rep** — contribution quality score, built through upvoted tips and descriptions.

Both feed into a **Credibility Badge**: Casual → Regular → Local → Legend. Based on sustained accuracy and contribution, not follower count.

**Social graph:**
- Follow people whose calls you trust
- "Following" heat overlay on map — see what trusted locals are calling tonight
- No public follower counts — credibility over clout

**Activity feed (secondary tab):**
- Network's live calls
- Venues currently surging (crossed historical average in last 30 min)
- Resolved predictions from followed users
- Trending local knowledge

**Sharing:**
- Any venue card shareable as a clean graphic (Instagram story, iMessage)
- "I called it" share card on prediction success — Heat Score, streak, venue name
- Primary organic growth mechanic

**Push notifications:**
- Prediction resolved (2am)
- Venue you follow is surging now
- Bold call from someone you follow
- Weekly Heat Score summary

---

## Monetization

### Free Tier
Full heatmap, 10 nightly calls, venue cards, local knowledge, social layer, 30 days of historical heat data.

### Pulse Pro — $4.99/month
- Full all-time historical heat data
- Advanced prediction analytics (accuracy by neighborhood, day, venue type)
- "Early signal" push alerts when a venue starts surging before it's obvious
- Saved night itineraries with heat forecasts across multiple venues

### Venue Dashboard — $49–99/month (B2B)
- Venues see their own analytics — traffic trends, competitive comparison, underperforming nights
- Verified venue badge on map
- Ability to post confirmed events, specials, announcements to their venue card
- Primary revenue engine — 20 venues at $99/month = ~$2k MRR during beta

---

## Chicago Launch Strategy

**Phase 1 — Closed beta**
- Recruit 50–100 users through r/chicago, local Discord servers, Chicago nightlife Instagram accounts
- Seed 30 venues across 6 neighborhoods
- Reach out to 5–10 venues directly about free venue dashboard access during beta — validates B2B interest and gets real venue data into the app

**Phase 2 — Public launch**
- Launch publicly once heatmap has sufficient density (~200 active users)
- App Store + Google Play release
- Push "I called it" sharing mechanic as primary growth driver

**Phase 3 — Expansion**
- Expansion trigger: 1,000 weekly active users in Chicago
- Open waitlist for next city (likely NYC or Austin)
- B2B venue dashboard becomes paid at expansion

---

## Error Handling & Edge Cases

- **No location permission:** App functions fully without passive location. User sees heatmap built from other users. Prediction and local knowledge features fully available. Prompt to enable location shown once on onboarding, not repeatedly.
- **Low user density (early beta):** Heatmap shows "limited data" indicator for venues with fewer than 5 pings in the current window. Predictions still allowed — outcomes require at least 5 pings to score; calls on venues that don't meet this threshold by 2am are voided and calls refunded, same as the insufficient-data edge case.
- **Venue doesn't exist yet:** Users can suggest new venues via a simple form — name, address, category. Admin approval queue before it appears on map.
- **Prediction ties / edge cases:** If a venue's heat data is insufficient at 2am scoring window, prediction is voided and calls refunded — no penalty, no points.

---

## Testing Strategy

- **Unit tests:** Prediction scoring logic (boldness calculation, outcome determination, edge cases)
- **Integration tests:** Supabase real-time subscriptions, location ping aggregation, edge function scoring
- **E2E tests (Detox):** Core user flows — onboarding, making a call, viewing venue card, following a user
- **Manual:** Heatmap rendering at various zoom levels, background location behavior, push notification delivery

---

## Out of Scope (v1)

- Multi-city support (expansion happens after Chicago traction)
- Direct messaging between users
- Venue reservation or ticketing integration
- Real-money prediction markets (requires licensing)
- Web app
- Android-specific features beyond standard RN/Expo support
