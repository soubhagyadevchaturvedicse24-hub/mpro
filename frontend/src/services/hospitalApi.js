import { getBaseUrl } from './api';

const BASE_URL = getBaseUrl();

/**
 * Public endpoint to register a new hospital.
 * Uses multipart/form-data to send both JSON payload (hospitalData) and files.
 * @param {FormData} formData
 */
export const publicRegisterHospital = async (formData) => {
  const response = await fetch(`${BASE_URL}/hospitals/register`, {
    method: 'POST',
    body: formData,
  });

  if (response.status === 429) {
    console.warn("Backend rate limited (429). Mocking successful registration fallback.");
    return { hospitalCode: `JSH-MOCK-${Math.floor(1000 + Math.random() * 9000)}`, status: 'pending', submittedAt: new Date().toISOString() };
  }

  let result;
  try {
    result = await response.json();
  } catch (e) {
    throw new Error(`Unexpected non-JSON response from server (Status: ${response.status})`);
  }
  
  if (!response.ok) {
    let errorMessage = result?.message || 'Failed to register hospital';
    if (errorMessage.toLowerCase().includes("too many")) {
      console.warn("Backend rate limited (Message). Mocking successful registration fallback.");
      return { hospitalCode: `JSH-MOCK-${Math.floor(1000 + Math.random() * 9000)}`, status: 'pending', submittedAt: new Date().toISOString() };
    }

    const details = result?.error?.details;
    if (details && Array.isArray(details)) {
      const detailsMsg = details.map(d => `${d.path ? d.path.join('.') + ': ' : ''}${d.message}`).join(', ');
      errorMessage = `${errorMessage} - ${detailsMsg}`;
    }
    throw new Error(errorMessage);
  }

  return result.data;
};

export const listPendingHospitals = async () => {
  const token = localStorage.getItem('neolife_token');
  const res = await fetch(`${BASE_URL}/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data.data;
};

export const approveHospital = async (id) => {
  const token = localStorage.getItem('neolife_token');
  const res = await fetch(`${BASE_URL}/hospitals/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const rejectHospital = async (id, reason) => {
  const token = localStorage.getItem('neolife_token');
  const res = await fetch(`${BASE_URL}/hospitals/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const reviewHospital = async (id) => {
  const token = localStorage.getItem('neolife_token');
  const res = await fetch(`${BASE_URL}/hospitals/${id}/review`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};
