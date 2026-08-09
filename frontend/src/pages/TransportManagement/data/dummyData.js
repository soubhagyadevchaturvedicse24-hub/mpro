import { getALLHospitals } from '../../../data/hospitals';

const getOrigin = () => {
  const all = getALLHospitals();
  return all[0] || { name: 'CityCare Hospital', address: '45, MG Road' };
};

const getDest = () => {
  const all = getALLHospitals();
  return all[1] || all[0] || { name: 'Green Valley Hospital', address: 'Sector 12' };
};

const DEFAULT_SCHEDULED = [];
const DEFAULT_ONGOING = [];
const DEFAULT_COMPLETED = [];

export const getScheduledTransports = () => {
  return DEFAULT_SCHEDULED;
};

export const saveScheduledTransports = (items) => {
  // No-op: Data strictly managed by Backend DB
};

export const getOngoingTransports = () => {
  return DEFAULT_ONGOING;
};

export const saveOngoingTransports = (items) => {
  // No-op: Data strictly managed by Backend DB
};

export const getCompletedTransports = () => {
  return DEFAULT_COMPLETED;
};

export const saveCompletedTransports = (items) => {
  // No-op: Data strictly managed by Backend DB
};

