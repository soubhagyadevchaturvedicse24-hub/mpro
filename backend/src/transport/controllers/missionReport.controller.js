import TransportMission from '../../models/TransportMission.js';
import TelemetryLog from '../../models/TelemetryLog.js';
import LedgerBlock from '../../models/LedgerBlock.js';
import logger from '../../logger/index.js';

/**
 * Severity label + color mapping from the blockchain _blockType field.
 * Mirrors the ALERT_TYPES constants from the audit subscriber.
 */
const SEVERITY_MAP = {
  TELEMETRY_ALERT__TEMP_HIGH:     { severity: 'WARNING',  label: 'Temperature Too High',   color: 'amber' },
  TELEMETRY_ALERT__TEMP_LOW:      { severity: 'WARNING',  label: 'Temperature Too Low',    color: 'amber' },
  TELEMETRY_ALERT__TEMP_ANOMALY:  { severity: 'WARNING',  label: 'Temperature Anomaly',    color: 'amber' },
  TELEMETRY_ALERT__TAMPER:        { severity: 'CRITICAL', label: 'Container Tampered',     color: 'red'   },
  TELEMETRY_ALERT__BATTERY_LOW:   { severity: 'WARNING',  label: 'Battery Low',            color: 'amber' },
  TELEMETRY_ALERT__MULTI:         { severity: 'WARNING',  label: 'Multiple Alerts',        color: 'amber' },
  HEALTH_STATUS__CRITICAL:        { severity: 'CRITICAL', label: 'Mission Health Critical', color: 'red'  },
  HEALTH_STATUS__WARNING:         { severity: 'WARNING',  label: 'Mission Health Warning',  color: 'amber' },
  MANUAL_EMERGENCY:               { severity: 'CRITICAL', label: 'Manual Emergency Filed',  color: 'red'  },
  TAMPER_CONFIRMED:               { severity: 'CRITICAL', label: 'Tampering Confirmed',     color: 'red'  },
};

const LIFECYCLE_EVENTS = new Set([
  'transport.created', 'transport.dispatched', 'transport.started',
  'transport.arrived', 'transport.completed', 'transport.cancelled',
  'TRANSPORT_CREATED', 'TRANSPORT_DISPATCHED', 'TRANSPORT_STARTED',
  'TRANSPORT_ARRIVED', 'TRANSPORT_COMPLETED', 'TRANSPORT_CANCELLED',
]);

const LIFECYCLE_LABEL = {
  'transport.created':    { label: 'Mission Created & Registered',      color: 'blue' },
  'transport.dispatched': { label: 'Dispatched from Origin Hospital',   color: 'blue' },
  'transport.started':    { label: 'Transit Started — Cold Chain Active', color: 'blue' },
  'transport.arrived':    { label: 'Arrived at Destination Hospital',   color: 'emerald' },
  'transport.completed':  { label: 'Transport Completed & Verified',    color: 'emerald' },
  'transport.cancelled':  { label: 'Transport Cancelled',               color: 'red' },
};

const normalizeEventKey = (et) => et.toLowerCase().replace('_', '.');

/**
 * GET /api/v1/audit/mission-report/:missionId
 *
 * missionId can be:
 *   - MongoDB ObjectId string (e.g. "507f1f77bcf86cd799439011")
 *   - Mission ID string (e.g. "TRN-2026-001")
 *
 * Returns a structured JSON audit report with:
 *   - mission metadata
 *   - lifecycle blockchain events (ordered, with real timestamps & hashes)
 *   - anomaly blockchain events (each with block hash for admin verification)
 *   - telemetry samples (temperature readings over time)
 *   - summary statistics (avg temp, min/max, tamper count, etc.)
 */
