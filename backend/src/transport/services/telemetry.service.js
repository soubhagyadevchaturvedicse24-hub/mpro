import TelemetryLog from '../../models/TelemetryLog.js';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_THRESHOLDS } from '../config/thresholds.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import TransportMission from '../../models/TransportMission.js';
import logger from '../../logger/index.js';
import mongoose from 'mongoose';

export const logTelemetry = async (boxId, missionId, payload) => {
  // Validate basic payload
  if (payload.temperature === undefined || payload.batteryLevel === undefined) {
    throw new Error('Invalid telemetry payload');
  }

  // Resolve missionId (logical string like 'TRN-2026-001' or MongoDB ObjectId)
  let resolvedMissionId = missionId;
  let mission = null;

  if (!mongoose.Types.ObjectId.isValid(missionId)) {
    mission = await TransportMission.findOne({ missionId });
    if (mission) resolvedMissionId = mission._id;
  } else {
    mission = await TransportMission.findById(missionId);
  }

  // ── TELEMETRY GATE ──────────────────────────────────────────────────────────
  // Sensor data is ONLY recorded (DB + blockchain) when the transport is actively
  // IN_TRANSIT. Idle sensor heartbeats are silently dropped to keep the blockchain
  // clean. RFID scan is what opens this gate.
  if (!mission || mission.status !== 'IN_TRANSIT') {
    logger.info(`TELEMETRY_GATED: missionId=${missionId} status=${mission?.status || 'NO_ACTIVE_MISSION'} — data discarded (not IN_TRANSIT)`);
    return { gated: true, status: mission?.status || 'NO_ACTIVE_MISSION' };
  }
  // ────────────────────────────────────────────────────────────────────────────

  const geoLocation = (payload.geoLocation && Array.isArray(payload.geoLocation.coordinates))
    ? payload.geoLocation
    : { type: 'Point', coordinates: [77.2090, 28.5659] };

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
  if (mongoose.Types.ObjectId.isValid(boxId)) {
    await TransportBox.findByIdAndUpdate(boxId, {
      batteryHealth: payload.batteryLevel,
      lastHeartbeat: Date.now(),
      lastKnownLocation: payload.geoLocation,
    }).catch(() => {});
  } else {
    await TransportBox.findOneAndUpdate({ boxId }, {
      batteryHealth: payload.batteryLevel,
      lastHeartbeat: Date.now(),
      lastKnownLocation: payload.geoLocation,
    }).catch(() => {});
  }

  eventBus.on; // no-op reference check
  eventBus.emit(TRANSPORT_EVENTS.TELEMETRY_RECEIVED, {
    boxId,
    missionId: resolvedMissionId,
    telemetry: {
      // Use toObject() to properly spread Mongoose subdocument fields
      ...(log.telemetry.toObject ? log.telemetry.toObject() : log.telemetry),
      // ESP32 hardware fields — use payload directly (not from Mongoose model which doesn't store them)
      buzzerStatus:    payload.buzzerStatus    || 'Normal',
      rgbColor:        payload.rgbColor        || 'Green',
      rfidLastScanned: payload.rfidLastScanned || '3913DDB7',
      speedKmh:        payload.speedKmh        || 0.0,
      firmwareVersion: payload.firmwareVersion || 'v3.1.0',
      reedStatus:      payload.reedStatus      || (payload.isTampered ? 'Box Open' : 'Box Closed'),
      relayStatus:     payload.relayStatus     || 'Locked',
    },
    location: log.telemetry.geoLocation,
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
    if (mission && mission.organId && mission.organId.organType) {
      const organConfig = (await import('../../organ/utils/organDefaults.js')).ORGAN_DEFAULTS[mission.organId.organType];
      if (organConfig) {
        minTemp = organConfig.minTemp;
        maxTemp = organConfig.maxTemp;
      }
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
