import {
  createAuthorizationApproval,
  getAuthorizationApprovalById,
  listAuthorizationApprovals
} from '../services/authorization.service.js';
import Donor from '../../models/Donor.js';

export const createAuthorizationApprovalController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { donorId, committeeType, hearingDate, decision, remarks, orderDocumentUrl } = req.body;

    if (!donorId || !committeeType || !hearingDate || !decision) {
      return res.status(400).json({
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'donorId, committeeType, hearingDate, and decision are required.'
      });
    }

    if (!['HOSPITAL_AC', 'STATE_AC'].includes(committeeType)) {
      return res.status(400).json({ error: 'INVALID_COMMITTEE_TYPE' });
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'INVALID_DECISION' });
    }

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });
    }

    const user = req.user;
    const hospitalScope = (user.scopes || []).find((s) => s.startsWith('hospital:'));
    const stateScope = (user.scopes || []).find((s) => s.startsWith('state:'));

    if (committeeType === 'HOSPITAL_AC') {
      if (!hospitalScope) {
        return res.status(403).json({ error: 'HOSPITAL_SCOPE_REQUIRED_FOR_HOSPITAL_AC' });
      }
      const [, allowedHospitalId] = hospitalScope.split(':');
      if (donor.hospitalId.toString() !== allowedHospitalId) {
        return res.status(403).json({ error: 'HOSPITAL_SCOPE_MISMATCH' });
      }
    } else if (committeeType === 'STATE_AC') {
      if (!stateScope) {
        return res.status(403).json({ error: 'STATE_SCOPE_REQUIRED_FOR_STATE_AC' });
      }
    } else {
      return res.status(400).json({ error: 'INVALID_COMMITTEE_TYPE' });
    }

    const approval = await createAuthorizationApproval(
      { donorId, committeeType, hearingDate, decision, remarks, orderDocumentUrl },
      userId
    );

    return res.status(201).json({
      approvalId: approval._id.toString(),
      donorId: approval.donorId.toString(),
      hospitalId: approval.hospitalId.toString(),
      committeeType: approval.committeeType,
      decision: approval.decision,
      hearingDate: approval.hearingDate.toISOString(),
      message: 'Authorization approval created successfully.'
    });
  } catch (err) {
    if (err.code === 'INVALID_DONOR_ID' || err.code === 'DONOR_NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: 'Donor not found or invalid.' });
    }
    if (err.code === 'ONLY_LIVING_DONORS_REQUIRE_AC_APPROVAL' ||
        err.code === 'AC_APPROVAL_NOT_REQUIRED_FOR_THIS_RELATIONSHIP') {
      return res.status(400).json({ error: err.code, message: 'AC approval not required for this donor.' });
    }
    if (err.code === 'APPROVAL_ALREADY_EXISTS') {
      return res.status(409).json({ error: err.code, message: 'Approval already exists for this donor.' });
    }
    return next(err);
  }
};

export const getAuthorizationApprovalController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = await getAuthorizationApprovalById(id);

    return res.status(200).json(approval);
  } catch (err) {
    if (err.code === 'APPROVAL_NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: 'Approval not found.' });
    }
    return next(err);
  }
};

export const listAuthorizationApprovalsController = async (req, res, next) => {
  try {
    const { hospitalId, donorId, decision } = req.query;
    const filters = {};
    if (hospitalId) filters.hospitalId = hospitalId;
    if (donorId) filters.donorId = donorId;
    if (decision) filters.decision = decision;

    const approvals = await listAuthorizationApprovals(filters);
    return res.status(200).json(approvals);
  } catch (err) {
    return next(err);
  }
};
