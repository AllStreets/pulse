# Map & Detail Sheet Enhancements Design

## Overview

Four coordinated improvements to the map experience and detail sheets: expanded venue and neighborhood sheets, a live intel panel at the top of the map, and pulsing animations on the heatmap and venue dots.

---

## Feature 1: VenueSheet Expansion

**Goal:** Surface address, hours, and phone without hiding the existing Call It, I'm Here, and Activity Tonight elements.

**Layout:** Single scroll — no tabs.

### Sections (top to bottom)

**Header block**
- Venue name (large, bold)
- Neighborhood · venue type (subdued)
- Left border accent colored to the venue's neighborhood color
- Vibe chips: venue type, age restriction, genre/music tags

**Heat badge** (inline with header, right-aligned)
- Large heat number
- Color by level: `#ff4500` (≥80), `#ff8c00` (60–79), `#ffcc00` (40–59), `#00d4ff` (<40)
- Label "HEAT" beneath the number

**Quick stats row** (3-column grid)
- Calls tonight
- Open/Closed status + closing time (green dot when open)
- Cover price (or "Free" if no cover)

**Info rows** (icon + label, no emojis)
- Map-pin icon + full street address
- Clock icon + hours tonight (e.g. "8PM – 2AM")
- Phone icon + phone number (tappable `tel:` link)