export const getMissionAuditReport = async (req, res, next) => {
  try {
    const { missionId } = req.params;

    // ── 1. Resolve Mission ────────────────────────────────────────────────────
    const mission = await TransportMission.findOne({
      $or: [
        { missionId },
        ...(missionId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: missionId }] : [])
      ]
    }).populate('originHospital destinationHospital boxId');

    if (!mission) {
      return res.status(404).json({ success: false, message: `Mission '${missionId}' not found` });
    }

    const missionObjId = mission._id.toString();
    const missionStrId = mission.missionId;
    const boxObjId = mission.boxId?._id ? mission.boxId._id.toString() : null;
    const boxCode = mission.boxId?.boxId || null;

    // ── 2. Fetch Blockchain Blocks for this Mission ───────────────────────────
    const entityIds = [
      missionObjId,
      missionStrId,
      ...(boxObjId ? [boxObjId] : []),
      ...(boxCode ? [boxCode] : []),
      ...(mission.organId ? [mission.organId.toString()] : []),
    ];

    const blocks = await LedgerBlock.find({
      entityId: { $in: entityIds }
    }).sort({ blockIndex: 1 }).lean();

    // ── 3. Fetch Telemetry Logs ───────────────────────────────────────────────
    const telemetryLogs = await TelemetryLog.find({
      $or: [
        { missionId: mission._id },
        ...(boxObjId ? [{ boxId: mission.boxId._id }] : [])
      ]
    }).sort({ timestamp: 1 }).lean();

    // ── 4. Classify Blocks ────────────────────────────────────────────────────
    const lifecycleBlocks = [];
    const anomalyBlocks = [];
    const telemetryBlocks = []; // TELEMETRY_RECEIVED blocks (for chain proof)

    for (const block of blocks) {
      const evtKey = normalizeEventKey(block.eventType);
      const blockType = block.payload?._blockType || '';

      if (LIFECYCLE_EVENTS.has(block.eventType) || LIFECYCLE_EVENTS.has(evtKey)) {
        const meta = LIFECYCLE_LABEL[evtKey] || LIFECYCLE_LABEL[block.eventType] || { label: block.eventType, color: 'blue' };
        lifecycleBlocks.push({
          blockIndex:  block.blockIndex,
          hash:        block.hash,
          previousHash: block.previousHash,
          arweaveTxId: block.arweaveTxId || null,
          timestamp:   block.timestamp,
          eventType:   block.eventType,
          label:       meta.label,
          color:       meta.color,
          type:        'lifecycle',
        });
      } else if (
        block.eventType.includes('alert') ||
        block.eventType.includes('ALERT') ||
        block.eventType.includes('health') ||
        block.eventType.includes('HEALTH') ||
        block.payload?._severity ||
        block.payload?._alertType
      ) {
        // Anomaly block — has a real hash for admin verification
        const btMeta = SEVERITY_MAP[blockType] || SEVERITY_MAP[block.payload?._alertType] || null;
        const severity = block.payload?._severity || btMeta?.severity || 'WARNING';
        const label = btMeta?.label || block.payload?._summary || block.eventType;
        const color = btMeta?.color || (severity === 'CRITICAL' ? 'red' : 'amber');

        const alertDetails = block.payload?.alertDetails || {};
        let extractedTemp = alertDetails.temperature ?? block.payload?.telemetry?.temperature ?? null;
        let extractedBat = alertDetails.batteryLevel ?? block.payload?.telemetry?.batteryLevel ?? null;
        let extractedTamper = alertDetails.isTampered ?? block.payload?.telemetry?.isTampered ?? (
          blockType === 'TELEMETRY_ALERT__TAMPER' || 
          block.payload?._alertType === 'TELEMETRY_ALERT__TAMPER' || 
          block.payload?._summary?.toLowerCase().includes('tamper') ||
          false
        );

        if (extractedTemp === null && block.payload?._summary) {
          const m = block.payload._summary.match(/Temperature\s+(?:high|low|anomaly):\s*([0-9.]+)/i);
          if (m) extractedTemp = parseFloat(m[1]);
        }
        if (extractedBat === null && block.payload?._summary) {
          const m = block.payload._summary.match(/Battery\s+low:\s*([0-9.]+)/i);
          if (m) extractedBat = parseFloat(m[1]);
        }

        anomalyBlocks.push({
          blockIndex:   block.blockIndex,
          hash:         block.hash,
          previousHash: block.previousHash,
          arweaveTxId:  block.arweaveTxId || null,
          timestamp:    block.timestamp,
          eventType:    block.eventType,
          blockType,
          severity,
          label,
          color,
          summary:      block.payload?._summary || label,
          alertType:    block.payload?._alertType || blockType,
          details: {
            temperature:  extractedTemp,
            batteryLevel: extractedBat,
            isTampered:   Boolean(extractedTamper),
            messages:     alertDetails.messages ?? (block.payload?._summary ? [block.payload._summary] : []),
          },
          type: 'anomaly',
        });
      } else if (block.eventType === 'TELEMETRY_RECEIVED' || block.eventType === 'telemetry.received') {
        telemetryBlocks.push(block);
      }
    }

    // ── 5. Build Telemetry Samples from TelemetryLog collection ──────────────
    const telemetrySamples = telemetryLogs.map(log => ({
      timestamp:    log.timestamp,
      temperature:  log.telemetry.temperature,
      batteryLevel: log.telemetry.batteryLevel,
      isTampered:   log.telemetry.isTampered,
      lat: log.telemetry.geoLocation?.coordinates?.[1] || null,
      lng: log.telemetry.geoLocation?.coordinates?.[0] || null,
    }));

    // ── 6. Compute Summary Statistics ─────────────────────────────────────────
    const temps = telemetrySamples.map(s => s.temperature).filter(t => t !== null && !isNaN(t));
    const batteries = telemetrySamples.map(s => s.batteryLevel).filter(b => b !== null && !isNaN(b));
    const tamperCount = anomalyBlocks.filter(b =>
      b.blockType === 'TELEMETRY_ALERT__TAMPER' ||
      b.blockType === 'TAMPER_CONFIRMED' ||
      b.details?.isTampered
    ).length;

    const avgTemp    = temps.length ? +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2) : null;
    const minTemp    = temps.length ? +Math.min(...temps).toFixed(2) : null;
    const maxTemp    = temps.length ? +Math.max(...temps).toFixed(2) : null;
    const startBat   = batteries.length ? batteries[0] : null;
    const endBat     = batteries.length ? batteries[batteries.length - 1] : null;
    const batDrain   = (startBat !== null && endBat !== null) ? +(startBat - endBat).toFixed(1) : null;

    const stats = {
      totalBlocks:    blocks.length,
      lifecycleCount: lifecycleBlocks.length,
      anomalyCount:   anomalyBlocks.length,
      telemetrySampleCount: telemetrySamples.length,
      tamperCount,
      avgTemp,
      minTemp,
      maxTemp,
      startBattery: startBat,
      endBattery:   endBat,
      batteryDrain: batDrain,
      criticalCount: anomalyBlocks.filter(b => b.severity === 'CRITICAL').length,
      warningCount:  anomalyBlocks.filter(b => b.severity === 'WARNING').length,
    };

    // ── 7. Mission Metadata ───────────────────────────────────────────────────
    const missionMeta = {
      missionId:     mission.missionId,
      _id:           mission._id,
      status:        mission.status,
      origin:        mission.originHospital?.name || 'Unknown',
      destination:   mission.destinationHospital?.name || 'Unknown',
      boxId:         mission.boxId?.boxId || null,
      organType:     mission.organType || mission.organId?.organType || 'Kidney',
      transportType: mission.transportType || 'Organ Transport',
      patientName:   mission.patientName || null,
      priority:      mission.priority || 'High',
      actualDepartureTime: mission.actualDepartureTime || null,
      actualArrivalTime:   mission.actualArrivalTime || null,
      health:        mission.health || {},
    };

    logger.info(`AUDIT_REPORT: Generated report for mission ${missionStrId} — ${blocks.length} blocks, ${anomalyBlocks.length} anomalies`);

    return res.status(200).json({
      success: true,
      data: {
        mission:         missionMeta,
        lifecycleBlocks,
        anomalyBlocks,
        telemetrySamples,
        stats,
      }
    });

  } catch (error) {
    logger.error(`AUDIT_REPORT Error: ${error.message}`);
    next(error);
  }
};
