/**
 * audit.subscriber.js — Enhanced
 * ────────────────────────────────
 * Listens to the domain event bus and notarises every significant event
 * to the active blockchain adapter.
 *
 * KEY FIX: Uses getBlockchainAdapter() dynamically on every event instead of
 * capturing the adapter instance once at startup. This ensures that after
 * a runtime network switch, new blocks go to the correct adapter.
 *
 * ALERT TYPES:
 *   telemetry.alert  → structured into sub-types (TEMP_HIGH, TAMPER, BATTERY_LOW…)
 *   health_status_changed → mission health degradation
 */

import { eventBus }           from '../../domain/events/index.js';
import { DONOR_EVENTS }       from '../../domain/events/donor.events.js';
import { ORGAN_EVENTS }       from '../../domain/events/organ.events.js';
import { MATCHING_EVENTS }    from '../../domain/events/matching.events.js';
import { TRANSPORT_EVENTS }   from '../../domain/events/transport.events.js';
import { getBlockchainAdapter } from '../adapters/BlockchainAdapterFactory.js';
import logger                 from '../../logger/index.js';

// ── Alert type constants (used by frontend for colour coding) ─────────────────
export const ALERT_TYPES = Object.freeze({
  TEMP_HIGH    : 'TELEMETRY_ALERT__TEMP_HIGH',
  TEMP_LOW     : 'TELEMETRY_ALERT__TEMP_LOW',
  TEMP_ANOMALY : 'TELEMETRY_ALERT__TEMP_ANOMALY',
  TAMPER       : 'TELEMETRY_ALERT__TAMPER',
  BATTERY_LOW  : 'TELEMETRY_ALERT__BATTERY_LOW',
  MULTI_ALERT  : 'TELEMETRY_ALERT__MULTI',
  HEALTH_CRITICAL : 'HEALTH_STATUS__CRITICAL',
  HEALTH_WARNING  : 'HEALTH_STATUS__WARNING',
});

