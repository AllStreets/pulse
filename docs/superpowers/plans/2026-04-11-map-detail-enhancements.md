# Map & Detail Sheet Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add address/heat badge to VenueSheet, tabbed NeighborhoodSheet, a Live Intel top bar on the map, heatmap breathing animation, and venue dot ripple overlays.

**Architecture:** Tasks 1–3 lay shared foundations (DB migration, heatColor helper, hours formatter). Tasks 4–6 update the detail sheets. Tasks 7–10 add the three new map-level features (Live Intel Panel, heatmap animation, venue ripple overlay). Each task is independently committable.

**Tech Stack:** React Native (Expo SDK 54), @rnmapbox/maps v10.3.0, @gorhom/bottom-sheet, Supabase (Postgres), react-native Animated API, TypeScript.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/022_venue_address.sql` | Create | Add `address` column, update `venues_geo` view |
| `src/lib/heatColor.ts` | Create | Shared heat score → hex color helper |
| `src/lib/hours.ts` | Modify | Add `todayHoursString` export |
| `src/types/index.ts` | Modify | Add `address: string \| null` to `Venue` |
| `src/components/venue/VenueSheet.tsx` | Modify | Heat badge + address/hours/phone rows |
| `src/hooks/useNeighborhoodActivity.ts` | Create | Neighborhood ping timeline hook |
| `src/components/map/NeighborhoodSheet.tsx` | Modify | Tabbed layout (Scene/Venues/Activity) |
| `src/components/map/LiveIntelPanel.tsx` | Create | Scrollable top bar with heat cards |
| `src/components/map/HeatmapLayer.tsx` | Modify | Breathing opacity animation via RAF |
| `src/components/map/VenueRippleOverlay.tsx` | Create | RN animated ripple rings over venue dots |
| `app/(tabs)/index.tsx` | Modify | Wire LiveIntelPanel, VenueRippleOverlay, NeighborhoodSheet, camera zoom |
| `__tests__/lib/heatColor.test.ts` | Create | Unit tests for heatColor thresholds |
| `__tests__/lib/hoursFormat.test.ts` | Create | Unit tests for todayHoursString |

---

## Task 1: DB Migration — venue address column

**Files:**
- Create: `supabase/migrations/022_venue_address.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Add address column to venues
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS address text;

-- Seed addresses for existing Chicago venues
UPDATE venues SET address = '2011 W North Ave, Chicago, IL 60647'   WHERE name = 'Subterranean';
UPDATE venues SET address = '954 W Belmont Ave, Chicago, IL 60657'  WHERE name = 'Berlin';
UPDATE venues SET address = '1444 W Chicago Ave, Chicago, IL 60642' WHERE name = 'Beauty Bar';
UPDATE venues SET address = '2159 N Milwaukee Ave, Chicago, IL 60647' WHERE name = 'The Whistler';
UPDATE venues SET address = '3201 W Armitage Ave, Chicago, IL 60647' WHERE name = 'Scofflaw';
UPDATE venues SET address = '1551 W Division St, Chicago, IL 60642' WHERE name = 'Estelle''s';
UPDATE venues SET address = '2226 W Chicago Ave, Chicago, IL 60622' WHERE name = 'Empty Bottle';

-- Recreate venues_geo view to expose address
CREATE OR REPLACE VIEW venues_geo AS
SELECT
  id,
  neighborhood_id,
  name,
  category,
  cover,
  age_policy,
  music_genre,
  dress_code,
  current_heat_score,
  phone,
  hours,
  address,
  ST_Y(coordinates::geometry) AS lat,
  ST_X(coordinates::geometry) AS lng
FROM venues;

