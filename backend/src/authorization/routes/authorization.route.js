import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requirePermission, requirePermissionWithScope } from '../../middleware/rbac.js';
import {
  createAuthorizationApprovalController,
  getAuthorizationApprovalController,
  listAuthorizationApprovalsController
} from '../controllers/authorization.controller.js';

const router = express.Router();

// Create AC approval
router.post(
  '/authorization-approvals',
  requireAuth,
  requirePermissionWithScope('authorization_case.approve', null), // permission checked; scope checked in controller
  createAuthorizationApprovalController
);

// List AC approvals
router.get(
  '/authorization-approvals',
  requireAuth,
  requirePermission('authorization_case.view'),
  listAuthorizationApprovalsController
);

// Get single AC approval
router.get(
  '/authorization-approvals/:id',
  requireAuth,
  requirePermission('authorization_case.view'),
  getAuthorizationApprovalController
);

export default router;