export const initializeAuditSubscriber = () => {

  /**
   * Generic subscriber factory.
   * NOTE: Calls getBlockchainAdapter() INSIDE the event handler each time,
   * so it always picks up the currently active adapter after a hot-switch.
   */
  const subscribe = (eventName, entityType, idExtractor, payloadTransformer = null) => {
    eventBus.on(eventName, async (payload) => {
      try {
        const adapter  = getBlockchainAdapter(); // <-- dynamic, not cached
        const entityId = idExtractor(payload);
        if (!entityId) {
          logger.warn(`Audit Subscriber: no entityId for ${eventName}`);
          return;
        }
        const finalPayload = payloadTransformer ? payloadTransformer(payload) : payload;
        await adapter.append(eventName, entityType, entityId.toString(), finalPayload);
      } catch (error) {
        logger.error(`Audit Subscriber: failed to notarise ${eventName} — ${error.message}`);
      }
    });
  };

  // ── Donor ───────────────────────────────────────────────────────────────────
  subscribe(DONOR_EVENTS.DONOR_CREATED,          'Donor', p => p.donorId);
  subscribe(DONOR_EVENTS.DONOR_CONSENT_VERIFIED, 'Donor', p => p.donorId);

  // ── Organ ───────────────────────────────────────────────────────────────────
  subscribe(ORGAN_EVENTS.ORGAN_REGISTERED,         'Organ', p => p.organId);
  subscribe(ORGAN_EVENTS.ORGAN_ALLOCATED,          'Organ', p => p.organId);
  subscribe(ORGAN_EVENTS.ORGAN_ASSESSMENT_STARTED, 'Organ', p => p.organId);
  subscribe(ORGAN_EVENTS.ORGAN_VIABILITY_APPROVED, 'Organ', p => p.organId);
  subscribe(ORGAN_EVENTS.ORGAN_DISPATCHED,         'Organ', p => p.organId);

  // ── Matching ─────────────────────────────────────────────────────────────────
  subscribe(MATCHING_EVENTS.MATCHING_TRIGGERED, 'Match', p => p.matchId);
  subscribe(MATCHING_EVENTS.MATCH_ACCEPTED,     'Match', p => p.matchId);

  // ── Common transport ID extractor ────────────────────────────────────────────
  const extractMissionId = p =>
    p?.missionId || p?.id || p?.boxId || 'TRN-UNKNOWN';

  // ── Transport lifecycle ───────────────────────────────────────────────────────
  subscribe(TRANSPORT_EVENTS.TRANSPORT_CREATED,    'TransportMission', extractMissionId);
  subscribe(TRANSPORT_EVENTS.TRANSPORT_DISPATCHED, 'TransportMission', extractMissionId);
  subscribe(TRANSPORT_EVENTS.TRANSPORT_STARTED,    'TransportMission', extractMissionId);
  subscribe(TRANSPORT_EVENTS.TRANSPORT_ARRIVED,    'TransportMission', extractMissionId);
  subscribe(TRANSPORT_EVENTS.TRANSPORT_COMPLETED,  'TransportMission', extractMissionId);
  subscribe(TRANSPORT_EVENTS.TRANSPORT_CANCELLED,  'TransportMission', extractMissionId);

  // ── Hardware Lock & RFID Audit Notarization ─────────────────────────────────
  subscribe(TRANSPORT_EVENTS.RFID_ACCESS_ATTEMPT, 'TransportBox', extractMissionId,
    p => ({
      ...p,
      _blockType : 'RFID_ACCESS_ATTEMPT',
      _summary   : `🔑 RFID Access Verified — Card Tag [${p.rfid}] (Slot ${p.cardSlot || '?'}) scanned on Box ${p.boxId || p.deviceCode || 'BOX-001'}`,
    })
  );

  subscribe(TRANSPORT_EVENTS.RFID_TRANSPORT_STARTED, 'TransportMission', extractMissionId,
    p => ({
      ...p,
      _blockType : 'RFID_TRANSPORT_STARTED',
      _summary   : `🚀 Transport AUTO-STARTED via RFID — Card ${p.cardSlot} [${p.rfid}] triggered Mission ${p.missionId}`,
      _severity  : 'SUCCESS',
    })
  );

  subscribe(TRANSPORT_EVENTS.LOCK_STATE_CHANGED, 'TransportBox', extractMissionId,
    p => ({
      ...p,
      _blockType : 'LOCK_STATE_CHANGED',
      _summary   : `🔒 Lock Hardware Event — Relay state set to ${p.relayState} on Box ${p.boxId || p.deviceCode || 'BOX-001'}`,
    })
  );

  // ── Normal Telemetry (simulator running → shows as green "Normal Telemetry" block) ──
  subscribe(TRANSPORT_EVENTS.TELEMETRY_RECEIVED, 'TransportMission', extractMissionId,
    p => ({
      ...p,
      _blockType : 'TELEMETRY_NORMAL',
      _summary   : `Temp: ${p.telemetry?.temperature?.toFixed(1) ?? '?'}°C | Battery: ${p.telemetry?.batteryLevel?.toFixed(1) ?? '?'}% | Location: ${p.location?.coordinates?.join(', ') ?? 'unknown'}`,
    })
  );

  // ── Alert Telemetry ─────────────────────────────────────────────────────────
  // Each alert gets its OWN dedicated blockchain block with a specific type tag
  // so the frontend can colour-code by alert category.
  subscribe(TRANSPORT_EVENTS.TELEMETRY_ALERT, 'TransportMission', extractMissionId,
    p => {
      const { alerts = [], telemetry = {} } = p;
      const alertStr = alerts.join(' | ');

      // Determine the most severe alert type for this event
      let alertType = ALERT_TYPES.MULTI_ALERT;
      if (alerts.length === 1) {
        if (alertStr.includes('Tamper'))        alertType = ALERT_TYPES.TAMPER;
        else if (alertStr.includes('high'))     alertType = ALERT_TYPES.TEMP_HIGH;
        else if (alertStr.includes('low') && alertStr.includes('Temp')) alertType = ALERT_TYPES.TEMP_LOW;
        else if (alertStr.includes('Battery'))  alertType = ALERT_TYPES.BATTERY_LOW;
      } else {
        // Multiple alerts at once — check for most critical
        if (alertStr.includes('Tamper'))        alertType = ALERT_TYPES.TAMPER;
        else if (alertStr.includes('Temperature')) alertType = ALERT_TYPES.TEMP_ANOMALY;
      }

      return {
        ...p,
        _blockType : alertType,
        _alertType : alertType,
        _summary   : alertStr,
        _severity  : alertStr.includes('Tamper') ? 'CRITICAL' : 'WARNING',
        alertDetails: {
          temperature  : telemetry.temperature,
          batteryLevel : telemetry.batteryLevel,
          isTampered   : telemetry.isTampered,
          messages     : alerts,
        },
      };
    }
  );

  // ── Health Status Change ──────────────────────────────────────────────────────
  // Emitted when mission health transitions to WARNING or CRITICAL
  subscribe(TRANSPORT_EVENTS.HEALTH_STATUS_CHANGED, 'TransportMission', extractMissionId,
    p => ({
      ...p,
      _blockType : p.health?.status === 'CRITICAL'
        ? ALERT_TYPES.HEALTH_CRITICAL
        : ALERT_TYPES.HEALTH_WARNING,
      _alertType : p.health?.status === 'CRITICAL'
        ? ALERT_TYPES.HEALTH_CRITICAL
        : ALERT_TYPES.HEALTH_WARNING,
      _severity  : p.health?.status || 'WARNING',
      _summary   : `Mission health → ${p.health?.status} (score: ${p.health?.score}). Reasons: ${p.health?.reasons?.join(', ') || 'none'}`,
    })
  );

  logger.info('✅  Audit Subscriber initialized — dynamic adapter, full alert coverage.');
};

// Re-export for controller usage
export { getBlockchainAdapter } from '../adapters/BlockchainAdapterFactory.js';
