import { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'nischay-google-maps';

function loadMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);
  });
}

async function getMapsKey() {
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }

  const response = await fetch('/api/config/maps');
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.apiKey) {
    throw new Error(
      data.error || 'Google Maps is not configured. Add GOOGLE_MAPS_API_KEY in Vercel Environment Variables.'
    );
  }

  return data.apiKey;
}

export default function GoogleDemandMap({ points = [], mode = 'demand', onSelect }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const overlays = useRef([]);
  const [maps, setMaps] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getMapsKey()
      .then(loadMaps)
      .then(instance => {
        if (active) setMaps(instance);
      })
      .catch(err => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!maps || !ref.current) return;

    if (!mapRef.current) {
      mapRef.current = new maps.Map(ref.current, {
        center: { lat: 22.8, lng: 79.5 },
        zoom: 5,
        minZoom: 4,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
      });
    }

    overlays.current.forEach(overlay => overlay.setMap(null));
    overlays.current = [];

    const max = Math.max(
      1,
      ...points.map(point =>
        mode === 'priority' ? point.priorityScore : point.complaintCount
      )
    );

    for (const point of points) {
      if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) continue;

      const value = mode === 'priority' ? point.priorityScore : point.complaintCount;
      const ratio = value / max;
      const color =
        mode === 'priority'
          ? point.priorityScore >= 75
            ? '#d24c2d'
            : point.priorityScore >= 55
              ? '#e3a82b'
              : '#4338a3'
          : '#4338a3';

      const circle = new maps.Circle({
        map: mapRef.current,
        center: { lat: point.latitude, lng: point.longitude },
        radius: 18000 + ratio * 48000,
        fillColor: color,
        fillOpacity: 0.28,
        strokeColor: color,
        strokeOpacity: 0.72,
        strokeWeight: 1
      });

      circle.addListener('click', () => onSelect?.(point));
      overlays.current.push(circle);
    }
  }, [maps, points, mode, onSelect]);

  if (error) return <div className="map-fallback">{error}</div>;

  return (
    <div
      ref={ref}
      className="google-map"
      aria-label="India development demand map"
    />
  );
}
