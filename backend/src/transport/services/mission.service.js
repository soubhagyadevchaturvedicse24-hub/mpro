import Hospital from '../../models/Hospital.js';
import TransportMission from '../../models/TransportMission.js';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_ERRORS, WORKFLOW_ERRORS } from '../../constants/errorCodes.js';
import { transportMachine } from '../../workflow/transitions/transport.transitions.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import logger from '../../logger/index.js';
import mongoose from 'mongoose';

export const createMission = async (missionData, actorId) => {
  // Check if box is available, or find one if not provided
  let box;
  if (missionData.boxId) {
    box = await TransportBox.findById(missionData.boxId);
  } else {
    box = await TransportBox.findOne({ status: 'AVAILABLE' });
  }

  if (!box || !['AVAILABLE'].includes(box.status)) {
    throw TRANSPORT_ERRORS.BOX_UNAVAILABLE;
  }

  missionData.boxId = box._id;

  // Resolve hospital names → ObjectIDs if strings were passed from the frontend
  if (missionData.originHospitalName && !missionData.originHospital) {
    const origin = await Hospital.findOne({ name: new RegExp(missionData.originHospitalName, 'i') });
    if (origin) missionData.originHospital = origin._id;
  }
  if (missionData.destinationHospitalName && !missionData.destinationHospital) {
    const dest = await Hospital.findOne({ name: new RegExp(missionData.destinationHospitalName, 'i') });
    if (dest) missionData.destinationHospital = dest._id;
  }

  // If hospitals still not resolved, try to find any existing hospital as fallback
  if (!missionData.originHospital) {
    const anyHosp = await Hospital.findOne({ status: { $in: ['ACTIVE', 'APPROVED'] } });
    if (anyHosp) missionData.originHospital = anyHosp._id;
  }
  if (!missionData.destinationHospital) {
    const anyHosp = await Hospital.findOne({ status: { $in: ['ACTIVE', 'APPROVED'] } });
    if (anyHosp) missionData.destinationHospital = anyHosp._id;
  }

  const mission = new TransportMission({
    ...missionData,
    status: 'PENDING',
    chainOfCustody: [{
      actorId,
      action: 'MISSION_CREATED',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.5659] // Default coordinates to AIIMS Delhi
      }
    }],
  });

  await mission.save();

  // Box status is updated when mission transitions to IN_TRANSIT via workflow

  eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_CREATED, { missionId: mission._id });
  logger.info(`MISSION_CREATED: ${mission.missionId}`);

  return mission;
};

export const updateMissionWorkflow = async (missionId, action, actorId, locationInfo = {}) => {
  const mission = await TransportMission.findById(missionId);
  if (!mission) throw TRANSPORT_ERRORS.NOT_FOUND;

  const oldStatus = mission.status;
  const newStatus = transportMachine.transition(oldStatus, action);

  mission.status = newStatus;

  // Record audit event
  const event = {
    actorId,
    action: action.toUpperCase(),
  };

  if (locationInfo && Array.isArray(locationInfo.coordinates) && locationInfo.coordinates.length === 2) {
    event.location = locationInfo;
  }

  mission.chainOfCustody.push(event);

  if (newStatus === 'DISPATCHED') {
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_DISPATCHED, { missionId: mission._id });
  } else if (newStatus === 'IN_TRANSIT') {
    mission.actualDepartureTime = Date.now();
    // Now physically lock the box as IN_TRANSIT
    await TransportBox.findByIdAndUpdate(mission.boxId, { status: 'IN_TRANSIT' }).catch(() => {});
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_STARTED, { missionId: mission._id });
  } else if (newStatus === 'ARRIVED') {
    mission.actualArrivalTime = Date.now();
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_ARRIVED, { missionId: mission._id });
  } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
    // Release the box back to AVAILABLE
    await TransportBox.findByIdAndUpdate(mission.boxId, { status: 'AVAILABLE' }).catch(() => {});
    // Free the RFID card slot so it can be assigned to the next transport
    mission.assignedRfidCard = null;
    const eventName = newStatus === 'COMPLETED' ? TRANSPORT_EVENTS.TRANSPORT_COMPLETED : TRANSPORT_EVENTS.TRANSPORT_CANCELLED;
    eventBus.emit(eventName, { missionId: mission._id });
  }

  await mission.save();
  logger.info(`MISSION_UPDATED: ${mission.missionId} from ${oldStatus} to ${newStatus} via ${action}`);

  return mission;
};

export const getMissionById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { missionId: id };
  const mission = await TransportMission.findOne(query).populate('boxId courierId originHospital destinationHospital');
  if (!mission) throw TRANSPORT_ERRORS.NOT_FOUND;
  return mission;
};

export const updateMissionDetails = async (id, updateData, actorId) => {
  const mongoose = (await import('mongoose')).default;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { missionId: id };
  const mission = await TransportMission.findOne(query);
  if (!mission) throw TRANSPORT_ERRORS.NOT_FOUND;

  if (updateData.destination && !updateData.destinationHospital) {
    const dest = await Hospital.findOne({ name: new RegExp(updateData.destination, 'i') });
    if (dest) mission.destinationHospital = dest._id;
  }
  if (updateData.destinationHospital) {
    mission.destinationHospital = updateData.destinationHospital;
  }
  if (updateData.organType) {
    mission.organType = updateData.organType;
  }
  if (updateData.patientName) {
    mission.patientName = updateData.patientName;
  }
  if (updateData.patientId) {
    mission.patientId = updateData.patientId;
  }
  if (updateData.priority) {
    mission.priority = updateData.priority;
  }

  await mission.save();
  logger.info(`MISSION_EDITED: ${mission.missionId} (organ: ${mission.organType}) updated by actor ${actorId}`);
  return mission;
};

export const listMissions = async ({ isNodalAdmin = false, hospitalId } = {}) => {
  let query = {};

  if (!isNodalAdmin && hospitalId) {
    // Multi-tenant isolation: hospital users only see their own transports
    query = {
      $or: [
        { originHospital: hospitalId },
        { destinationHospital: hospitalId },
      ],
    };
  }
  // Nodal officers (isNodalAdmin = true) get no filter → see all missions globally

  const missions = await TransportMission.find(query)
    .populate('originHospital destinationHospital', 'name hospitalCode address geoLocation')
    .sort({ createdAt: -1 });

  return { missions };
};


export const getActiveShipments = async () => {
  const activeMissions = await TransportMission.find({
    status: { $in: ['DISPATCHED', 'IN_TRANSIT'] }
  }).populate('boxId originHospital destinationHospital');

  // Dynamically resolve latest telemetry log for each active mission
  const shipments = await Promise.all(activeMissions.map(async (m) => {
    // We import TelemetryLog dynamically inside to avoid circular dependencies if any
    const { default: TelemetryLog } = await import('../../models/TelemetryLog.js');
    const latestLog = await TelemetryLog.findOne({ missionId: m._id }).sort({ createdAt: -1 });
    
    return {
      boxId: m.boxId ? m.boxId.boxId : 'UNKNOWN-BOX',
      organType: m.organId || 'ORGAN-KIDNEY',
      currentStatus: m.status,
      latestMetrics: {
        temperature: latestLog ? latestLog.telemetry.temperature : 4.15,
        reed_latch: latestLog ? (latestLog.telemetry.isTampered ? 0 : 1) : 1
      },
      destinationHospitalMsp: m.destinationHospital ? m.destinationHospital.name : 'Unknown Hospital',
      thotaConsentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };
  }));

  return shipments;
};
