# App Store Launch Checklist

_Last updated: 2026-04-14_

Legend: ✅ Done · 🔲 Still needed · ⚠️ Partially done / needs manual step

---

## 1. Supabase / Backend

- ✅ Neighborhood colors applied (`038_neighborhood_colors.sql`)
- ✅ Duplicate venues deduped (`037_fix_duplicate_venues.sql`)
- ✅ Test data purged (`039_purge_test_data.sql`)
- ✅ Score-predictions edge function deployed
- ✅ Cron jobs registered (score-predictions nightly, heat-scores every 15m, spike notifications every 30m)
- ✅ Heat decay logic (`019_heat_decay.sql`)
- 🔲 **Run `040_delete_account_rpc.sql`** in Supabase Dashboard → SQL Editor
  - Creates `delete_own_account()` RPC (required for account deletion feature)
- 🔲 **Run `041_streak_trigger.sql`** in Supabase Dashboard → SQL Editor
  - Creates streak + daily heat increment trigger
- 🔲 Confirm all migrations are applied in production Supabase project
- 🔲 Verify PostGIS extension is enabled (Database → Extensions)
- 🔲 Confirm RLS policies are active on all tables
- 🔲 Swap `.env.local` to production Supabase URL + anon key (when going live)

---

## 2. Phone Auth (Twilio) — NOT YET SET UP

- 🔲 **Create a Twilio account** at twilio.com
- 🔲 **Enable Twilio Verify** in your Twilio console (used for SMS OTP)
- 🔲 **Connect Twilio to Supabase**: Supabase Dashboard → Authentication → Providers → Phone → enter Twilio Account SID, Auth Token, and Verify Service SID
- 🔲 Test phone sign-up flow end-to-end on a physical device
- Note: The app UI for phone sign-up already exists (`app/(auth)/login.tsx`). Only the Supabase → Twilio connection is missing.

---

## 3. Mapbox

- 🔲 Create a production Mapbox **public** token (restrict to bundle ID `com.allstreets.pulse`)
- 🔲 Create a Mapbox **secret** token for native SDK download
- 🔲 Add secret token to `app.json` under `@rnmapbox/maps` plugin config (see Mapbox docs for `RNMapboxMapsDownloadToken`)
- 🔲 Add production public token to EAS Secrets: `eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value <token>`
- ⚠️ **Never commit the secret token to git**

---

## 4. Push Notifications (APNs)

- ✅ `useNotifications.ts` wired with correct EAS `projectId`
- ✅ `expo-notifications` added to `app.json` plugins
- ✅ `notify-spikes` edge function deployed
- 🔲 **Install EAS CLI first**: `npm install -g eas-cli`
- 🔲 **Create APNs key** in Apple Developer portal → Keys → enable Apple Push Notifications service → download `.p8`
- 🔲 **Upload APNs key to Expo**: `eas credentials` (select iOS → Production → Push Notifications → Add new APNs key)
  - Note: `npx eas credentials` requires `eas-cli` installed globally — run `npm install -g eas-cli` first
- 🔲 Upload APNs key to Supabase: Dashboard → Settings → Edge Functions → APNs (if using Supabase push delivery)

---

## 5. Privacy Policy

- ✅ `docs/privacy-policy.html` created (covers location, account data, no ad tracking, deletion)
- ✅ Privacy Policy link added to Profile screen
- ⚠️ **GitHub Pages not yet enabled** — repo is private; requires GitHub Enterprise or making repo public
  - Holding off until launch
  - When ready: GitHub repo Settings → Pages → Source: `/docs` on `main`
  - Policy URL will be: `https://allstreets.github.io/pulse-fresh/privacy-policy.html`
- 🔲 Add privacy policy URL to App Store Connect before submitting

---

## 6. Account Deletion (Apple Required)

- ✅ `delete_own_account()` RPC created (`040_delete_account_rpc.sql`) — cascades all user data
- ✅ "Delete Account" button added to Profile screen with two-step confirmation
- 🔲 Run `040_delete_account_rpc.sql` in Supabase (see Section 1)

