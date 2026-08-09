/**
 * useHospitals.js
 * ─────────────────────────────────────────────────────────────────
 * Central source of truth for hospital data across the entire app.
 * Fetches from MongoDB backend and deduplicates with localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { getHospitals } from '../services/api';
import { getCityCoordinates, getRegisteredHospitalsFromStorage } from './hospitals';

let _cache = null;
let _listeners = [];

const notify = () => {
  _listeners.forEach(fn => fn());
};

const fetchAndCache = async () => {
  try {
    const res = await getHospitals();
    const raw = Array.isArray(res)
      ? res
      : (res?.hospitals || res?.data?.hospitals || res?.data || []);

    if (!Array.isArray(raw)) {
      throw new Error('Invalid hospital response format');
    }

    const mapped = raw.map((h, idx) => {
      const city = h.city || h.address?.city || h.district || h.state || 'Delhi';
      const coords = getCityCoordinates(city);
      const addressStr = typeof h.address === 'string'
        ? h.address
        : [h.address?.street, h.address?.city, h.address?.state, h.address?.pincode]
            .filter(Boolean).join(', ') || `${city} Hospital Campus`;

      const idStr = h._id ? String(h._id) : (h.id ? String(h.id) : `hosp-${idx}`);

      return {
        id:      idStr,
        _id:     idStr,
        name:    h.name || h.hospitalLegalName || h.displayName || 'Unknown Hospital',
        address: addressStr,
        lat:     h.lat || h.location?.lat  || h.address?.lat  || coords.lat,
        lng:     h.lng || h.location?.lng  || h.address?.lng  || coords.lng,
        status:  (h.status || 'ACTIVE').toUpperCase(),
        city,
        ...h,
      };
    });

    const local = getRegisteredHospitalsFromStorage();

    // Deduplicate hospitals by normalized name
    const combined = new Map();
    mapped.forEach(h => {
      if (h.name) combined.set(h.name.toLowerCase().trim(), h);
    });
    local.forEach(h => {
      if (h.name && !combined.has(h.name.toLowerCase().trim())) {
        combined.set(h.name.toLowerCase().trim(), h);
      }
    });

    _cache = Array.from(combined.values());
  } catch (err) {
    console.warn('[useHospitals] Backend fetch error:', err.message);
    const local = getRegisteredHospitalsFromStorage();
    const combined = new Map();
    local.forEach(h => {
      if (h.name) combined.set(h.name.toLowerCase().trim(), h);
    });
    _cache = Array.from(combined.values());
  }
  notify();
};

// Initial fetch
fetchAndCache();

export const useHospitals = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(t => t + 1);
    _listeners.push(refresh);
    if (_cache !== null) refresh();
    return () => {
      _listeners = _listeners.filter(fn => fn !== refresh);
    };
  }, []);

  const refetch = useCallback(() => {
    fetchAndCache();
  }, []);

  return {
    hospitals: _cache ?? [],
    loading:   _cache === null,
    refetch,
  };
};

export const getHospitalsSync = () => _cache ?? [];
