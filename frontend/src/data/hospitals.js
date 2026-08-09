import { getHospitals } from '../services/api';

export const DEFAULT_HOSPITALS = [];

const CITY_COORDINATES = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'faridabad': { lat: 28.4089, lng: 77.3178 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 }
};

export const getCityCoordinates = (cityName) => {
  const key = (cityName || '').toLowerCase().trim();
  if (CITY_COORDINATES[key]) {
    return {
      lat: CITY_COORDINATES[key].lat + (Math.random() - 0.5) * 0.03,
      lng: CITY_COORDINATES[key].lng + (Math.random() - 0.5) * 0.03
    };
  }
  // Default NCR coordinates with slight random jitter
  return {
    lat: 28.5398 + (Math.random() - 0.5) * 0.05,
    lng: 77.2831 + (Math.random() - 0.5) * 0.05
  };
};

export const getRegisteredHospitalsFromStorage = () => {
  try {
    const custom = JSON.parse(localStorage.getItem('neolife_registered_hospitals') || '[]');
    return Array.isArray(custom) ? custom : [];
  } catch (e) {
    return [];
  }
};

export const registerHospitalInRegistry = (hospitalData) => {
  const custom = getRegisteredHospitalsFromStorage();

  const city = hospitalData.address?.city || hospitalData.city || hospitalData.district || hospitalData.state || 'Delhi';
  const coords = getCityCoordinates(city);

  const name = hospitalData.name || hospitalData.hospitalLegalName || hospitalData.displayName || 'Registered Hospital';
  const addressStr = typeof hospitalData.address === 'string' 
    ? hospitalData.address 
    : `${hospitalData.address?.street || hospitalData.addressLine1 || 'Hospital Campus'}, ${hospitalData.address?.city || city} - ${hospitalData.address?.pincode || hospitalData.pin || ''}`;

  const newHosp = {
    ...hospitalData,
    id: hospitalData.id || hospitalData._id || `hosp-reg-${Date.now()}`,
    name: name,
    addressString: addressStr,
    address: typeof hospitalData.address === 'object' ? hospitalData.address : { street: addressStr, city: city, state: hospitalData.state || 'Delhi', pincode: hospitalData.pin || '' },
    lat: hospitalData.lat || hospitalData.location?.lat || coords.lat,
    lng: hospitalData.lng || hospitalData.location?.lng || coords.lng,
    city: city,
    status: hospitalData.status || 'PENDING_VERIFICATION',
    submittedAt: hospitalData.submittedAt || new Date().toISOString(),
  };

  const existingIdx = custom.findIndex(h => h.name.toLowerCase() === newHosp.name.toLowerCase());
  if (existingIdx !== -1) {
    custom[existingIdx] = newHosp;
  } else {
    custom.push(newHosp);
  }

  localStorage.setItem('neolife_registered_hospitals', JSON.stringify(custom));
  return newHosp;
};

let BACKEND_HOSPITALS = null;

export const initHospitals = async () => {
  try {
    const res = await getHospitals();
    const arr = Array.isArray(res) ? res : (res.hospitals || []);
    BACKEND_HOSPITALS = arr.map(h => {
      const city = h.city || h.address?.city || h.district || h.state || 'Delhi';
      const fallbackCoords = getCityCoordinates(city);
      return {
        id: h.id || h._id || `hosp-reg-${Math.random()}`,
        name: h.name || h.hospitalLegalName || h.displayName || 'Unknown Hospital',
        address: typeof h.address === 'string' ? h.address : `${h.address?.street || 'Campus'}, ${city}`,
        lat: h.lat || h.location?.lat || fallbackCoords.lat,
        lng: h.lng || h.location?.lng || fallbackCoords.lng,
        city: city,
        ...h
      };
    });
  } catch (err) {
    console.warn('Failed to fetch backend hospitals, using defaults.', err);
    BACKEND_HOSPITALS = null;
  }
};

export const getALLHospitals = () => {
  if (BACKEND_HOSPITALS !== null && BACKEND_HOSPITALS.length > 0) {
    return BACKEND_HOSPITALS;
  }
  const registered = getRegisteredHospitalsFromStorage();
  return [...DEFAULT_HOSPITALS, ...registered];
};

export const HOSPITALS = getALLHospitals();

export const getHospitalByName = (name) => {
  const all = getALLHospitals();
  const searchName = String(name || '').toLowerCase();
  return all.find(h => String(h?.name || '').toLowerCase() === searchName) || all[0];
};