**Action buttons** (always visible, not behind scroll)
- "Call It" button (blue, full width or side-by-side with I'm Here)
- "I'm Here" button

**Activity Tonight**
- Heat chart bar graphs — unchanged from current implementation

### Data requirements
- `phone` and `hours` exist on `venues` (added in migration 015). `address` does not — a new migration must add `address text` to the `venues` table and seed it for existing rows.
- `hours` is stored as jsonb keyed by lowercase day abbreviation (e.g. `{ "fri": "20:00-04:00" }`). The component must extract today's day key and format it as a human-readable time range (e.g. "8PM – 4AM"). If the key is `"closed"` or missing, show "Closed tonight".
- If any field is null, hide that info row entirely.

---

## Feature 2: NeighborhoodSheet Expansion

**Goal:** More information and visual breathing room via tabbed layout.

**Layout:** Persistent header + 3 tabs.

### Persistent header (always shown above tabs)
- Neighborhood name (large, bold)
- Hotness badge: "#N HOT" pill (e.g. "#2 HOT"), colored by neighborhood accent color
- Subdued line: "{N} bars · {M} pings tonight"

### Tab: Scene
- Scene description (prose)
- "Best For" label + value (e.g. "Late-night music, craft drinks, creative crowds")
- Vibe tags (colored pills matching neighborhood accent color)

### Tab: Venues
- Full venue list sorted by heat score descending
- Each row: venue name (left) + heat badge (right), same color coding as VenueSheet
- Tapping a venue row opens that venue's VenueSheet

### Tab: Activity
- Neighborhood-level heat chart over time (same chart style as venue activity chart)
- Total ping count for tonight
- Timestamp of last update

### Data requirements
- `neighborhoods` table has `scene_description`, `best_for`, `vibe_tags`, and `map_color` — all fields needed for the Scene tab are available.
- Neighborhood ranking (#N HOT) is computed at runtime by aggregating `current_heat_score` across all venues per neighborhood and ranking them descending. This is not stored — compute it from the venues already loaded on the map screen.
- Neighborhood heat over time requires aggregating pings by neighborhood and time bucket — same logic as venue heat chart but grouped by `neighborhood_id`.

---

## Feature 3: Live Intel Panel

**Goal:** Always-visible at-a-glance summary of the hottest venues and neighborhood, pinned at the top of the map screen.

### Position
- Pinned below safe area / map header, above the map content
- Scenes and CTA toggle buttons shift down below the panel (they were previously at top-right; they remain top-right but lower to clear the panel)

### Layout
Frosted dark pill bar (dark background + blur), full width with horizontal padding.

Left side: `"Hot Now"` label (small caps, `#00d4ff`)

Right side: horizontally scrollable row of heat cards:
- **Venue cards** (one per top venue, sorted by heat desc, show top 5):
  - Venue name
  - Heat score, color-coded: same thresholds as VenueSheet
  - Card border tinted to heat color at low opacity
- **Neighborhood card** (always last):
  - Neighborhood name (abbreviated if needed)
  - "Top Scene" label
  - Bordered with neighborhood accent color

### Tap behavior
Tapping a **venue card**:
1. Animates map camera to zoom in on the venue's coordinates (zoom level 15, 400ms animation)
2. Opens that venue's VenueSheet bottom sheet

Tapping the **neighborhood card**:
1. Animates map camera to the neighborhood's center coordinates (zoom level 13)
2. Opens that neighborhood's NeighborhoodSheet bottom sheet

### Data source
Query top 5 venues by current heat score from the same data that drives the heatmap. Hottest neighborhood from the `neighborhood_heat_scores` or equivalent view. Refresh on the same interval as the map's existing data refresh.

---

## Feature 4: Heatmap & Venue Dot Animations

**Goal:** Make the map feel alive — heatmap blobs breathe, venue dots pulse and ripple.

### Heatmap blobs breathe
- Animate `heatmapOpacity` paint property of the Mapbox `HeatmapLayer`
- Opacity cycles: 0.5 → 0.95 → 0.5, ease-in-out, 2.5s loop
- Implemented with `Animated.loop(Animated.sequence([...]))` driving an `Animated.Value`
- The animated value is passed to the layer's opacity prop via `interpolate`

### Venue dot pulse + ripple
Mapbox symbol/circle layers don't support per-feature CSS-style animations. Ripple rings are rendered as React Native `Animated.View` elements overlaid on the map using the camera's `getPointInView` (or equivalent coordinate → screen-point conversion) to position them over each venue.

**Inner dot pulse:**
- Scale: 1.0 → 1.15 → 1.0
- Shadow glow: expands outward at 50% keyframe
- Duration varies by heat level (see below)

**Outer ripple ring:**
- Scale: 1.0 → 2.2, opacity: 0.8 → 0, ease-out
- Same duration as inner dot
- Offset slightly behind inner dot in animation cycle (staggered start)

**Heat-based pulse speed:**
| Heat score | Cycle duration |
|-----------|----------------|
| ≥80       | 1.5s           |
| 60–79     | 2.0s           |
| 40–59     | 2.5s           |
| <40       | 3.0s           |

**Implementation note:** The overlay `Animated.View` elements need to re-position when the map camera moves (pan/zoom). Subscribe to the Mapbox camera's `onCameraChanged` event to recompute screen coordinates and update positions.

Only render ripple overlays for venues currently visible in the map's viewport to avoid performance issues with many venues.

---

## Architecture Notes

**VenueSheet** (`src/components/venue/VenueSheet.tsx`)
- Add info rows section between stats grid and action buttons
- Heat badge color logic extracted to a small helper: `heatColor(score: number): string`
- No new data fetching needed if venue object already contains address/phone/hours

**NeighborhoodSheet** (`src/components/map/NeighborhoodSheet.tsx`)
- Add tab state (`'scene' | 'venues' | 'activity'`)
- Activity tab needs a new query: aggregate neighborhood pings by time bucket
- Venue list in Venues tab should call existing venue sheet open handler on tap

**Live Intel Panel** (`src/components/map/LiveIntelPanel.tsx`) — new file
- Receives top venues + hottest neighborhood as props
- Calls back to map screen with `onVenueTap(venue)` and `onNeighborhoodTap(neighborhood)`
- Map screen handles camera animation + sheet open on those callbacks
- Rendered inside `app/(tabs)/map.tsx` (or wherever the map tab lives), above map content

**HeatmapLayer** (`src/components/map/HeatmapLayer.tsx`)
- Add `Animated.Value` for opacity, `Animated.loop` on mount, cleanup on unmount
- Pass animated opacity to layer paint prop

**VenueRippleOverlay** (`src/components/map/VenueRippleOverlay.tsx`) — new file
- Receives visible venues with screen coordinates
- Renders one `Animated.View` pair (dot + ring) per venue
- Positioned absolutely over the map
- Re-renders coordinates on `onCameraChanged`

**Map screen** (`app/(tabs)/map.tsx` or equivalent)
- Import and render `LiveIntelPanel` above the map
- Import and render `VenueRippleOverlay` as an overlay on the map
- Add camera ref for programmatic zoom on card tap
- Shift existing Scenes/CTA toggle buttons down by the panel height (use a constant or `onLayout`)
