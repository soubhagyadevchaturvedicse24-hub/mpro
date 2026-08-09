/**
 * hospital.route.js
 * All routes for the Hospital domain.
 *
 * Public routes (no auth):
 *   POST /api/hospitals/register          — Submit new hospital registration
 *   GET  /api/hospitals/status/:code      — Check application status by hospital code
 *
 * Authenticated routes (requireAuth):
 *   GET    /api/hospitals                 — List hospitals (with status filter)
 *   POST   /api/hospitals                 — Admin: create hospital directly
 *   GET    /api/hospitals/:id             — Get single hospital details
 *   PATCH  /api/hospitals/:id             — Admin: update hospital (DRAFT only)
 *
 * Workflow routes (requireAuth + requirePermission):
 *   POST /api/hospitals/:id/submit        — Hospital submits for review
 *   POST /api/hospitals/:id/review        — Admin marks under review
 *   POST /api/hospitals/:id/approve       — Admin approves + activates account
 *   POST /api/hospitals/:id/reject        — Admin rejects + disables account
 *   POST /api/hospitals/:id/activate      — Admin activates
 *   POST /api/hospitals/:id/suspend       — Admin suspends
 *   POST /api/hospitals/:id/reactivate    — Admin reactivates
 *   POST /api/hospitals/:id/deactivate    — Admin deactivates
 */

import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller.js';
import { requireAuth }        from '../../middleware/requireAuth.js';
import { requirePermission }  from '../../middleware/requirePermission.js';
import { requirePermission as requireRbacPermission, requirePermissionWithScope } from '../../middleware/rbac.js';
import { uploadHospitalDocs } from '../../middleware/upload.middleware.js';
import { HOSPITAL_PERMISSIONS } from '../../permissions/hospital.permissions.js';

const router = Router();

// ── Public routes (no authentication required) ────────────────────────────────

router.post(
  '/register',
  uploadHospitalDocs,                      // multer: parse multipart + files first
  hospitalController.publicRegisterHospital
);

router.get(
  '/status/:hospitalCode',
  hospitalController.getHospitalStatus
);

// Public list of hospitals (for dropdowns, maps, and mission creation)
router.get(
  '/',
  hospitalController.listHospitals
);

// ── All routes below require authentication ────────────────────────────────────
router.use(requireAuth);

// CRUD
router.post(
  '/',
  requirePermission(HOSPITAL_PERMISSIONS.CREATE),
  hospitalController.createHospital
);

router.get(
  '/admin/hospitals/state',
  requirePermissionWithScope('hospital.view_all', 'state'),
  hospitalController.listHospitalsForStateController
);

router.get(
  '/admin/hospitals/all',
  requirePermissionWithScope('hospital.view_all', 'global'),
  hospitalController.listAllHospitalsController
);

router.get(
  '/:id',
  requirePermission(HOSPITAL_PERMISSIONS.VIEW),
  hospitalController.getHospital
);

router.get(
  '/:id/download-key',
  hospitalController.downloadKey
);

router.patch(
  '/:id',
  requirePermission(HOSPITAL_PERMISSIONS.UPDATE),
  hospitalController.updateHospital
);

// Workflow actions
router.post(
  '/:id/submit',
  requirePermission(HOSPITAL_PERMISSIONS.SUBMIT),
  hospitalController.submitHospital
);

router.post(
  '/:id/review',
  requirePermission(HOSPITAL_PERMISSIONS.APPROVE),
  hospitalController.reviewHospital
);

router.post(
  '/admin/hospitals/:id/approve',
  requireRbacPermission('hospital.approve'),
  hospitalController.approveHospitalController
);

router.post(
  '/:id/reject',
  requirePermission(HOSPITAL_PERMISSIONS.REJECT),
  hospitalController.rejectHospital
);

router.post(
  '/:id/activate',
  requirePermission(HOSPITAL_PERMISSIONS.APPROVE),
  hospitalController.activateHospital
);

router.post(
  '/admin/hospitals/:id/suspend',
  requireRbacPermission('hospital.suspend'),
  hospitalController.suspendHospitalController
);

router.post(
  '/:id/reactivate',
  requirePermission(HOSPITAL_PERMISSIONS.SUSPEND),
  hospitalController.reactivateHospital
);

router.post(
  '/:id/deactivate',
  requirePermission(HOSPITAL_PERMISSIONS.DEACTIVATE),
  hospitalController.deactivateHospital
);

export default router;
