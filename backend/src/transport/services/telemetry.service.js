import TelemetryLog from '../../models/TelemetryLog.js';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_THRESHOLDS } from '../config/thresholds.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import TransportMission from '../../models/TransportMission.js';
import logger from '../../logger/index.js';
import mongoose from 'mongoose';

export const extractCoordinates = (payload) => {
  if (!payload) return null;

  // 1. Array in geoLocation.coordinates, location.coordinates, or coordinates
  let coords = payload.geoLocation?.coordinates || payload.location?.coordinates || payload.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    let [c1, c2] = coords.map(Number);
    if (!isNaN(c1) && !isNaN(c2) && !(c1 === 0 && c2 === 0)) {
      // GeoJSON requires [longitude, latitude].
      // If c1 is latitude (-90..90) and c2 is longitude (>90 or <-90), e.g. [28.6139, 77.2090], c1 and c2 are inverted.
      if (Math.abs(c1) <= 90 && Math.abs(c2) > 90) {
        return [c2, c1]; // Swap to [lng, lat]
      }
      return [c1, c2]; // [lng, lat]
    }
  }

  // 2. Direct lat/lng or latitude/longitude in payload or sub-objects
  const candidates = [payload, payload.gps, payload.location, payload.geoLocation, payload.telemetry];
  for (const item of candidates) {
    if (!item) continue;
    const lat = item.lat ?? item.latitude ?? item.gpsLat;
    const lng = item.lng ?? item.longitude ?? item.gpsLng;
    if (lat !== undefined && lng !== undefined) {
      const nLat = Number(lat);
      const nLng = Number(lng);
      if (!isNaN(nLat) && !isNaN(nLng) && !(nLat === 0 && nLng === 0)) {
        return [nLng, nLat]; // Return GeoJSON [lng, lat]
      }
    }
  }

  return null;
};

export const logTelemetry = async (boxId, missionId, payload) => {
  // Validate basic payload
  if (payload.temperature === undefined || payload.batteryLevel === undefined) {
    throw new Error('Invalid telemetry payload');
  }

  // Resolve missionId (logical string like 'TRN-2026-001' or MongoDB ObjectId)
  let resolvedMissionId = missionId;
  let mission = null;

  if (!mongoose.Types.ObjectId.isValid(missionId)) {
    mission = await TransportMission.findOne({ missionId }).populate('originHospital');
    if (mission) resolvedMissionId = mission._id;
  } else {
    mission = await TransportMission.findById(missionId).populate('originHospital');
  }

  // ── TELEMETRY GATE ──────────────────────────────────────────────────────────
  // Sensor data is recorded (DB + blockchain) when the transport is actively
  // DISPATCHED, IN_TRANSIT, or ARRIVED. This is crucial for establishing a
  // complete Digital Evidence chain of custody from origin to destination.
  const activeStatuses = ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'];
  if (!mission || !activeStatuses.includes(mission.status)) {
    logger.info(`TELEMETRY_GATED: missionId=${missionId} status=${mission?.status || 'NO_ACTIVE_MISSION'} — data discarded (not in active state)`);
    return { gated: true, status: mission?.status || 'NO_ACTIVE_MISSION' };
  }
  // ────────────────────────────────────────────────────────────────────────────

  const extracted = extractCoordinates(payload);
  let geoLocation;
  if (extracted) {
    geoLocation = { type: 'Point', coordinates: extracted };
  } else if (mission?.originHospital?.geoLocation?.coordinates?.length === 2) {
    geoLocation = mission.originHospital.geoLocation;
  } else {
    geoLocation = { type: 'Point', coordinates: [77.2090, 28.5659] };
  }

  const log = new TelemetryLog({
    boxId: mongoose.Types.ObjectId.isValid(boxId) ? boxId : new mongoose.Types.ObjectId(),
    missionId: mongoose.Types.ObjectId.isValid(resolvedMissionId) ? resolvedMissionId : new mongoose.Types.ObjectId(),
    arweaveTxId: payload.arweaveTxId || null,
    telemetry: {
      temperature: payload.temperature,
      batteryLevel: payload.batteryLevel,
      geoLocation,
      isTampered: payload.isTampered || false,
    },
  });

  await log.save();

  // Update Transport Box latest status if found
  const boxUpdate = {
    batteryHealth: payload.batteryLevel,
    lastHeartbeat: Date.now(),
    lastKnownLocation: geoLocation,
  };

  if (mongoose.Types.ObjectId.isValid(boxId)) {
    await TransportBox.findByIdAndUpdate(boxId, boxUpdate).catch(() => {});
  } else {
    await TransportBox.findOneAndUpdate({ boxId }, boxUpdate).catch(() => {});
  }

  eventBus.emit(TRANSPORT_EVENTS.TELEMETRY_RECEIVED, {
    boxId,
    missionId: resolvedMissionId,
    telemetry: {
      ...(log.telemetry.toObject ? log.telemetry.toObject() : log.telemetry),
      lat: geoLocation.coordinates[1],
      lng: geoLocation.coordinates[0],
      buzzerStatus:    payload.buzzerStatus    || 'Normal',
      rgbColor:        payload.rgbColor        || 'Green',
      rfidLastScanned: payload.rfidLastScanned || '3913DDB7',
      speedKmh:        payload.speedKmh        || 0.0,
      firmwareVersion: payload.firmwareVersion || 'v3.1.0',
      reedStatus:      payload.reedStatus      || (payload.isTampered ? 'Box Open' : 'Box Closed'),
      relayStatus:     payload.relayStatus     || 'Locked',
    },
    location: geoLocation,
    arweaveTxId: log.arweaveTxId
  });

  // Evaluate thresholds and emit alerts if necessary
  const alerts = await evaluateAlerts(boxId, resolvedMissionId, log.telemetry);
  await updateMissionHealth(resolvedMissionId, alerts);

  return log;
};

