import mongoose from 'mongoose';
import AuthorizationApproval from '../../models/AuthorizationApproval.js';
import Donor from '../../models/Donor.js'; 
import { logAuthorizationEvent } from '../../utils/auditLogger.js'; 

export const createAuthorizationApproval = async (payload, userId) => {
  const { donorId, committeeType, hearingDate, decision, remarks, orderDocumentUrl } = payload;

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(donorId)) {
    const err = new Error('INVALID_DONOR_ID');
    err.code = 'INVALID_DONOR_ID';
    err.status = 400;
    throw err;
  }

  const donor = await Donor.findById(donorId).populate('hospitalId');
  if (!donor) {
    const err = new Error('DONOR_NOT_FOUND');
    err.code = 'DONOR_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (donor.donorType !== 'LIVING') {
    const err = new Error('ONLY_LIVING_DONORS_REQUIRE_AC_APPROVAL');
    err.code = 'ONLY_LIVING_DONORS_REQUIRE_AC_APPROVAL';
    err.status = 400;
    throw err;
  }

  if (!['NON_NEAR_RELATIVE', 'FOREIGN_NATIONAL'].includes(donor.relationshipType)) {
    const err = new Error('AC_APPROVAL_NOT_REQUIRED_FOR_THIS_RELATIONSHIP');
    err.code = 'AC_APPROVAL_NOT_REQUIRED_FOR_THIS_RELATIONSHIP';
    err.status = 400;
    throw err;
  }

  // Check existing approval
  const existing = await AuthorizationApproval.findOne({ donorId });
  if (existing) {
    const err = new Error('APPROVAL_ALREADY_EXISTS');
    err.code = 'APPROVAL_ALREADY_EXISTS';
    err.status = 409;
    throw err;
  }

  const approval = new AuthorizationApproval({
    donorId,
    hospitalId: donor.hospitalId,
    committeeType,
    hearingDate: new Date(hearingDate),
    decision,
    remarks,
    orderDocumentUrl,
    createdBy: userId
  });

  await approval.save();

  // Update donor doc
  donor.authorizationApprovalId = approval._id;
  donor.authorizationStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  await donor.save();

  // Audit log
  const eventType = decision === 'APPROVED'
    ? 'AUTHORIZATION_COMMITTEE_APPROVAL_GRANTED'
    : 'AUTHORIZATION_COMMITTEE_APPROVAL_REJECTED';

  try {
    await logAuthorizationEvent({
      eventType,
      donorId: donor._id.toString(),
      hospitalId: donor.hospitalId._id ? donor.hospitalId._id.toString() : donor.hospitalId.toString(),
      actorId: userId,
      payload: {
        approvalId: approval._id.toString(),
        committeeType,
        decision,
        hearingDate: new Date(hearingDate).toISOString()
      }
    });
  } catch (auditErr) {
    console.error('Audit log failed for authorization approval', auditErr);
  }

  return approval;
};

export const getAuthorizationApprovalById = async (approvalId) => {
  const approval = await AuthorizationApproval.findById(approvalId).populate('donorId', 'donorType relationshipType');
  if (!approval) {
    const err = new Error('APPROVAL_NOT_FOUND');
    err.code = 'APPROVAL_NOT_FOUND';
    err.status = 404;
    throw err;
  }
  return approval;
};

export const listAuthorizationApprovals = async (filters) => {
  const query = {};
  if (filters.hospitalId) query.hospitalId = filters.hospitalId;
  if (filters.donorId) query.donorId = filters.donorId;
  if (filters.decision) query.decision = filters.decision;

  return AuthorizationApproval.find(query).sort({ createdAt: -1 });
};
