/**
 * hospital.service.js
 * Business logic for the Hospital domain.
 * All state transitions go through the hospitalMachine (no workflow logic in controllers).
 */

import Hospital from '../../models/Hospital.js';
import User     from '../../models/User.js';
import { hospitalMachine }          from '../../workflow/transitions/hospital.transitions.js';
import { HOSPITAL_ERRORS }          from '../../constants/errorCodes.js';
import { generateHospitalCode }     from '../utils/hospitalCode.js';
import { generateAndEncryptKeyPair } from '../../utils/eccKeyPair.util.js';
import { enforcePasswordPolicy }    from '../../utils/passwordPolicy.util.js';
import { sendEmail }                from '../../utils/email.util.js';
import logger from '../../logger/index.js';
import { logHospitalEvent } from '../../utils/auditLogger.js';

// ── Public registration (no auth required) ────────────────────────────────────

/**
 * Creates a User (PENDING_APPROVAL) and a Hospital (PENDING_VERIFICATION)
 * atomically in a single request. Called from the public /register endpoint.
 *
 * @param {object} data — validated publicRegisterSchema payload
 * @param {Array}  documents — mapped uploaded file objects [{ documentType, url }]
 * @returns {{ hospital, hospitalCode }}
 */
export const publicRegisterHospital = async (data, documents = []) => {
  const {
    loginEmail,
    password,
    displayName,
    name,
    hospitalType,
    address,
    contact,
    legalDetails,
    ...rest
  } = data;

  // 1. Enforce password policy (server-side, independent of frontend)
  enforcePasswordPolicy(password);

  // 2. Check for duplicate email in User collection
  const existingUser = await User.findOne({ email: loginEmail.toLowerCase() });
  if (existingUser) {
    throw {
      code:    'HOSPITAL_DUPLICATE_EMAIL',
      message: 'An account with this email already exists.',
      status:  409,
    };
  }

  // 3. Check for duplicate hospital registration number
  if (legalDetails?.registrationNumber) {
    const existingHosp = await Hospital.findOne({
      'legalDetails.registrationNumber': legalDetails.registrationNumber,
    });
    if (existingHosp) {
      throw {
        code:    'HOSPITAL_DUPLICATE_REG',
        message: 'A hospital with this registration number already exists.',
        status:  409,
      };
    }
  }

  // 4. Generate hospital code (e.g. NOTTO-DELHI-00123)
  const hospitalCode = await generateHospitalCode(address.city);

  // 5. Create User — bcrypt hashing happens in the pre('save') hook on User model
  const user = await User.create({
    email:       loginEmail.toLowerCase(),
    password,                             // bcrypt-12 hashed by User pre-save hook
    displayName,
    role:        'HOSPITAL_COORDINATOR',
    status:      'PENDING_APPROVAL',      // Cannot log in until admin approves
  });

  try {
    // 6. Create Hospital linked to the new user
    const hospital = await Hospital.create({
      hospitalCode,
      name,
      hospitalType,
      address,
      contact,
      legalDetails: legalDetails || { registrationNumber: `TEMP-${hospitalCode}` },
      documents,
      status:    'PENDING_VERIFICATION',
      createdBy: user._id,
      ...((!rest.geoLocation?.coordinates || rest.geoLocation.coordinates.length === 0) 
        ? Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'geoLocation')) 
        : rest),
    });

    logger.info(`PUBLIC_REGISTRATION: ${hospitalCode} | User[${user._id}] | ${loginEmail}`);

    // Send confirmation email
    sendEmail({
      to: loginEmail,
      subject: 'Application Received — JeevanSetu Hospital Network',
      text: `Your application for ${name} has been received.\nTracking Code: ${hospitalCode}\nWe will notify you once reviewed.`,
    });

    return { hospital, hospitalCode, userId: user._id };

  } catch (err) {
    // Rollback: if hospital creation fails, remove the user we just created
    await User.findByIdAndDelete(user._id);
    logger.error(`PUBLIC_REGISTRATION_FAILED: Rolled back User[${user._id}] — ${err.message}`);
    throw err;
  }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const createHospital = async (data, userId) => {
  const hospitalCode = await generateHospitalCode(data.address.city);
  const hospital = await Hospital.create({
    ...data,
    hospitalCode,
    legalDetails: data.legalDetails || { registrationNumber: `ADMIN-${hospitalCode}` },
    createdBy: userId,
    status: 'DRAFT',
  });
  logger.info(`HOSPITAL_CREATED: ${hospitalCode} by User[${userId}]`);
  return hospital;
};