GRANT SELECT ON venues_geo TO anon, authenticated;
```

- [ ] **Step 2: Apply the migration in the Supabase SQL editor**

Open the Supabase dashboard → SQL Editor → paste and run the file contents. Verify with:
```sql
SELECT name, address FROM venues WHERE address IS NOT NULL LIMIT 5;
```
Expected: rows with addresses filled in.

- [ ] **Step 3: Update `Venue` type to include `address`**

File: `src/types/index.ts`, find the `Venue` interface and add one line after `hours`:

```typescript
export interface Venue {
  id: string;
  neighborhood_id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  category: string;
  cover: string | null;
  age_policy: string | null;
  music_genre: string | null;
  dress_code: string | null;
  current_heat_score: number;
  phone: string | null;
  hours: Record<string, string> | null;
  address: string | null;
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/022_venue_address.sql src/types/index.ts
git commit -m "feat: add address column to venues + update venues_geo view"
```

---

## Task 2: Shared heatColor helper + tests

**Files:**
- Create: `src/lib/heatColor.ts`
- Create: `__tests__/lib/heatColor.test.ts`

- [ ] **Step 1: Write the failing test**

File: `__tests__/lib/heatColor.test.ts`

```typescript
import { heatColor } from '@/lib/heatColor';

describe('heatColor', () => {
  it('returns #ff4500 for score 80', () => {
    expect(heatColor(80)).toBe('#ff4500');
  });
  it('returns #ff4500 for score 100', () => {
    expect(heatColor(100)).toBe('#ff4500');
  });
  it('returns #ff8c00 for score 60', () => {
    expect(heatColor(60)).toBe('#ff8c00');
  });
  it('returns #ff8c00 for score 79', () => {
    expect(heatColor(79)).toBe('#ff8c00');
  });
  it('returns #ffcc00 for score 40', () => {
    expect(heatColor(40)).toBe('#ffcc00');
  });
  it('returns #ffcc00 for score 59', () => {
    expect(heatColor(59)).toBe('#ffcc00');
  });
  it('returns #00d4ff for score 39', () => {
    expect(heatColor(39)).toBe('#00d4ff');
  });
  it('returns #00d4ff for score 0', () => {
    expect(heatColor(0)).toBe('#00d4ff');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn jest __tests__/lib/heatColor.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/heatColor'"

- [ ] **Step 3: Create the helper**

File: `src/lib/heatColor.ts`

```typescript
export function heatColor(score: number): string {
  if (score >= 80) return '#ff4500';
  if (score >= 60) return '#ff8c00';
  if (score >= 40) return '#ffcc00';
  return '#00d4ff';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn jest __tests__/lib/heatColor.test.ts
```
Expected: PASS, 8 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/heatColor.ts __tests__/lib/heatColor.test.ts
git commit -m "feat: add shared heatColor helper"
```

---

## Task 3: todayHoursString helper + tests

The `hours` field on a venue is a jsonb object keyed by day abbreviation: `{ "fri": "20:00-04:00", "sat": "20:00-04:00", ... }`. We need a function that returns today's hours as a human-readable string like `"8PM – 4AM"` for the venue info row.

**Files:**
- Modify: `src/lib/hours.ts`
- Create: `__tests__/lib/hoursFormat.test.ts`

- [ ] **Step 1: Write the failing test**

File: `__tests__/lib/hoursFormat.test.ts`

```typescript
import { todayHoursString } from '@/lib/hours';

const HOURS: Record<string, string> = {
  mon: 'closed',
  tue: 'closed',
  wed: '20:00-02:00',
  thu: '20:00-03:00',
  fri: '20:00-04:00',
  sat: '20:00-04:00',
  sun: '18:00-00:00',
};

describe('todayHoursString', () => {
  it('returns null for null input', () => {
    expect(todayHoursString(null)).toBeNull();
  });

  it('returns "Closed tonight" for a closed day', () => {
    // Mock Date to Monday
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-13T20:00:00')); // Monday
    expect(todayHoursString(HOURS)).toBe('Closed tonight');
    jest.useRealTimers();
  });

  it('formats a normal range for Friday', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-10T20:00:00')); // Friday
    expect(todayHoursString(HOURS)).toBe('8PM – 4AM');
    jest.useRealTimers();
  });

  it('formats a Sunday early close', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-12T20:00:00')); // Sunday
    expect(todayHoursString(HOURS)).toBe('6PM – 12AM');
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn jest __tests__/lib/hoursFormat.test.ts
```
Expected: FAIL with "todayHoursString is not a function"

- [ ] **Step 3: Add `todayHoursString` to `src/lib/hours.ts`**

Add this export at the bottom of `src/lib/hours.ts` (the `DAY_KEYS` array is already defined at the top of that file):

```typescript
function fmt24to12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${ampm}` : `${hour}${ampm}`;
}

export function todayHoursString(hours: Record<string, string> | null): string | null {
  if (!hours) return null;
  const now = new Date();
  const todayKey = DAY_KEYS[now.getDay()];
  const range = hours[todayKey];
  if (!range || range === 'closed') return 'Closed tonight';
  const parts = range.split('-');
  if (parts.length !== 2) return null;
  return `${fmt24to12(parts[0])} – ${fmt24to12(parts[1])}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn jest __tests__/lib/hoursFormat.test.ts
```
Expected: PASS, 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/hours.ts __tests__/lib/hoursFormat.test.ts
git commit -m "feat: add todayHoursString to hours lib"
```

---

## Task 4: VenueSheet — heat badge + info rows

Add a color-coded heat score badge to the header and address/hours/phone info rows. Keep all existing elements (Call It, I'm Here, Activity chart, vibe tags).

**Files:**
- Modify: `src/components/venue/VenueSheet.tsx`

The existing sheet currently has: header (name + chips), open/closed row, stats row, Call It button, PingButton, HeatChart, VibeTags.

New layout: header (name + chips on left, heat badge on right), open/closed row, stats row, **info rows (address, hours, phone)**, Call It button, PingButton, HeatChart, VibeTags.

- [ ] **Step 1: Replace the full contents of `src/components/venue/VenueSheet.tsx`**

```typescript
import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { useVenue } from '@/hooks/useVenue';
import { HeatChart } from './HeatChart';
import { PingButton } from './PingButton';
import { VibeTags } from './VibeTags';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { isOpenNow, openUntilString, todayHoursString } from '@/lib/hours';
import { heatColor } from '@/lib/heatColor';
import type { Venue } from '@/types';

interface Props {
  venue: Venue | null;
  onClose: () => void;
}

export function VenueSheet({ venue, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { tonightTimeline, predictionCount, vibeTags } = useVenue(venue?.id ?? null);
  const profile = useUserStore((s) => s.profile);
  const { callsRemaining, canCall, makeCall, hasCalledTarget } = usePredictions(profile?.id ?? null);

  useEffect(() => {
    if (venue) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [venue]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const callScale = useSharedValue(1);
  const callAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: callScale.value }],
  }));

  const alreadyCalled = venue ? hasCalledTarget(venue.id) : false;

  async function handleCall() {
    if (alreadyCalled || !canCall) return;
    callScale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await makeCall('venue', venue!.id, venue!.current_heat_score);
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['52%', '88%']}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {venue && (
          <>
            {/* Header: name + chips on left, heat badge on right */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{venue.name}</Text>
                <View style={styles.chips}>
                  {venue.category && <View style={styles.chip}><Text style={styles.chipText}>{venue.category}</Text></View>}
                  {venue.music_genre && <View style={styles.chip}><Text style={styles.chipText}>{venue.music_genre}</Text></View>}
                  {venue.age_policy && <View style={[styles.chip, styles.chipAlt]}><Text style={styles.chipAltText}>{venue.age_policy}</Text></View>}
                  {venue.cover && <View style={[styles.chip, styles.chipAlt]}><Text style={styles.chipAltText}>{venue.cover} cover</Text></View>}
                </View>
              </View>
              {/* Heat badge */}
              <View style={[styles.heatBadge, { backgroundColor: heatColor(venue.current_heat_score) + '22', borderColor: heatColor(venue.current_heat_score) + '88' }]}>
                <Text style={[styles.heatScore, { color: heatColor(venue.current_heat_score) }]}>
                  {Math.round(venue.current_heat_score)}
                </Text>
                <Text style={[styles.heatLabel, { color: heatColor(venue.current_heat_score) + 'AA' }]}>HEAT</Text>
              </View>
            </View>

            {/* Open/closed row */}
            {(() => {
              const open = isOpenNow(venue.hours);
              const until = openUntilString(venue.hours);
              if (open === null) return null;
              return (
                <View style={styles.openRow}>
                  <View style={[styles.openDot, { backgroundColor: open ? '#4CAF50' : '#f44336' }]} />
                  <Text style={[styles.openText, { color: open ? '#4CAF50' : '#f44336' }]}>
                    {open ? `Open · until ${until}` : 'Closed now'}
                  </Text>
                </View>
              );
            })()}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{predictionCount}</Text>
                <Text style={styles.statLabel}>calls tonight</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{callsRemaining}</Text>
                <Text style={styles.statLabel}>calls left</Text>
              </View>
            </View>

            {/* Info rows */}
            <View style={styles.infoSection}>
              {venue.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{venue.address}</Text>
                </View>
              )}
              {(() => {
                const hrs = todayHoursString(venue.hours);
                if (!hrs) return null;
                return (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{hrs}</Text>
                  </View>
                );
              })()}
              {venue.phone && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`tel:${venue.phone}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                  <Text style={[styles.infoText, styles.infoLink]}>{venue.phone}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Call It button */}
            <Animated.View style={callAnimStyle}>
              <TouchableOpacity
                style={[
                  styles.callBtn,
                  alreadyCalled && styles.callBtnCalled,
                  !canCall && !alreadyCalled && styles.callBtnDisabled,
                ]}
                onPress={handleCall}
                disabled={alreadyCalled || !canCall}
                activeOpacity={0.8}
              >
                {alreadyCalled ? (
                  <View style={styles.callBtnInner}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={[styles.callBtnText, { color: '#4CAF50' }]}>Called</Text>
                  </View>
                ) : (
                  <Text style={styles.callBtnText}>{canCall ? 'Call It' : 'No calls left tonight'}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Ping */}
            <PingButton
              venueId={venue.id}
              neighborhoodId={venue.neighborhood_id}
            />

            {/* Heat chart */}
            <HeatChart points={tonightTimeline} label="Activity tonight" />

            {/* Vibe tags */}
            <VibeTags tags={vibeTags} />
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#0a1628' },
  handle: { backgroundColor: '#1e3a5f', width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 10, marginRight: 12 },
  name: { color: '#e2e8f0', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#0d1e3a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#1e3a5f' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  chipAlt: { borderColor: 'rgba(0,212,255,0.3)', backgroundColor: 'rgba(0,212,255,0.08)' },
  chipAltText: { color: '#00d4ff', fontSize: 12 },

  heatBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  heatScore: { fontSize: 24, fontWeight: '900' },
  heatLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },

  statsRow: { flexDirection: 'row', backgroundColor: '#0d1628', borderRadius: 14, borderWidth: 1, borderColor: '#1e3a5f', overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider: { width: 1, backgroundColor: '#1e3a5f' },
  statValue: { color: '#00d4ff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#4a5568', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },

  infoSection: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { width: 18 },
  infoText: { color: '#94a3b8', fontSize: 13, flex: 1 },
  infoLink: { color: '#00d4ff' },

  callBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  callBtnCalled: { backgroundColor: '#0d1628', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  callBtnDisabled: { backgroundColor: '#0d1628', borderWidth: 1, borderColor: '#1e3a5f' },
  callBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
});
```

- [ ] **Step 2: Start the dev server and visually verify**

```bash
npx expo start
```
Open on device/simulator. Open a venue sheet. Verify:
- Heat badge appears top-right with correct color (red for hot venues)
- Address row shows if data exists
- Hours row shows "8PM – 4AM" style string (or "Closed tonight")
- Phone row shows and is tappable (opens dialer)
- Call It, I'm Here, and Activity chart all still visible on same scroll

- [ ] **Step 3: Commit**

```bash
git add src/components/venue/VenueSheet.tsx
git commit -m "feat: expand VenueSheet with heat badge and info rows"
```

---

## Task 5: useNeighborhoodActivity hook

The NeighborhoodSheet Activity tab needs tonight's ping timeline grouped into 2-hour buckets, plus total ping count.

**Files:**
- Create: `src/hooks/useNeighborhoodActivity.ts`

- [ ] **Step 1: Create the hook**

File: `src/hooks/useNeighborhoodActivity.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TimelinePoint {
  hour: number;
  heat: number;
}

export function useNeighborhoodActivity(neighborhoodId: string | null) {
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [pingCount, setPingCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!neighborhoodId) {
      setTimeline([]);
      setPingCount(0);
      setUpdatedAt(null);
      return;
    }

    async function fetch() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('location_pings')
        .select('pinged_at')
        .eq('neighborhood_id', neighborhoodId)
        .gte('pinged_at', todayStart.toISOString())
        .order('pinged_at');

      if (!data) return;

      const buckets = new Map<number, number>();
      for (const ping of data) {
        const hour = new Date(ping.pinged_at).getHours();
        const bucket = Math.floor(hour / 2) * 2;
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      }

      setTimeline(
        Array.from(buckets.entries()).map(([hour, heat]) => ({ hour, heat }))
      );
      setPingCount(data.length);
      setUpdatedAt(new Date());
    }

    fetch();
  }, [neighborhoodId]);

  return { timeline, pingCount, updatedAt };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useNeighborhoodActivity.ts
git commit -m "feat: add useNeighborhoodActivity hook for neighborhood ping timeline"
```

---

## Task 6: NeighborhoodSheet — tabbed redesign

Replace the current single-scroll layout with a persistent header + Scene/Venues/Activity tabs. Add `onVenueTap` prop so tapping a venue in the Venues tab opens its sheet.

**Files:**
- Modify: `src/components/map/NeighborhoodSheet.tsx`

- [ ] **Step 1: Replace the full contents of `src/components/map/NeighborhoodSheet.tsx`**

```typescript
import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { heatColor } from '@/lib/heatColor';
import { useNeighborhoodActivity } from '@/hooks/useNeighborhoodActivity';
import { HeatChart } from '@/components/venue/HeatChart';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';

type Tab = 'scene' | 'venues' | 'activity';

interface Props {
  neighborhood: NeighborhoodMeta | null;
  venues: Venue[];
  onClose: () => void;
  onVenueTap?: (venue: Venue) => void;
  neighborhoodRank?: number;
}

export function NeighborhoodSheet({ neighborhood, venues, onClose, onVenueTap, neighborhoodRank }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [Math.round(height * 0.79)], [height]);
  const [activeTab, setActiveTab] = useState<Tab>('scene');

  const { timeline, pingCount, updatedAt } = useNeighborhoodActivity(neighborhood?.id ?? null);

  useEffect(() => {
    if (neighborhood) {
      setActiveTab('scene');
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [neighborhood]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const color = neighborhood?.map_color ?? '#888';
  const sorted = neighborhood
    ? [...venues].sort((a, b) => b.current_heat_score - a.current_heat_score)
    : [];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      {neighborhood && (
        <>
          {/* Persistent header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.name}>{neighborhood.name}</Text>
              {neighborhoodRank != null && (
                <View style={[styles.rankBadge, { borderColor: color + '80', backgroundColor: color + '18' }]}>
                  <Text style={[styles.rankText, { color }]}>#{neighborhoodRank} HOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerMeta}>
              {sorted.length} bars · {pingCount} pings tonight
            </Text>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['scene', 'venues', 'activity'] as Tab[]).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && { borderBottomColor: color }]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === tab && { color }]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab content */}
          <BottomSheetScrollView contentContainerStyle={styles.content}>
            {activeTab === 'scene' && (
              <>
                {neighborhood.scene_description && (
                  <Text style={styles.description}>{neighborhood.scene_description}</Text>
                )}
                {neighborhood.best_for && (
                  <View>
                    <Text style={styles.sectionLabel}>BEST FOR</Text>
                    <Text style={styles.bestForText}>{neighborhood.best_for}</Text>
                  </View>
                )}
                {neighborhood.vibe_tags.length > 0 && (
                  <View style={styles.tags}>
                    {neighborhood.vibe_tags.map(tag => (
                      <View key={tag} style={[styles.tag, { borderColor: color + '50', backgroundColor: color + '15' }]}>
                        <Text style={[styles.tagText, { color }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'venues' && (
              <>
                {sorted.length === 0 ? (
                  <Text style={styles.emptyText}>No spots on record</Text>
                ) : (
                  sorted.map(v => (
                    <TouchableOpacity
                      key={v.id}
                      style={styles.venueRow}
                      onPress={() => onVenueTap?.(v)}
                      activeOpacity={onVenueTap ? 0.7 : 1}
                    >
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{v.name}</Text>
                        <Text style={styles.venueMeta}>
                          {v.category}{v.music_genre ? ` · ${v.music_genre}` : ''}
                        </Text>
                      </View>
                      <View style={styles.heatRight}>
                        <Text style={[styles.heatScore, { color: heatColor(v.current_heat_score) }]}>
                          {Math.round(v.current_heat_score)}
                        </Text>
                        <Text style={[styles.heatLabelSmall, { color: heatColor(v.current_heat_score) + 'AA' }]}>
                          heat
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <>
                <HeatChart points={timeline} label="Pings tonight" />
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>{pingCount}</Text>
                    <Text style={styles.activityStatLabel}>total pings tonight</Text>
                  </View>
                </View>
                {updatedAt && (
                  <Text style={styles.updatedAt}>
                    Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </>
            )}
          </BottomSheetScrollView>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  rankBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  rankText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerMeta: { color: '#555', fontSize: 13, marginBottom: 14 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 },

  description: { color: '#aaa', fontSize: 14, lineHeight: 21 },
  sectionLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  bestForText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '500' },

  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 20 },

  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  venueInfo: { flex: 1 },
  venueName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  venueMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  heatRight: { alignItems: 'flex-end' },
  heatScore: { fontSize: 18, fontWeight: '800' },
  heatLabelSmall: { fontSize: 10, marginTop: 1 },

  activityStats: { flexDirection: 'row', gap: 12 },
  activityStat: { flex: 1, backgroundColor: '#0d1628', borderRadius: 12, borderWidth: 1, borderColor: '#1e3a5f', padding: 14, alignItems: 'center' },
  activityStatValue: { color: '#00d4ff', fontSize: 24, fontWeight: '800' },
  activityStatLabel: { color: '#4a5568', fontSize: 11, marginTop: 2 },

  updatedAt: { color: '#333', fontSize: 11, textAlign: 'right' },
});
```

- [ ] **Step 2: Verify `tonight.tsx` still compiles**

`tonight.tsx` passes `neighborhood`, `venues`, and `onClose` — all still required. The new `onVenueTap` and `neighborhoodRank` are optional, so `tonight.tsx` needs no changes.

Open `app/(tabs)/tonight.tsx` and verify no TypeScript errors appear.

- [ ] **Step 3: Start the dev server and visually verify**

```bash
npx expo start
```
Navigate to Tonight tab. Tap a neighborhood. Verify:
- Header shows name, bar count, ping count
- Scene tab shows description, best_for, vibe tags
- Venues tab shows ranked list
- Activity tab shows chart + ping count

- [ ] **Step 4: Commit**

```bash
git add src/components/map/NeighborhoodSheet.tsx src/hooks/useNeighborhoodActivity.ts
git commit -m "feat: tabbed NeighborhoodSheet with Scene/Venues/Activity"
```

---

## Task 7: LiveIntelPanel component

A frosted top bar showing the top 5 venues by heat + hottest neighborhood. Horizontally scrollable cards. Tapping a card calls back to the parent.

**Files:**
- Create: `src/components/map/LiveIntelPanel.tsx`

- [ ] **Step 1: Create the component**

File: `src/components/map/LiveIntelPanel.tsx`

```typescript
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { heatColor } from '@/lib/heatColor';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

interface Props {
  venues: Venue[];
  neighborhoods: NeighborhoodMeta[];
  onVenueTap: (venue: Venue) => void;
  onNeighborhoodTap: (neighborhood: NeighborhoodMeta) => void;
}

export function LiveIntelPanel({ venues, neighborhoods, onVenueTap, onNeighborhoodTap }: Props) {
  // Top 5 venues by current heat score
  const topVenues = [...venues]
    .sort((a, b) => b.current_heat_score - a.current_heat_score)
    .slice(0, 5);

  // Hottest neighborhood is first in the already-sorted neighborhoods array
  const hotNeighborhood = neighborhoods[0] ?? null;

  if (topVenues.length === 0 && !hotNeighborhood) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.label}>Hot Now</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {topVenues.map(v => {
            const color = heatColor(v.current_heat_score);
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.card, { borderColor: color + '55' }]}
                onPress={() => onVenueTap(v)}
                activeOpacity={0.75}
              >
                <Text style={[styles.cardScore, { color }]}>{Math.round(v.current_heat_score)}</Text>
                <Text style={styles.cardName} numberOfLines={1}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
          {hotNeighborhood && (
            <TouchableOpacity
              style={[styles.card, { borderColor: hotNeighborhood.map_color + '55' }]}
              onPress={() => onNeighborhoodTap(hotNeighborhood)}
              activeOpacity={0.75}
            >
              <Text style={[styles.cardScore, { color: hotNeighborhood.map_color, fontSize: 13 }]} numberOfLines={1}>
                {hotNeighborhood.name}
              </Text>
              <Text style={styles.cardName}>Top Scene</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,16,28,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  label: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 0,
  },
  scroll: {
    gap: 8,
    paddingRight: 4,
  },
  card: {
    backgroundColor: '#0d1628',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 72,
  },
  cardScore: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardName: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/LiveIntelPanel.tsx
git commit -m "feat: add LiveIntelPanel component"
```

---

## Task 8: HeatmapLayer breathing animation

Animate the heatmap opacity between 0.5 and 0.95 on a 2.5s ease-in-out loop using `requestAnimationFrame`.

**Files:**
- Modify: `src/components/map/HeatmapLayer.tsx`

- [ ] **Step 1: Replace the full contents of `src/components/map/HeatmapLayer.tsx`**

```typescript
import { useEffect, useRef, useState } from 'react';
import MapboxGL from '@rnmapbox/maps';
import type { HeatmapPoint } from '@/types';

interface Props {
  points: HeatmapPoint[];
}

const DURATION_MS = 2500;

export function HeatmapLayer({ points }: Props) {
  const [opacity, setOpacity] = useState(0.85);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) % (DURATION_MS * 2);
      // t goes 0→1→0 over one full cycle
      const t = elapsed < DURATION_MS ? elapsed / DURATION_MS : 1 - (elapsed - DURATION_MS) / DURATION_MS;
      // ease-in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setOpacity(0.5 + eased * 0.45); // 0.5 → 0.95
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { weight: p.weight },
    })),
  };

  return (
    <MapboxGL.ShapeSource id="heatmap-source" shape={geojson}>
      <MapboxGL.HeatmapLayer
        id="heatmap-layer"
        sourceID="heatmap-source"
        style={{
          heatmapWeight: ['get', 'weight'],
          heatmapIntensity: 1.5,
          heatmapColor: [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.1, 'rgba(255,235,0,0.4)',
            0.3, 'rgba(255,165,0,0.6)',
            0.6, 'rgba(255,80,0,0.8)',
            0.8, 'rgba(220,20,20,0.9)',
            1,   'rgba(180,0,0,1)',
          ],
          heatmapRadius: [
            'interpolate', ['linear'], ['zoom'],
            9, 30,
            13, 60,
          ],
          heatmapOpacity: opacity,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
```

- [ ] **Step 2: Start the dev server and visually verify**

```bash
npx expo start
```
Open the Map tab. Verify the heatmap blobs slowly breathe (fade in/out over ~2.5s).

- [ ] **Step 3: Commit**

```bash
git add src/components/map/HeatmapLayer.tsx
git commit -m "feat: breathing opacity animation on HeatmapLayer"
```

---

## Task 9: VenueRippleOverlay component

Render RN animated pulse + ripple rings positioned over each venue dot on the map. The parent (map screen) computes screen coordinates and passes them in.

**Files:**
- Create: `src/components/map/VenueRippleOverlay.tsx`

The animation for each dot: inner dot scales 1→1.15→1 + box-shadow glow; outer ring scales 1→2.2 while fading to transparent. Speed varies by heat score.

- [ ] **Step 1: Create the component**

File: `src/components/map/VenueRippleOverlay.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { heatColor } from '@/lib/heatColor';

export interface VenueScreenCoord {
  id: string;
  x: number;
  y: number;
  heatScore: number;
}

interface Props {
  coords: VenueScreenCoord[];
}

function pulseDuration(heatScore: number): number {
  if (heatScore >= 80) return 1500;
  if (heatScore >= 60) return 2000;
  if (heatScore >= 40) return 2500;
  return 3000;
}

interface RippleDotProps {
  x: number;
  y: number;
  heatScore: number;
}

function RippleDot({ x, y, heatScore }: RippleDotProps) {
  const dotScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const duration = pulseDuration(heatScore);
  const color = heatColor(heatScore);

  useEffect(() => {
    // Inner dot pulse loop
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.15, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    // Outer ripple loop
    const rippleLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 2.2, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );

    dotLoop.start();
    // Stagger ring slightly behind dot
    const timeout = setTimeout(() => {
      ringScale.setValue(1);
      ringOpacity.setValue(0.8);
      rippleLoop.start();
    }, duration * 0.25);

    return () => {
      dotLoop.stop();
      rippleLoop.stop();
      clearTimeout(timeout);
    };
  }, [duration]);

  return (
    <View style={[styles.dotContainer, { left: x - 14, top: y - 14 }]}>
      {/* Outer ripple ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* Inner dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            transform: [{ scale: dotScale }],
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

export function VenueRippleOverlay({ coords }: Props) {
  if (coords.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {coords.map(c => (
        <RippleDot key={c.id} x={c.x} y={c.y} heatScore={c.heatScore} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  ring: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/VenueRippleOverlay.tsx
git commit -m "feat: add VenueRippleOverlay component"
```

---

## Task 10: Map screen — wire all new features

Wire `LiveIntelPanel`, `VenueRippleOverlay`, `NeighborhoodSheet`, camera zoom, and coordinate computation into `app/(tabs)/index.tsx`.

**Files:**
- Modify: `app/(tabs)/index.tsx`

Key changes:
1. Add `mapViewRef` ref on MapView for `getPointInView` + `getVisibleBounds`
2. Compute venue screen coordinates on `onCameraChanged` (debounced)
3. Add `selectedNeighborhood` state + NeighborhoodSheet
4. Add `LiveIntelPanel` above MapView (not inside it)
5. Add `VenueRippleOverlay` as absolute overlay over MapView
6. Camera zoom handler for Live Intel card taps
7. Shift layer toggles down to clear the panel

- [ ] **Step 1: Replace the full contents of `app/(tabs)/index.tsx`**

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { VenueLayer } from '@/components/map/VenueLayer';
import { NeighborhoodLayer } from '@/components/map/NeighborhoodLayer';
import { CTALayer } from '@/components/map/CTALayer';
import { CTARoutesLayer } from '@/components/map/CTARoutesLayer';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { NeighborhoodSheet } from '@/components/map/NeighborhoodSheet';
import { LiveIntelPanel } from '@/components/map/LiveIntelPanel';
import { VenueRippleOverlay } from '@/components/map/VenueRippleOverlay';
import type { VenueScreenCoord } from '@/components/map/VenueRippleOverlay';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints } = useHeatmap();
  const { neighborhoods } = useNeighborhoods();
  const insets = useSafeAreaInsets();

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodMeta | null>(null);
  const [zoom, setZoom] = useState(10.5);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [venueScreenCoords, setVenueScreenCoords] = useState<VenueScreenCoord[]>([]);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapViewRef = useRef<MapboxGL.MapView>(null);
  const coordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function adjustZoom(delta: number) {
    const next = Math.min(20, Math.max(5, zoom + delta));
    setZoom(next);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
  }

  // Compute screen coords for visible venues on every camera change
  const handleCameraChanged = useCallback(async () => {
    if (!mapViewRef.current || venues.length === 0) return;
    // Debounce: only run 150ms after the last camera event
    if (coordDebounceRef.current) clearTimeout(coordDebounceRef.current);
    coordDebounceRef.current = setTimeout(async () => {
      try {
        const bounds = await mapViewRef.current!.getVisibleBounds();
        // bounds = [[maxLng, maxLat], [minLng, minLat]]
        const [maxLng, maxLat] = bounds[0];
        const [minLng, minLat] = bounds[1];

        const visible = venues.filter(
          v => v.coordinates.lng >= minLng && v.coordinates.lng <= maxLng &&
               v.coordinates.lat >= minLat && v.coordinates.lat <= maxLat
        );

        const coordPairs = await Promise.all(
          visible.map(async v => {
            const pt = await mapViewRef.current!.getPointInView([v.coordinates.lng, v.coordinates.lat]);
            return { id: v.id, x: pt[0], y: pt[1], heatScore: v.current_heat_score };
          })
        );
        setVenueScreenCoords(coordPairs);
      } catch {
        // Map not ready or unmounted — ignore
      }
    }, 150);
  }, [venues]);

  // Recompute when venues load
  useEffect(() => {
    if (mapLoaded && venues.length > 0) handleCameraChanged();
  }, [venues, mapLoaded]);

  // Zoom + open sheet when tapping a Live Intel venue card
  function handleLiveIntelVenueTap(venue: Venue) {
    cameraRef.current?.setCamera({
      centerCoordinate: [venue.coordinates.lng, venue.coordinates.lat],
      zoomLevel: 15,
      animationDuration: 400,
    });
    setSelectedVenue(venue);
  }

  // Zoom + open sheet when tapping a Live Intel neighborhood card
  function handleLiveIntelNeighborhoodTap(neighborhood: NeighborhoodMeta) {
    if (neighborhood.boundary) {
      // Compute centroid of polygon exterior ring
      const coords = neighborhood.boundary.coordinates[0];
      const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 13,
        animationDuration: 400,
      });
    }
    setSelectedNeighborhood(neighborhood);
  }

  const neighborhoodVenues = selectedNeighborhood
    ? venues.filter(v => v.neighborhood_id === selectedNeighborhood.id)
    : [];

  // Neighborhood rank = index in already-sorted neighborhoods array + 1
  const neighborhoodRank = selectedNeighborhood
    ? neighborhoods.findIndex(n => n.id === selectedNeighborhood.id) + 1
    : undefined;

  return (
    <View style={styles.container}>
      {/* Live Intel Panel — above map, below safe area */}
      <View style={{ paddingTop: insets.top }}>
        <LiveIntelPanel
          venues={venues}
          neighborhoods={neighborhoods}
          onVenueTap={handleLiveIntelVenueTap}
          onNeighborhoodTap={handleLiveIntelNeighborhoodTap}
        />
      </View>

      {/* Map fills remaining space */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          ref={mapViewRef}
          style={StyleSheet.absoluteFillObject}
          styleURL="mapbox://styles/mapbox/dark-v11"
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
          onCameraChanged={handleCameraChanged}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            defaultSettings={{ zoomLevel: 10.5, centerCoordinate: CHICAGO_CENTER }}
          />
          {mapLoaded && (
            <>
              <NeighborhoodLayer
                neighborhoods={neighborhoods}
                visible={showNeighborhoods}
                onPress={setSelectedNeighborhood}
              />
              <HeatmapLayer points={heatPoints} />
              <CTARoutesLayer visible={showCTA} />
              <CTALayer visible={showCTA} />
              <VenueLayer venues={venues} onPress={setSelectedVenue} />
            </>
          )}
        </MapboxGL.MapView>

        {/* Ripple overlay — absolute over map */}
        <VenueRippleOverlay coords={venueScreenCoords} />

        {/* Layer toggles — positioned below safe area top (panel sits above mapContainer) */}
        <View style={styles.layerToggles}>
          <TouchableOpacity
            style={[styles.toggleBtn, showNeighborhoods && styles.toggleBtnActive]}
            onPress={() => setShowNeighborhoods(v => !v)}
          >
            <Text style={[styles.toggleText, showNeighborhoods && styles.toggleTextActive]}>
              Scenes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, showCTA && styles.toggleBtnActive]}
            onPress={() => setShowCTA(v => !v)}
          >
            <Text style={[styles.toggleText, showCTA && styles.toggleTextActive]}>
              CTA
            </Text>
          </TouchableOpacity>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(1)}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(-1)}>
            <Text style={styles.zoomText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>

      <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />

      <NeighborhoodSheet
        neighborhood={selectedNeighborhood}
        venues={neighborhoodVenues}
        onClose={() => setSelectedNeighborhood(null)}
        onVenueTap={(v) => {
          setSelectedNeighborhood(null);
          setTimeout(() => setSelectedVenue(v), 300);
        }}
        neighborhoodRank={neighborhoodRank || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  mapContainer: { flex: 1 },

  layerToggles: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 6,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(14,14,14,0.88)',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderColor: '#3B82F6',
  },
  toggleText: { color: '#888', fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: '#3B82F6' },

  zoomControls: {
    position: 'absolute',
    right: 9,
    bottom: 58,
    gap: 4,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22 },
});
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors (or only pre-existing errors unrelated to these files).

- [ ] **Step 4: Start the dev server and visually verify**

```bash
npx expo start
```

On the Map tab verify:
1. **Live Intel Panel** appears at the top below the status bar with "Hot Now" label and scrollable venue cards
2. **Tapping a venue card** zooms the map to that venue and opens its VenueSheet
3. **Tapping the neighborhood card** zooms to the neighborhood center and opens NeighborhoodSheet
4. **Scenes/CTA buttons** are inside the map area, not overlapping the panel
5. **NeighborhoodSheet** opens when tapping a neighborhood boundary on the map
6. **NeighborhoodSheet → Venues tab** → tap a venue row closes the neighborhood sheet and opens the venue sheet
7. **Venue ripple dots** pulse and emit ripple rings over venue dots (visible at zoom level 12+)
8. **Heatmap** slowly breathes

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx src/components/map/LiveIntelPanel.tsx
git commit -m "feat: wire LiveIntelPanel, VenueRippleOverlay, NeighborhoodSheet on map screen"
```

---

## Done

All four spec features are implemented:
- VenueSheet: heat badge + info rows (Task 4)
- NeighborhoodSheet: tabbed layout (Task 6)
- Live Intel Panel: top bar with zoom-on-tap (Task 10)
- Heatmap breathing + venue dot ripple (Tasks 8–9)
