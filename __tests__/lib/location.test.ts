import { snapToVenue, haversineDistance } from '@/lib/location';
import type { Venue } from '@/types';

const mockVenues: Pick<Venue, 'id' | 'coordinates'>[] = [
  { id: 'v1', coordinates: { lat: 41.9087, lng: -87.6818 } },
  { id: 'v2', coordinates: { lat: 41.9218, lng: -87.7077 } },
];

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(41.9087, -87.6818, 41.9087, -87.6818)).toBe(0);
  });

  it('returns distance in meters between two Chicago venues (roughly 2.6km)', () => {
    const dist = haversineDistance(41.9087, -87.6818, 41.9218, -87.7077);
    expect(dist).toBeGreaterThan(2500);
    expect(dist).toBeLessThan(2700);
  });
});

describe('snapToVenue', () => {
  it('returns venue id when within 50m', () => {
    // Slightly offset from v1 (~10m away)
    const result = snapToVenue(41.9088, -87.6818, mockVenues);
    expect(result).toBe('v1');
  });

  it('returns null when no venue within 50m', () => {
    const result = snapToVenue(41.9300, -87.6500, mockVenues);
    expect(result).toBeNull();
  });
});