export const evaluateAlerts = async (boxId, missionId, telemetry) => {
  const alerts = [];
  
  // Default thresholds in case we can't find the specific organ config
  let minTemp = TRANSPORT_THRESHOLDS.MIN_TEMP;
  let maxTemp = TRANSPORT_THRESHOLDS.MAX_TEMP;
  
  try {
    // missionId might be a String like 'TRN-2026-001' or an ObjectId. We handle both.
    const query = mongoose.Types.ObjectId.isValid(missionId) ? { _id: missionId } : { missionId };
    const mission = await TransportMission.findOne(query).populate('organId');
    const organKey = (mission?.organType || mission?.organId?.organType || 'KIDNEY').toUpperCase();
    const organConfig = (await import('../../organ/utils/organDefaults.js')).ORGAN_DEFAULTS[organKey];
    if (organConfig) {
      minTemp = organConfig.minTemp;
      maxTemp = organConfig.maxTemp;
    }
  } catch (error) {
    logger.error(`Failed to fetch organ thresholds for mission ${missionId}: ${error.message}`);
  }

  if (telemetry.temperature > maxTemp) {
    alerts.push(`Temperature high: ${telemetry.temperature}°C`);
  }
  if (telemetry.temperature < minTemp) {
    alerts.push(`Temperature low: ${telemetry.temperature}°C`);
  }
  if (telemetry.batteryLevel < TRANSPORT_THRESHOLDS.LOW_BATTERY) {
    alerts.push(`Battery low: ${telemetry.batteryLevel}%`);
  }
  if (TRANSPORT_THRESHOLDS.TAMPER_ENABLED && telemetry.isTampered) {
    alerts.push(`Box tamper detected!`);
  }

  if (alerts.length > 0) {
    eventBus.emit(TRANSPORT_EVENTS.TELEMETRY_ALERT, { boxId, missionId, alerts, telemetry });
    logger.warn(`TELEMETRY_ALERT [Box:${boxId}]: ${alerts.join(' | ')}`);
  }

  return alerts;
};

export const updateMissionHealth = async (missionId, alerts) => {
  // missionId might be a String like 'TRN-2026-001' or an ObjectId. We handle both.
  const query = mongoose.Types.ObjectId.isValid(missionId) ? { _id: missionId } : { missionId };
  const mission = await TransportMission.findOne(query);
  if (!mission) return;

  const previousStatus = mission.health?.status || 'NORMAL';
  
  let newStatus = 'NORMAL';
  let score = 100;

  if (alerts.length > 0) {
    newStatus = alerts.some(a => a.includes('Tamper') || a.includes('Battery low')) ? 'CRITICAL' : 'WARNING';
    score = Math.max(0, 100 - (alerts.length * 20)); // arbitrary scoring logic
  }

  mission.health = {
    status: newStatus,
    score,
    lastEvaluation: Date.now(),
    reasons: alerts,
  };

  await mission.save();

  if (newStatus !== previousStatus && newStatus !== 'NORMAL') {
    eventBus.emit(TRANSPORT_EVENTS.HEALTH_STATUS_CHANGED, {
      missionId: mission._id,
      health: mission.health,
    });
    logger.info(`MISSION_HEALTH_CHANGED: ${mission.missionId} -> ${newStatus}`);
  }
};
