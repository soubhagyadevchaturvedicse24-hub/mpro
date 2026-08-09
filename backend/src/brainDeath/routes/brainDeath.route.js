import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  initiateBrainDeathController,
  signBrainDeathRoundController,
  getBrainDeathCertificationController
} from '../controllers/brainDeath.controller.js';

const router = express.Router();

// Initiate brain death certification
router.post(
  '/brain-death/:donorId/initiate',
  requireAuth,
  requirePermission('brain_death.initiate'),
  initiateBrainDeathController
);

// Sign a round
router.post(
  '/brain-death/:certificationId/sign/:round',
  requireAuth,
  requirePermission('brain_death.certify'),
  signBrainDeathRoundController
);

// Get certification by donor
router.get(
  '/brain-death/:donorId',
  requireAuth,
  requirePermission('donor_case.view'),
  getBrainDeathCertificationController
);

export default router;
