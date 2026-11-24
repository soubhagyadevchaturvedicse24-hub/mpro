import express from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { getMissionAuditReport } from '../../transport/controllers/missionReport.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = express.Router();

// ── Public / Protected read routes (used by frontend audit trail) ─────────────
router.get('/blocks',                auditController.getAllBlocks);
router.get('/entity/:type/:id',      auditController.getEntityHistory);
router.get('/verify',                auditController.verifyLedger);
router.get('/verify-block/:blockIndex', auditController.verifyBlock);
router.get('/network-status',        auditController.getNetworkStatus);
router.get('/incidents',             requireAuth, auditController.getIncidents);
router.get('/evidence-report/:id',   auditController.downloadEvidenceReport);
router.get('/mission-report/:missionId', getMissionAuditReport);

// ── Emergency & Tampering ─────────────────────────────────────────────────────
router.post('/incidents/:id/report-emergency', requireAuth, auditController.reportEmergency);
router.post('/incidents/:id/confirm-tamper', requireAuth, auditController.confirmTamper);

// ── Write routes ──────────────────────────────────────────────────────────────
// Direct block write — used by IoT Simulator sequential workflow
router.post('/notarize',             auditController.notarizeBlock);

// Runtime network switcher — switches active blockchain adapter
router.post('/switch-network',       auditController.switchNetwork);

export default router;
