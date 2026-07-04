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
  lat: number;
  lng: number;
  label: string;
};

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 8 });
    }
  }, [map, positions]);

  return null;
}

function fallbackPositions(from: Point, to: Point): [number, number][] {
  return [[from.lat, from.lng], [to.lat, to.lng]];
}

export default function EmptyLegRouteMap({ from, to }: { from: Point; to: Point }) {
  const [positions, setPositions] = useState<[number, number][]>(() => fallbackPositions(from, to));

  const routeKey = `${from.lat},${from.lng}-${to.lat},${to.lng}`;
  const center = useMemo<[number, number]>(() => [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2], [from.lat, from.lng, to.lat, to.lng]);

  useEffect(() => {
    let cancelled = false;
    setPositions(fallbackPositions(from, to));

    const controller = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (!cancelled && Array.isArray(coords) && coords.length > 1) {
          setPositions(coords.map((coord: [number, number]) => [coord[1], coord[0]]));
        }
      })
      .catch(() => {
        if (!cancelled) setPositions(fallbackPositions(from, to));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [routeKey, from.lat, from.lng, from.label, to.lat, to.lng, to.label]);

  return (
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
      <Polyline positions={positions} pathOptions={{ color: '#e9c349', weight: 5, opacity: 0.95 }} />
      <Marker position={[from.lat, from.lng]}>
        <Tooltip permanent direction="top" offset={[0, -34]} className="custom-map-tooltip">
          {from.label}
        </Tooltip>
      </Marker>
      <Marker position={[to.lat, to.lng]}>
        <Tooltip permanent direction="top" offset={[0, -34]} className="custom-map-tooltip">
          {to.label}
        </Tooltip>
      </Marker>
      <FitRoute positions={positions} />
    </MapContainer>
  );
}
