import * as missionService from '../services/mission.service.js';
import logger from '../../logger/index.js';

// Roles that have global admin visibility across all transports
const NODAL_ROLES = new Set([
  'PLATFORM_ADMIN',
  'NOTTO_OFFICER',
  'ROTTO_SOTTO_OFFICER',
  'TRANSPORT_COORDINATOR',
  'APPROPRIATE_AUTHORITY',
  'AUDITOR',
]);

/**
 * POST /api/v1/transport/missions
 * Access is controlled by requirePermission(TRANSPORT_PERMISSIONS.CREATE_MISSION)
 * in the route definition. Any role with mission:create permission may proceed.
 */
export const createMission = async (req, res, next) => {
  try {
    const { sub } = req.user;
    const mission = await missionService.createMission(req.body, sub);
    res.status(201).json({ success: true, data: { mission } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/transport/missions/:missionId
 * Edit scheduled mission specifications (organType, patientName, priority, destination, etc.)
 */
export const updateMission = async (req, res, next) => {
  try {
    const { sub } = req.user;
    const mission = await missionService.updateMissionDetails(req.params.missionId, req.body, sub);
    res.status(200).json({ success: true, data: { mission } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/transport/missions
 * Multi-tenant isolation:
 *   - Nodal Officers → all missions globally
 *   - Hospital users → only missions where originHospital OR destinationHospital matches their hospitalId
 */
export const listMissions = async (req, res, next) => {
  try {
    const { role, hospitalId } = req.user;
    const isNodalAdmin = NODAL_ROLES.has(role);

    const result = await missionService.listMissions({ isNodalAdmin, hospitalId });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/transport/missions/:missionId
 * Multi-tenant isolation:
 *   - Nodal Officers → any mission
 *   - Hospital users → only if their hospitalId matches originHospital or destinationHospital
 */
export const getMission = async (req, res, next) => {
  try {
    const { role, hospitalId, sub } = req.user;
    const isNodalAdmin = NODAL_ROLES.has(role);

    const mission = await missionService.getMissionById(req.params.missionId);

    // Tenant isolation check for hospital users
    if (!isNodalAdmin) {
      const originId = mission.originHospital?._id?.toString() || mission.originHospital?.toString();
      const destId = mission.destinationHospital?._id?.toString() || mission.destinationHospital?.toString();
      const userHospId = hospitalId?.toString();

      if (!userHospId || (originId !== userHospId && destId !== userHospId)) {
        logger.warn(`MISSION_ACCESS_DENIED: User [${sub}] role [${role}] tried to access mission [${req.params.missionId}] — not their hospital's transport.`);
        return res.status(403).json({
          success: false,
          error: 'MISSION_ACCESS_DENIED',
          message: 'You may only view transport missions that originate from or are destined for your hospital.',
        });
      }
    }

    res.status(200).json({ success: true, data: { mission } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/transport/missions/:missionId/workflow/:action
 * Workflow action enforcement:
 *   - dispatch/startTransit: only origin hospital or nodal admin
 *   - arrive/complete:       only destination hospital or nodal admin
 *   - cancel:                only nodal admin
 */
export const updateMissionWorkflow = async (req, res, next) => {
  try {
    const { action } = req.params;
    const { role, hospitalId, sub } = req.user;
    const isNodalAdmin = NODAL_ROLES.has(role);

    // Fetch mission for ownership validation
    const mission = await missionService.getMissionById(req.params.missionId);
    const originId = mission.originHospital?._id?.toString() || mission.originHospital?.toString();
    const destId = mission.destinationHospital?._id?.toString() || mission.destinationHospital?.toString();
    const userHospId = hospitalId?.toString();

    if (!isNodalAdmin) {
      const isPartyToMission = (originId === userHospId) || (destId === userHospId);
      if (!isPartyToMission) {
        return res.status(403).json({
          success: false,
          error: 'MISSION_ACCESS_DENIED',
          message: `Only participating hospitals in this transport route (${mission.originHospital?.name || originId} → ${mission.destinationHospital?.name || destId}) may update its workflow.`,
        });
      }

      // Cancel is Nodal-only
      if (action === 'cancel') {
        return res.status(403).json({
          success: false,
          error: 'CANCEL_DENIED',
          message: 'Only a Nodal Officer (NOTTO / ROTTO / SOTTO) may cancel a transport mission.',
        });
      }
    }

    const locationInfo = req.body.location || {};
    const updatedMission = await missionService.updateMissionWorkflow(req.params.missionId, action, sub, locationInfo);
    res.status(200).json({ success: true, data: { mission: updatedMission } });
  } catch (error) {
    next(error);
  }
};

export const getActiveShipments = async (req, res, next) => {
  try {
    const shipments = await missionService.getActiveShipments();
    res.status(200).json(shipments);
  } catch (error) {
    next(error);
  }
};
