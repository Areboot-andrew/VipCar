'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type Point = {
  lat?: number | null;
  lng?: number | null;
  label: string;
};

type ResolvedPoint = {
  lat: number;
  lng: number;
  label: string;
};

const KNOWN_POINTS: Record<string, { lat: number; lng: number }> = {
  'львів': { lat: 49.8397, lng: 24.0297 },
  'lviv': { lat: 49.8397, lng: 24.0297 },
  'київ': { lat: 50.4501, lng: 30.5234 },
  'kyiv': { lat: 50.4501, lng: 30.5234 },
  'kiev': { lat: 50.4501, lng: 30.5234 },
  'краків': { lat: 50.0647, lng: 19.945 },
  'kraków': { lat: 50.0647, lng: 19.945 },
  'krakow': { lat: 50.0647, lng: 19.945 },
  'warszawa': { lat: 52.2297, lng: 21.0122 },
  'варшава': { lat: 52.2297, lng: 21.0122 },
  'wrocław': { lat: 51.1079, lng: 17.0385 },
  'wroclaw': { lat: 51.1079, lng: 17.0385 },
  'berlin brandenburg airport': { lat: 52.3667, lng: 13.5033 },
  'берлін': { lat: 52.52, lng: 13.405 },
};

function knownPoint(label: string) {
  const normalized = label.trim().toLocaleLowerCase('uk');
  const direct = KNOWN_POINTS[normalized];
  if (direct) return direct;
  const match = Object.entries(KNOWN_POINTS).find(([key]) => normalized.includes(key));
  return match?.[1] || null;
}

async function geocodePoint(point: Point, signal: AbortSignal): Promise<ResolvedPoint | null> {
  if (typeof point.lat === 'number' && typeof point.lng === 'number') {
    return { lat: point.lat, lng: point.lng, label: point.label };
  }

  const known = knownPoint(point.label);
  if (known) return { ...known, label: point.label };

  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(point.label)}`, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return { lat: Number(first.lat), lng: Number(first.lon), label: point.label };
}

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 8 });
    }
  }, [map, positions]);

  return null;
}

function fallbackPositions(from: ResolvedPoint, to: ResolvedPoint): [number, number][] {
  return [[from.lat, from.lng], [to.lat, to.lng]];
}

export default function EmptyLegRouteMap({ from, to, onDistance }: { from: Point; to: Point; onDistance?: (km: number) => void }) {
  const [resolvedFrom, setResolvedFrom] = useState<ResolvedPoint | null>(null);
  const [resolvedTo, setResolvedTo] = useState<ResolvedPoint | null>(null);
  const [positions, setPositions] = useState<[number, number][]>([]);

  const routeKey = `${from.lat || ''},${from.lng || ''},${from.label}-${to.lat || ''},${to.lng || ''},${to.label}`;
  const center = useMemo<[number, number]>(() => {
    if (resolvedFrom && resolvedTo) return [(resolvedFrom.lat + resolvedTo.lat) / 2, (resolvedFrom.lng + resolvedTo.lng) / 2];
    return [50.2, 23.5];
  }, [resolvedFrom, resolvedTo]);

  useEffect(() => {
    let cancelled = false;
    setPositions([]);
    setResolvedFrom(null);
    setResolvedTo(null);

    const controller = new AbortController();

    Promise.all([
      geocodePoint(from, controller.signal),
      geocodePoint(to, controller.signal),
    ])
      .then(async ([start, finish]) => {
        if (cancelled || !start || !finish) return;
        setResolvedFrom(start);
        setResolvedTo(finish);
        setPositions(fallbackPositions(start, finish));

        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${finish.lng},${finish.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        const data = res.ok ? await res.json() : null;
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (!cancelled && Array.isArray(coords) && coords.length > 1) {
          setPositions(coords.map((coord: [number, number]) => [coord[1], coord[0]]));
          if (typeof route.distance === 'number' && route.distance > 0) {
            onDistance?.(Math.round(route.distance / 1000));
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [routeKey, from.lat, from.lng, from.label, to.lat, to.lng, to.label]);

  return (
    <div className="relative h-full min-h-[180px] w-full">
      <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full min-h-[180px] w-full"
      style={{ height: '100%', minHeight: 180, width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
      />
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: '#e9c349', weight: 5, opacity: 0.95 }} />}
        {resolvedFrom && (
          <Marker position={[resolvedFrom.lat, resolvedFrom.lng]}>
        <Tooltip permanent direction="top" offset={[0, -34]} className="custom-map-tooltip">
              {resolvedFrom.label}
        </Tooltip>
      </Marker>
        )}
        {resolvedTo && (
          <Marker position={[resolvedTo.lat, resolvedTo.lng]}>
        <Tooltip permanent direction="top" offset={[0, -34]} className="custom-map-tooltip">
              {resolvedTo.label}
        </Tooltip>
      </Marker>
        )}
        <FitRoute positions={positions} />
      </MapContainer>
      {positions.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#080818]/35 text-xs font-bold uppercase tracking-widest text-[#e9c349]">
          Будуємо карту маршруту
        </div>
      )}
    </div>
  );
}