export const listHospitals = async ({ status, page, limit }) => {
  const filter = status ? { status } : {};
  const skip   = (page - 1) * limit;

  const [hospitals, total] = await Promise.all([
    Hospital.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('createdBy',  'displayName email role')
      .populate('approvedBy', 'displayName email role')
      .sort({ createdAt: -1 }),
    Hospital.countDocuments(filter),
  ]);

  return {
    hospitals,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getHospital = async (id) => {
  const hospital = await Hospital.findById(id)
    .populate('createdBy',  'displayName email role')
    .populate('approvedBy', 'displayName email role');

  if (!hospital) throw HOSPITAL_ERRORS.NOT_FOUND;
  return hospital;
};

export const getHospitalByCode = async (hospitalCode) => {
  const hospital = await Hospital.findOne({ hospitalCode: hospitalCode.toUpperCase() })
    .select('hospitalCode name status createdAt approvedAt rejectionReason');
  if (!hospital) throw HOSPITAL_ERRORS.NOT_FOUND;
  return hospital;
};

export const updateHospital = async (id, data) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) throw HOSPITAL_ERRORS.NOT_FOUND;
  if (hospital.status !== 'DRAFT') throw HOSPITAL_ERRORS.IMMUTABLE_STATUS;

  Object.assign(hospital, data);
  await hospital.save();

  logger.info(`HOSPITAL_UPDATED: ${hospital.hospitalCode}`);
  return hospital;
};

// ── Workflow transitions ───────────────────────────────────────────────────────

/**
 * Generic transition handler — all workflow actions flow through here.
 * Validates the transition via the state machine before applying it.
 */
const applyTransition = async (id, action, actorId, extra = {}) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) throw HOSPITAL_ERRORS.NOT_FOUND;

  // State machine validates and returns the new status (throws WORKFLOW_002 if invalid)
  const newStatus = hospitalMachine.transition(hospital.status, action);
  hospital.status = newStatus;

  if (action === 'reject') {
    if (!extra.rejectionReason) throw HOSPITAL_ERRORS.REJECTION_REASON_REQUIRED;
    hospital.rejectionReason = extra.rejectionReason;

    // Disable the linked User account on rejection
    await User.findOneAndUpdate(
      { _id: hospital.createdBy },
      { status: 'DISABLED' }
    );
  }

  if (action === 'approve' || action === 'activate') {
    hospital.approvedBy = actorId;
    hospital.approvedAt = new Date();

    // ── Activate the hospital's login account ──────────────────────────────
    await User.findOneAndUpdate(
      { _id: hospital.createdBy },
      { status: 'ACTIVE' }
    );

    // ── Generate ECC P-256 identity keypair ────────────────────────────────
    const { publicKeyPem, encryptedPrivateKey, rawPrivateKeyPem, algorithm } =
      generateAndEncryptKeyPair();

    hospital.identity = {
      publicKeyPem,
      encryptedPrivateKeyPem: encryptedPrivateKey,
      keyGeneratedAt:         new Date(),
      keyAlgorithm:           algorithm,
    };

    // Return rawPrivateKeyPem via the hospital object so the controller
    // can include it in the one-time response (it is NEVER stored raw).
    hospital._rawPrivateKeyPem = rawPrivateKeyPem;

    logger.info(
      `ECC_KEYPAIR_GENERATED: ${hospital.hospitalCode} | Actor[${actorId}]`
    );
  }

  await hospital.save();

  const eventName = `HOSPITAL_${action.toUpperCase()}D`;
  logger.info(`${eventName}: ${hospital.hospitalCode} | Actor[${actorId}]`);

  // ── Send Emails ──────────────────────────────────────────
  try {
    const user = await User.findById(hospital.createdBy);
    if (user && user.email) {
      if (action === 'approve') {
        sendEmail({
          to: user.email,
          subject: '✅ Application Approved — You Can Now Log In',
          text: `Congratulations! ${hospital.name} is now part of JeevanSetu.\nLogin at: https://jeevansetu.in/login?role=hospital\nYour ECC Identity Certificate is ready for download in your dashboard.`,
        });
      } else if (action === 'reject') {
        sendEmail({
          to: user.email,
          subject: 'Application Update — Additional Information Required',
          text: `We regret to inform you that your application was not approved.\nReason: ${extra.rejectionReason}\nYou may re-apply after addressing the above.`,
        });
      }
    }
  } catch (emailErr) {
    logger.error(`Failed to send ${action} email: ${emailErr.message}`);
  }

  return hospital;
};

