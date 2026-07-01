'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function MapDisplay({ 
  routeGeometry, 
  origin, 
  destination 
}: { 
  routeGeometry: any, 
  origin: {lat: number, lng: number, display_name?: string} | null, 
  destination: {lat: number, lng: number, display_name?: string} | null 
}) {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (mapRef.current) {
      if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
        const bounds = L.geoJSON(routeGeometry).getBounds();
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (origin) {
        mapRef.current.setView([origin.lat, origin.lng], 13);
      } else if (destination) {
        mapRef.current.setView([destination.lat, destination.lng], 13);
      }
    }
  }, [routeGeometry, origin, destination]);

  const positions = routeGeometry?.coordinates 
    ? routeGeometry.coordinates.map((c: any) => [c[1], c[0]]) 
    : [];

  return (
    <MapContainer 
      center={[48.3794, 31.1656]} 
      zoom={5} 
      style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '1rem', zIndex: 0 }} 
      ref={mapRef}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
      />
      {positions.length > 0 && <Polyline positions={positions} pathOptions={{ color: '#e9c349', weight: 4 }} />}
      {origin && (
        <Marker position={[origin.lat, origin.lng]}>
          {origin.display_name && (
            <Tooltip permanent direction="top" offset={[0, -35]} className="custom-map-tooltip">
              Звідки: {origin.display_name.split(',')[0]}
            </Tooltip>
          )}
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          {destination.display_name && (
            <Tooltip permanent direction="top" offset={[0, -35]} className="custom-map-tooltip">
              Куди: {destination.display_name.split(',')[0]}
            </Tooltip>
          )}
        </Marker>
      )}
    </MapContainer>
  );
}
