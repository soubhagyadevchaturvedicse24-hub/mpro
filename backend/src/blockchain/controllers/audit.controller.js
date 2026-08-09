import { getBlockchainAdapter }           from '../subscribers/audit.subscriber.js';
import { BlockchainAdapterFactory }       from '../adapters/BlockchainAdapterFactory.js';
import crypto from 'crypto';
import LedgerBlock from '../../models/LedgerBlock.js';

// ── GET /api/v1/audit/blocks ─────────────────────────────────────────────────
export const getAllBlocks = async (req, res, next) => {
  try {
    const activeType = BlockchainAdapterFactory.getCurrentType();

    // We used to filter blocks here to strictly require `txHash` for Ethereum mode.
    // However, if the adapter falls back to MongoDB-only (e.g., when the node is offline),
    // those fallback blocks would be completely hidden from the UI, causing an empty screen.
    // The UI already shows a special "On-Chain" badge for blocks that DO have a txHash,
    // so it's better to return all blocks to preserve the audit trail.
    let query = {};

    const blocks = await LedgerBlock.find(query).sort({ blockIndex: -1 }).limit(300);
    res.status(200).json({ success: true, data: blocks });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/audit/entity/:type/:id ──────────────────────────────────────
export const getEntityHistory = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entityType   = type.charAt(0).toUpperCase() + type.slice(1);
    const adapter      = getBlockchainAdapter();
    const history      = await adapter.getHistory(entityType, id);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/audit/verify ─────────────────────────────────────────────────
export const verifyLedger = async (req, res, next) => {
  try {
    const adapter = getBlockchainAdapter();
    const result  = await adapter.verify();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/audit/verify-block/:blockIndex ───────────────────────────────
export const verifyBlock = async (req, res, next) => {
  try {
    const { blockIndex } = req.params;
    const block = await LedgerBlock.findOne({ blockIndex: parseInt(blockIndex, 10) });
    if (!block) {
      return res.status(404).json({ success: false, message: `Block #${blockIndex} not found` });
    }

    const payloadString      = JSON.stringify(block.payload);
    const expectedPayloadSHA = crypto.createHash('sha256').update(payloadString).digest('hex');
    const activeAdapter      = BlockchainAdapterFactory.getCurrentType();
    const channelName        = activeAdapter === 'ethereum' || activeAdapter === 'ganache'
      ? 'ganache-local'
      : 'organchannel';

    res.status(200).json({
      blockNumber          : block.blockIndex,
      channelName,
      transactionId        : block.hash,
      smartContractMethod  : block.eventType,
      activeNetwork        : activeAdapter,
      proofs: {
        arweaveTxId        : block.arweaveTxId || null,
        ethereumTxHash     : block.payload?._ethereum?.txHash || null,
        expectedPayloadSHA256: expectedPayloadSHA,
        timestamp          : block.timestamp,
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/audit/notarize ───────────────────────────────────────────────
export const notarizeBlock = async (req, res, next) => {
  try {
    const {
      eventType,
      entityType = 'TransportMission',
      entityId   = 'TRN-2026-001',
      payload    = {}
    } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, message: 'eventType is required' });
    }

    const adapter = getBlockchainAdapter();
    const block   = await adapter.append(eventType, entityType, entityId.toString(), payload);

    res.status(201).json({
      success: true,
      block: {
        blockIndex   : block.blockIndex,
        hash         : block.hash,
        previousHash : block.previousHash,
        eventType    : block.eventType,
        timestamp    : block.timestamp,
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/audit/switch-network ────────────────────────────────────────
export const switchNetwork = async (req, res, next) => {
  try {
    const { network } = req.body;
    const allowed     = ['mini', 'ethereum', 'ganache', 'fabric', 'hyperledger'];

    if (!network || !allowed.includes(network.toLowerCase())) {
      return res.status(400).json({
        success : false,
        message : `Invalid network. Allowed: ${allowed.join(', ')}`,
      });
    }

    BlockchainAdapterFactory.switchAdapter(network);

    res.status(200).json({
      success       : true,
      activeNetwork : BlockchainAdapterFactory.getCurrentType(),
      message       : `Blockchain adapter switched to "${network}"`,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/audit/network-status ─────────────────────────────────────────
export const getNetworkStatus = async (req, res, next) => {
  try {
    const adapter      = getBlockchainAdapter();
    const currentType  = BlockchainAdapterFactory.getCurrentType();

    let details = {
      adapter  : currentType,
      network  : currentType === 'ethereum' || currentType === 'ganache'
        ? 'Ethereum (Ganache Local)'
        : currentType === 'fabric' || currentType === 'hyperledger'
          ? 'Hyperledger Fabric (Simulated)'
          : 'NeoLife MiniChain (MongoDB)',
    };

    // If Ethereum adapter, get live status
    if ((currentType === 'ethereum' || currentType === 'ganache') && adapter.getNetworkStatus) {
      const status = await adapter.getNetworkStatus();
      details = { ...details, ...status };
    }

    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/audit/incidents ──────────────────────────────────────────────
export const getIncidents = async (req, res, next) => {
  try {
    const { role, hospitalId } = req.user;
    const NODAL_ROLES = new Set(['PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER', 'ADMIN', 'AUDITOR']);
    const isNodalAdmin = NODAL_ROLES.has(role);

    // We only want alert-related events
    const alertEventTypes = ['telemetry.alert', 'transport.health_status_changed'];

    let query = { eventType: { $in: alertEventTypes } };

    if (!isNodalAdmin) {
      if (!hospitalId) {
        return res.status(403).json({ success: false, message: 'Hospital context required for this user' });
      }

      // Dynamically import TransportMission to avoid circular deps at the top level
      const { default: TransportMission } = await import('../../models/TransportMission.js');

      // Find all missions belonging to this hospital
      const missions = await TransportMission.find({
        $or: [{ originHospital: hospitalId }, { destinationHospital: hospitalId }]
      }).select('_id');

      const missionIds = missions.map(m => m._id.toString());
      query.entityId = { $in: missionIds };
    }

    const incidents = await LedgerBlock.find(query).sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/audit/incidents/:id/report-emergency ──────────────────────
export const reportEmergency = async (req, res, next) => {
  try {
    const { id } = req.params; // Mission ID
    const { reason } = req.body;
    const adapter = getBlockchainAdapter();

    const payload = {
      _severity: 'WARNING',
      _summary: reason || 'Manual emergency reported by Liaison Officer.',
      _alertType: 'MANUAL_EMERGENCY'
    };

    const block = await adapter.append('telemetry.alert', 'TransportMission', id.toString(), payload);

    // Flag the mission as having a WARNING anomaly
    const { default: TransportMission } = await import('../../models/TransportMission.js');
    await TransportMission.findOneAndUpdate(
      { missionId: id },
      { $set: { 'health.status': 'WARNING' } }
    );

    res.status(201).json({
      success: true,
      message: 'Emergency reported and notarized on blockchain.',
      data: block
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/audit/incidents/:id/confirm-tamper ────────────────────────
export const confirmTamper = async (req, res, next) => {
  try {
    const { id } = req.params; // Mission ID
    const { notes } = req.body;
    const adapter = getBlockchainAdapter();

    const payload = {
      _severity: 'CRITICAL',
      _summary: notes || 'Tampering verified and confirmed by Nodal Authority.',
      _alertType: 'TAMPER_CONFIRMED'
    };

    const block = await adapter.append('telemetry.alert_TAMPER', 'TransportMission', id.toString(), payload);

    // Flag the mission as having a CRITICAL anomaly
    const { default: TransportMission } = await import('../../models/TransportMission.js');
    await TransportMission.findOneAndUpdate(
      { missionId: id },
      { $set: { 'health.status': 'CRITICAL' } }
    );

    res.status(201).json({
      success: true,
      message: 'Tampering confirmed and notarized on blockchain.',
      data: block
    });
  } catch (error) {
    next(error);
  }
};
