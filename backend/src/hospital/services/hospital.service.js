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
export const approveHospital    = (id, actorId) => applyTransition(id, 'approve',    actorId);
export const rejectHospital     = (id, actorId, rejectionReason) =>
  applyTransition(id, 'reject', actorId, { rejectionReason });
export const activateHospital   = (id, actorId) => applyTransition(id, 'activate',   actorId);
export const suspendHospital    = (id, actorId) => applyTransition(id, 'suspend',    actorId);
export const reactivateHospital = (id, actorId) => applyTransition(id, 'reactivate', actorId);
export const deactivateHospital = (id, actorId) => applyTransition(id, 'deactivate', actorId);