---

## 7. EAS Build Configuration

- ✅ `eas.json` production profile has `autoIncrement: true`
- ✅ `eas.json` submit profile created with placeholder credentials
- 🔲 **Install EAS CLI**: `npm install -g eas-cli`
- 🔲 **Log in**: `eas login`
- 🔲 **Fill in `eas.json` submit placeholders** (when ready to submit):
  - `appleId`: your Apple Developer email
  - `ascAppId`: numeric App ID from App Store Connect → App Information
  - `appleTeamId`: 10-char Team ID from Apple Developer portal
- 🔲 **Add EAS secrets** (do this before running the production build):
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value <production_token>
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://qgrskiwkyizyqztxolrw.supabase.co
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon_key>
  ```
- 🔲 **Run production build**: `eas build --platform ios --profile production`
- 🔲 Verify build passes without errors
- 🔲 **Submit to App Store**: `eas submit --platform ios --latest`

---

## 8. App Store Connect Setup

- 🔲 Create app in [App Store Connect](https://appstoreconnect.apple.com)
  - Bundle ID: `com.allstreets.pulse`
  - App name: Pulse
  - Primary language: English (U.S.)
  - Category: Entertainment
- 🔲 Register `com.allstreets.pulse` in Apple Developer portal (Identifiers)
- 🔲 Write app description (up to 4000 chars)
- 🔲 Write promotional text (up to 170 chars, updatable without a new build)
- 🔲 Write keywords (up to 100 chars — e.g. `nightlife,bars,chicago,heatmap,going out`)
- 🔲 Add support URL
- 🔲 Add privacy policy URL (required — must be publicly accessible before submission)
- 🔲 Set age rating (17+ due to alcohol-related content)
- 🔲 Add App Store screenshots:
  - iPhone 6.9" (iPhone 16 Pro Max) — required
  - iPhone 6.5" (iPhone 11 Pro Max) — recommended
  - At least 3 screenshots per device size

---

## 9. Apple Developer Account

- 🔲 Active Apple Developer Program membership ($99/yr)
- 🔲 Distribution certificate (EAS creates automatically on first build)
- 🔲 App Store provisioning profile (EAS creates automatically on first build)
- 🔲 APNs key (see Section 4)

---

## 10. App Review Notes (write before submitting)

Include in the "Notes for App Review" field in App Store Connect:

> Pulse is a real-time nightlife heatmap for Chicago. Users check in at bars and venues by tapping a ping button. Background location is used passively to record venue presence so the heatmap stays live without requiring the app to be open.
>
> Test account: [create a test account and add credentials here before submitting]
>
> The app references alcohol-related venues (bars). No alcohol is sold through the app.

---

## 11. Final Smoke Test Before Submitting

- 🔲 Auth flow: sign up → onboarding (4 steps) → sign in → sign out → password reset
- 🔲 Map: heatmap loads, neighborhood polygons render, venue markers tap correctly
- 🔲 Tonight tab: hot venues list loads, show more works, scene cards tap to map
- 🔲 Ping button works and registers a location ping (streak increments on first daily ping)
- 🔲 Venue sheet: opens from map tap and tonight tab; share button generates card image
- 🔲 Neighborhood sheet opens from map tap
- 🔲 Friends: send request, accept, view friends heatmap
- 🔲 Profile: ping count, predictions, leaderboard, notification toggle, Privacy Policy link, Delete Account button
- 🔲 Push notifications: test a spike notification triggers correctly
- 🔲 Account deletion: confirm the two-step alert appears; test full deletion on a throwaway account
- 🔲 Test on a **physical device** (not just simulator) — push tokens and share sheet require a real device
- 🔲 Test on a slow network connection

---

## 12. Post-Launch

- 🔲 Monitor Supabase logs for errors in the first 24 hours
- 🔲 Set up error alerting (Supabase or external)
- 🔲 Respond to App Store reviews
- 🔲 Plan first OTA update (Expo Updates) for any hot fixes without a full resubmit
