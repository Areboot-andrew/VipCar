export type LatLng = { lat: number; lng: number } | null;

export function coord(lat: unknown, lng: unknown): LatLng {
  // null/undefined/'' must stay "no coordinate" (Number(null) is 0, which would be a real point)
  if (lat == null || lng == null || lat === '' || lng === '') return null;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  return { lat: parsedLat, lng: parsedLng };
}

// Haversine distance with a x1.3 road factor — a rough approximation of real road km
// used as a fallback when no routed (OSRM) distance is available.
export function haversineRoadKm(from: LatLng, to: LatLng) {
  if (!from || !to) return 0;
  const radius = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.ceil(radius * c * 1.3);
}