export const submitHospital     = (id, actorId) => applyTransition(id, 'submit',     actorId);
export const reviewHospital     = (id, actorId) => applyTransition(id, 'review',     actorId);
export const rejectHospital     = (id, actorId, rejectionReason) =>
  applyTransition(id, 'reject', actorId, { rejectionReason });
export const activateHospital   = (id, actorId) => applyTransition(id, 'activate',   actorId);
export const reactivateHospital = (id, actorId) => applyTransition(id, 'reactivate', actorId);
export const deactivateHospital = (id, actorId) => applyTransition(id, 'deactivate', actorId);

export const approveHospital = async (hospitalId, userId, { validUntil, remarks }) => {
  const validUntilDate = new Date(validUntil);
  if (Number.isNaN(validUntilDate.getTime()) || validUntilDate.getTime() <= Date.now()) {
    const err = new Error('INVALID_VALID_UNTIL_DATE');
    err.code = 'INVALID_VALID_UNTIL_DATE';
    err.status = 400;
    throw err;
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    const err = new Error('HOSPITAL_NOT_FOUND');
    err.code = 'HOSPITAL_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const allowedPrevStatuses = ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'REJECTED', 'DRAFT'];
  if (!allowedPrevStatuses.includes(hospital.status)) {
    const err = new Error('HOSPITAL_INVALID_STATE_FOR_ACTION');
    err.code = 'HOSPITAL_INVALID_STATE_FOR_ACTION';
    err.status = 409;
    throw err;
  }

  hospital.status = 'APPROVED';
  hospital.thota = hospital.thota || {};
  hospital.thota.validUntil = validUntilDate;
  hospital.lastComplianceCheckAt = new Date();
  if (remarks) hospital.thota.remarks = remarks;

  // Clear previous rejection/suspension if any
  if (hospital.rejectionReason) hospital.rejectionReason = null;
  if (hospital.suspensionReason) hospital.suspensionReason = null;

  await hospital.save();

  try {
    await logHospitalEvent({
      eventType: 'HOSPITAL_APPROVED',
      hospitalId: hospital._id.toString(),
      actorId: userId,
      payload: {
        validUntil: validUntilDate.toISOString(),
        remarks: remarks || null
      }
    });
  } catch (auditErr) {
    logger.error(`Audit log failed for HOSPITAL_APPROVED: ${auditErr.message}`);
  }

  return hospital;
};

export const suspendHospital = async (hospitalId, userId, { reason }) => {
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const err = new Error('REASON_REQUIRED');
    err.code = 'REASON_REQUIRED';
    err.status = 400;
    throw err;
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    const err = new Error('HOSPITAL_NOT_FOUND');
    err.code = 'HOSPITAL_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const allowedPrevStatuses = ['APPROVED', 'ACTIVE'];
  if (!allowedPrevStatuses.includes(hospital.status)) {
    const err = new Error('HOSPITAL_INVALID_STATE_FOR_ACTION');
    err.code = 'HOSPITAL_INVALID_STATE_FOR_ACTION';
    err.status = 409;
    throw err;
  }

  hospital.status = 'SUSPENDED';
  hospital.suspensionReason = reason.trim();
  hospital.lastComplianceCheckAt = new Date();

  await hospital.save();

  try {
    await logHospitalEvent({
      eventType: 'HOSPITAL_SUSPENDED',
      hospitalId: hospital._id.toString(),
      actorId: userId,
      payload: {
        reason: hospital.suspensionReason
      }
    });
  } catch (auditErr) {
    logger.error(`Audit log failed for HOSPITAL_SUSPENDED: ${auditErr.message}`);
  }

  return hospital;
};
