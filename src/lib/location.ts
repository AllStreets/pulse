import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';
import type { Venue } from '@/types';

export const LOCATION_TASK_NAME = 'pulse-background-location';
const SNAP_RADIUS_METERS = 50;

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function snapToVenue(
  lat: number,
  lng: number,
  venues: Pick<Venue, 'id' | 'coordinates'>[]
): string | null {
  let closest: string | null = null;
  let closestDist = SNAP_RADIUS_METERS;

  for (const venue of venues) {
    const dist = haversineDistance(lat, lng, venue.coordinates.lat, venue.coordinates.lng);
    if (dist < closestDist) {
      closestDist = dist;
      closest = venue.id;
    }
  }
  return closest;
}

// Called by background task — fetches venue list then sends anonymized ping
export async function sendLocationPing(lat: number, lng: number) {
  const { data: venues } = await supabase
    .from('venues')
    .select('id, coordinates');

  if (!venues) return;

  // Parse PostGIS coordinates from Supabase (GeoJSON: [lng, lat])
  const parsed = venues.map((v: any) => ({
    id: v.id,
    coordinates: {
      lat: v.coordinates.coordinates[1],
      lng: v.coordinates.coordinates[0],
    },
  }));

  const venueId = snapToVenue(lat, lng, parsed);

  // Find containing neighborhood via RPC
  const { data: neighborhoods } = await supabase.rpc('get_neighborhood_for_point', {
    lng,
    lat,
  });

  const neighborhoodId = neighborhoods?.[0]?.id;
  if (!neighborhoodId) return;

  await supabase.from('location_pings').insert({
    venue_id: venueId,
    neighborhood_id: neighborhoodId,
  });
}

export async function startBackgroundLocation() {
  const { status } = await Location.getBackgroundPermissionsAsync();
  if (status !== 'granted') return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 120_000,   // every 2 minutes
    distanceInterval: 50,    // or every 50m moved
    showsBackgroundLocationIndicator: false,
    foregroundService: {
      notificationTitle: 'Pulse',
      notificationBody: 'Contributing to the live heatmap',
    },
  });
}

export async function stopBackgroundLocation() {
  const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (hasTask) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
