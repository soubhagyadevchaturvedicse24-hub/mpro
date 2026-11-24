import { useState, useEffect, useRef, useCallback } from 'react';

// Leaflet safety check for SSR/Node test environments
let L;
if (typeof window !== 'undefined') {
  L = await import('leaflet').then(m => m.default || m);
}

/**
 * Validates whether a coordinate object or array is valid lat/lng numbers.
 */
export const isValidLatLng = (lat, lng) => {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    !(nLat === 0 && nLng === 0)
  );
};

/**
 * Calculates geographical bearing (angle in degrees 0..360) between two coordinates.
 */
export const calculateBearing = (startLat, startLng, destLat, destLng) => {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const dLng = destLngRad - startLngRad;

  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

/**
 * Safe bounds builder to prevent Leaflet bounds crashes.
 */
export const buildSafeBounds = (points = []) => {
  const validPoints = points.filter(p => p && isValidLatLng(p[0], p[1]));
  if (validPoints.length === 0) return null;
  if (typeof window === 'undefined' || typeof L === 'undefined') {
    return { validCount: validPoints.length, points: validPoints };
  }
  if (validPoints.length === 1) {
    const [lat, lng] = validPoints[0];
    return L.latLngBounds([[lat - 0.01, lng - 0.01], [lat + 0.01, lng + 0.01]]);
  }
  return L.latLngBounds(validPoints);
};

/**
 * Ultra-robust 3-Point Live Route Pipeline Hook
 * 
 * Manages:
 * 1. Safe coordinate fallback & validation
 * 2. 60 FPS LERP position interpolation (gliding between pings)
 * 3. Bearing/Heading angle computation
 * 4. 2-Leg path generation (Traveled: Origin -> Live, Remaining: Live -> Destination)
 */
export const useLiveRoutePipeline = ({
  origin,       // { lat, lng, name }
  destination,  // { lat, lng, name }
  rawLivePos,   // { lat, lng } or [lat, lng]
  lerpDuration = 2000,
}) => {
  // ── 1. Extract and sanitize coordinates ──
  const safeOrigin = useRef({ lat: 20.5937, lng: 78.9629 }); // India center — overridden immediately if valid coords provided
  const safeDest   = useRef({ lat: 20.5937, lng: 78.9629 });

  if (origin && isValidLatLng(origin.lat, origin.lng)) {
    safeOrigin.current = { lat: Number(origin.lat), lng: Number(origin.lng) };
  }
  if (destination && isValidLatLng(destination.lat, destination.lng)) {
    safeDest.current = { lat: Number(destination.lat), lng: Number(destination.lng) };
  }

  // Parse raw live position
  let targetLat = safeOrigin.current.lat;
  let targetLng = safeOrigin.current.lng;

  if (Array.isArray(rawLivePos) && isValidLatLng(rawLivePos[0], rawLivePos[1])) {
    targetLat = Number(rawLivePos[0]);
    targetLng = Number(rawLivePos[1]);
  } else if (rawLivePos && isValidLatLng(rawLivePos.lat, rawLivePos.lng)) {
    targetLat = Number(rawLivePos.lat);
    targetLng = Number(rawLivePos.lng);
  }

  // ── 2. Smooth LERP State ──
  const [displayPos, setDisplayPos] = useState([targetLat, targetLng]);
  const [bearing, setBearing] = useState(0);

  const currentPosRef = useRef([targetLat, targetLng]);
  const animRef       = useRef(null);
  const startTimeRef  = useRef(null);
  const startPosRef   = useRef([targetLat, targetLng]);

  // Trigger LERP animation when target position changes
  useEffect(() => {
    const [startLat, startLng] = currentPosRef.current;
    
    // Compute bearing if vehicle moved noticeably (> 1 meter)
    const distSq = Math.pow(targetLat - startLat, 2) + Math.pow(targetLng - startLng, 2);
    if (distSq > 0.00000001) {
      const newBearing = calculateBearing(startLat, startLng, targetLat, targetLng);
      setBearing(newBearing);
    }

    startPosRef.current = [startLat, startLng];
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / lerpDuration, 1.0);

      // Smooth step easing (cubic easeOut)
      const ease = 1 - Math.pow(1 - progress, 3);

      const curLat = startPosRef.current[0] + (targetLat - startPosRef.current[0]) * ease;
      const curLng = startPosRef.current[1] + (targetLng - startPosRef.current[1]) * ease;

      currentPosRef.current = [curLat, curLng];
      setDisplayPos([curLat, curLng]);

      if (progress < 1.0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [targetLat, targetLng, lerpDuration]);

  // ── 3. Route Segment Generators ──
  const [traveledPath, setTraveledPath]   = useState([]);
  const [remainingPath, setRemainingPath] = useState([]);

  // Dynamically update the 2-leg route polylines
  const updateRouteLegs = useCallback(async () => {
    const orig = safeOrigin.current;
    const dest = safeDest.current;
    const cur  = displayPos;

    // Simple robust straight/interpolated path builder
    const buildLegPoints = (from, to, steps = 15) => {
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = from[0] + t * (to[0] - from[0]);
        const lng = from[1] + t * (to[1] - from[1]);
        points.push([lat, lng]);
      }
      return points;
    };

    // Leg 1: Origin -> Current Position
    const leg1 = buildLegPoints([orig.lat, orig.lng], cur);
    // Leg 2: Current Position -> Destination
    const leg2 = buildLegPoints(cur, [dest.lat, dest.lng]);

    setTraveledPath(leg1);
    setRemainingPath(leg2);
  }, [displayPos]);

  useEffect(() => {
    updateRouteLegs();
  }, [updateRouteLegs]);

  // Return complete pipeline state
  return {
    displayPos,        // [lat, lng] for smooth 60fps rendering
    bearing,           // angle in degrees (0..360)
    traveledPath,      // Origin -> Current Live Position
    remainingPath,     // Current Live Position -> Destination
    originCoords: [safeOrigin.current.lat, safeOrigin.current.lng],
    destCoords:   [safeDest.current.lat, safeDest.current.lng],
    bounds: buildSafeBounds([[safeOrigin.current.lat, safeOrigin.current.lng], displayPos, [safeDest.current.lat, safeDest.current.lng]]),
  };
};
