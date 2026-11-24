import * as telemetryService from '../services/telemetry.service.js';
import { DEVICE_ERRORS } from '../../constants/errorCodes.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import { getBlockchainAdapter } from '../../blockchain/adapters/BlockchainAdapterFactory.js';
import { executeSimulatorStep } from '../../simulator/controllers/simulator.controller.js';
import { getRfidCards } from '../../system/controllers/settings.controller.js';
import logger from '../../logger/index.js';
import TransportMission from '../../models/TransportMission.js';
import TransportBox from '../../models/TransportBox.js';
import * as missionService from '../services/mission.service.js';
import mongoose from 'mongoose';

export const postTelemetry = async (req, res, next) => {
  try {
    let { missionId, milestone, ...payload } = req.body;

    // 1. Try to find active mission by provided missionId (string or ObjectId)
    let activeMission = null;
    if (missionId) {
      if (mongoose.Types.ObjectId.isValid(missionId)) {
        activeMission = await TransportMission.findOne({
          _id: missionId,
          status: { $in: ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'] }
        });
      }
      if (!activeMission) {
        activeMission = await TransportMission.findOne({
          missionId: missionId,
          status: { $in: ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'] }
        });
      }
    }

    // 2. If not found by missionId, try to resolve from device's boxId
    if (!activeMission && req.device?.boxId) {
      const box = await TransportBox.findOne({
        $or: [{ boxId: req.device.boxId }, { deviceId: req.device.boxId }]
      });
      if (box) {
        activeMission = await TransportMission.findOne({
          boxId: box._id,
          status: { $in: ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'] }
        }).sort({ createdAt: -1 });
      }
    }

    // 3. If STILL not found (e.g. simulator sent default ID while a real mission is in transit), fallback to the latest active mission
    if (!activeMission) {
      activeMission = await TransportMission.findOne({
        status: { $in: ['DISPATCHED', 'IN_TRANSIT', 'ARRIVED'] }
      }).sort({ createdAt: -1 });
    }

    if (activeMission) {
      missionId = activeMission.missionId;
      logger.info(`TELEMETRY_RESOLVE: Bound telemetry to active mission ${missionId} (${activeMission.status})`);
    }

    if (milestone) {
      const map = {
        'TRANSPORT_CREATED':    TRANSPORT_EVENTS.TRANSPORT_CREATED,
        'TRANSPORT_DISPATCHED': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
        'TRANSPORT_ARRIVED':    TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
        'TRANSPORT_COMPLETED':  TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
        'transport.created':    TRANSPORT_EVENTS.TRANSPORT_CREATED,
        'transport.dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
        'transport.arrived':    TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
        'transport.completed':  TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      };
      const eventName = map[milestone] || map[milestone?.toUpperCase()];
      if (eventName) {
        eventBus.emit(eventName, {
          missionId,
          boxId: req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
          timestamp: new Date().toISOString(),
          triggeredBy: 'IoT Simulator',
          milestone,
        });
      }
    }

    const log = await telemetryService.logTelemetry(req.device?.boxId || 'BOX-2026-FABRIC-ALPHA', missionId, payload);
    
    // If telemetry was gated (mission not IN_TRANSIT), return 200 so ESP32 doesn't retry
    if (log?.gated) {
      return res.status(200).json({ success: true, gated: true, status: log.status, message: 'Telemetry received but gated — mission not IN_TRANSIT' });
    }

    res.status(201).json({ success: true, timestamp: log.timestamp });
  } catch (error) {
    next(error);
  }
};

export const triggerMilestone = async (req, res, next) => {
  try {
    const { milestone, stepId } = req.body;
    const sId = stepId || milestone;

    const simulatorSteps = [
      'donor_created', 'organ_registered', 'match_accepted',
      'transport_created', 'transport_dispatched', 'telemetry_normal',
      'telemetry_alert', 'transport_arrived', 'transport_completed',
      'DONOR_CREATED', 'ORGAN_REGISTERED', 'MATCH_ACCEPTED'
    ];

    if (sId && simulatorSteps.includes(sId)) {
      req.body.stepId = sId.toLowerCase();
      return executeSimulatorStep(req, res, next);
    }

    const { missionId = 'TRN-2026-001', payload = {} } = req.body;
    const map = {
      'TRANSPORT_CREATED':    TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'TRANSPORT_DISPATCHED': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'TRANSPORT_ARRIVED':    TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'TRANSPORT_COMPLETED':  TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      'transport.created':    TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'transport.dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'transport.arrived':    TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'transport.completed':  TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      'created':    TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'arrived':    TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'completed':  TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
    };

    const eventName = map[milestone] || map[milestone?.toUpperCase()] || milestone;

    eventBus.emit(eventName, {
      missionId,
      boxId: req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
      timestamp: new Date().toISOString(),
      triggeredBy: 'IoT Simulator',
      milestone,
      ...payload,
    });

    let block = { hash: 'pending', blockIndex: -1 };

    res.status(201).json({
      success: true,
      milestone,
      eventName,
      blockIndex: block?.blockIndex,
      hash: block?.hash,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/device/access
 * Called by ESP32 when an RFID card is scanned.
 *
 * Flow:
 *  1. Look up the 3 RFID card UIDs from SystemSettings
 *  2. Determine which card slot (1/2/3) matches the scanned UID
 *  3. Find an active mission assigned to that card slot
 *  4. If mission is DISPATCHED → auto-start transit (status: IN_TRANSIT)
 *  5. Emit RFID_TRANSPORT_STARTED event for blockchain notarisation
 *  6. Return 202 if transport was auto-started, 200 if just logged
 */
export const postAccess = async (req, res, next) => {
  try {
    const { rfid, timestamp, missionId: reqMissionId } = req.body;
    if (!rfid) {
      return res.status(400).json({ success: false, error: 'RFID UID is required' });
    }

    const scannedUid = rfid.toUpperCase().trim();

    // ── Step 1: Look up RFID card UIDs from settings ──────────────────────────
    const cards = await getRfidCards();
    const cardMap = {
      1: (cards.RFID_CARD_1_UID || '').toUpperCase().trim(),
      2: (cards.RFID_CARD_2_UID || '').toUpperCase().trim(),
      3: (cards.RFID_CARD_3_UID || '').toUpperCase().trim(),
    };

    // ── Step 2: Identify which card slot was scanned ──────────────────────────
    let matchedSlot = null;
    for (const [slot, uid] of Object.entries(cardMap)) {
      if (uid && uid !== 'PENDING' && uid === scannedUid) {
        matchedSlot = parseInt(slot);
        break;
      }
    }

    // Always emit the access attempt event for blockchain audit
    eventBus.emit(TRANSPORT_EVENTS.RFID_ACCESS_ATTEMPT, {
      boxId:      req.device?.boxId,
      deviceCode: req.device?.code,
      rfid:       scannedUid,
      cardSlot:   matchedSlot,
      timestamp:  timestamp || new Date().toISOString(),
    });

    if (!matchedSlot) {
      logger.warn(`RFID_ACCESS: Unknown card UID [${scannedUid}] — not assigned to any slot`);
      return res.status(200).json({
        success: true,
        message: 'RFID scan logged — card not assigned to any mission',
        rfid: scannedUid,
        autoStarted: false,
      });
    }

    // ── Step 3: Find active mission assigned to this RFID slot ─────────────────
    const activeMission = await TransportMission.findOne({
      assignedRfidCard: matchedSlot,
      status: { $in: ['DISPATCHED', 'PENDING'] },
    }).sort({ createdAt: -1 });

    if (!activeMission) {
      logger.info(`RFID_ACCESS: Card Slot ${matchedSlot} [${scannedUid}] — no DISPATCHED/PENDING mission found. Scan logged only.`);
      return res.status(200).json({
        success: true,
        message: 'RFID card recognised but no active mission awaiting this card slot',
        rfid: scannedUid,
        cardSlot: matchedSlot,
        autoStarted: false,
      });
    }

    logger.info(`RFID_TRANSPORT_START: Card Slot ${matchedSlot} [${scannedUid}] → Mission ${activeMission.missionId}`);

    // Emit RFID_TRANSPORT_STARTED only when a real mission is matched
    eventBus.emit(TRANSPORT_EVENTS.RFID_TRANSPORT_STARTED, {
      missionId:   activeMission.missionId,
      boxId:       req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
      rfid:        scannedUid,
      cardSlot:    matchedSlot,
      timestamp:   new Date().toISOString(),
      triggeredBy: 'RFID_HARDWARE_SCAN',
    });

    const systemActorId = activeMission.courierId || activeMission.originHospital;

    if (activeMission.status === 'PENDING') {
      await missionService.updateMissionWorkflow(
        activeMission._id.toString(),
        'dispatch',
        systemActorId,
        {}
      );
    }

    await missionService.updateMissionWorkflow(
      activeMission._id.toString(),
      'startTransit',
      systemActorId,
      {}
    );

    return res.status(202).json({
      success: true,
      message: `🚀 Transport AUTO-STARTED! RFID Card ${matchedSlot} scanned`,
      rfid: scannedUid,
      cardSlot: matchedSlot,
      missionId: activeMission.missionId,
      autoStarted: true,
    });

  } catch (error) {
    next(error);
  }
};

export const postLockEvent = async (req, res, next) => {
  try {
    const { relayState, timestamp } = req.body;
    if (!relayState) {
      return res.status(400).json({ success: false, error: 'relayState is required' });
    }

    eventBus.emit(TRANSPORT_EVENTS.LOCK_STATE_CHANGED, {
      boxId:      req.device?.boxId,
      deviceCode: req.device?.code,
      relayState,
      timestamp:  timestamp || new Date().toISOString(),
    });

    // --- Auto-Complete Transport on 2nd RFID Tap ---
    if (relayState === 'UNLOCKED' || relayState === 'UNLOCKED(COMPLETED)') {
      try {
        const activeMission = await TransportMission.findOne({
          status: 'IN_TRANSIT'
        }).sort({ createdAt: -1 });

        if (activeMission) {
          logger.info(`RFID_TRANSPORT_END: Auto-completing mission ${activeMission.missionId} via second RFID tap`);
          
          // Use the mission's courierId or originHospital as a fallback valid ObjectId for actorId if req.device.boxId is string
          const systemActorId = activeMission.courierId || activeMission.originHospital;

          // Step 1: Transition to ARRIVED
          await missionService.updateMissionWorkflow(
            activeMission._id.toString(),
            'arrive',
            systemActorId,
            {}
          );
          
          // Step 2: Transition to COMPLETED
          await missionService.updateMissionWorkflow(
            activeMission._id.toString(),
            'complete',
            systemActorId,
            {}
          );
          
          eventBus.emit('transport:rfid_completed', {
            missionId: activeMission.missionId,
            boxId: req.device?.boxId,
          });
        } else {
          logger.warn(`RFID_TRANSPORT_END: No IN_TRANSIT mission found to auto-complete!`);
        }
      } catch (autoCompleteErr) {
        logger.error(`RFID_TRANSPORT_END ERROR: Failed to auto-complete mission: ${autoCompleteErr.message}`, autoCompleteErr);
      }
    }

    res.status(200).json({ success: true, message: 'Lock event logged' });
  } catch (error) {
    next(error);
  }
};
