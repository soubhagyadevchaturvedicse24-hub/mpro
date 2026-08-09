import mongoose from 'mongoose';
import BrainDeathCertification from '../../models/BrainDeathCertification.js';
import Donor from '../../models/Donor.js'; 
import Hospital from '../../models/Hospital.js';
import { logBrainDeathEvent } from '../../utils/auditLogger.js'; 

const ALLOWED_ROLES_IN_BOARD = [
  'NEUROSURGEON',
  'TREATING_PHYSICIAN',
  'NOMINATED_DOCTOR_1',
  'NOMINATED_DOCTOR_2'
];

export const initiateBrainDeathCertification = async (donorId, userId) => {
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

  if (donor.donorType !== 'DECEASED') {
    const err = new Error('ONLY_DECEASED_DONORS_CAN_HAVE_BRAIN_DEATH_CERTIFICATION');
    err.code = 'ONLY_DECEASED_DONORS_CAN_HAVE_BRAIN_DEATH_CERTIFICATION';
    err.status = 400;
    throw err;
  }

  if (donor.hospitalId) {
    const hospital = await Hospital.findById(donor.hospitalId._id || donor.hospitalId);
    if (!hospital || !['APPROVED', 'ACTIVE'].includes(hospital.status)) {
      const err = new Error('HOSPITAL_NOT_APPROVED');
      err.code = 'HOSPITAL_NOT_APPROVED';
      err.status = 403;
      throw err;
    }
  }

  const existing = await BrainDeathCertification.findOne({ donorId });
  if (existing) {
    const err = new Error('BRAIN_DEATH_CERTIFICATION_ALREADY_EXISTS');
    err.code = 'BRAIN_DEATH_CERTIFICATION_ALREADY_EXISTS';
    err.status = 409;
    throw err;
  }

  const cert = new BrainDeathCertification({
    donorId,
    hospitalId: donor.hospitalId,
    overallStatus: 'ROUND_1_IN_PROGRESS',
    round1: {
      status: 'IN_PROGRESS',
      signatures: [],
      completedAt: null
    },
    round2: {
      status: 'PENDING',
      signatures: [],
      completedAt: null
    }
  });

  await cert.save();

  donor.brainDeathCertificationId = cert._id;
  await donor.save();

  try {
    await logBrainDeathEvent({
      eventType: 'BRAIN_DEATH_CERTIFICATION_INITIATED',
      donorId: donor._id.toString(),
      hospitalId: donor.hospitalId._id ? donor.hospitalId._id.toString() : donor.hospitalId.toString(),
      actorId: userId,
      payload: {
        certificationId: cert._id.toString()
      }
    });
  } catch (auditErr) {
    console.error('Audit log failed for brain death initiation', auditErr);
  }

  return cert;
};

export const signBrainDeathRound = async (certificationId, round, userId, { roleInBoard, signatureDocumentUrl }) => {
  if (![1, 2].includes(round)) {
    const err = new Error('INVALID_ROUND');
    err.code = 'INVALID_ROUND';
    err.status = 400;
    throw err;
  }

  if (!ALLOWED_ROLES_IN_BOARD.includes(roleInBoard)) {
    const err = new Error('INVALID_ROLE_IN_BOARD');
    err.code = 'INVALID_ROLE_IN_BOARD';
    err.status = 400;
    throw err;
  }

  const cert = await BrainDeathCertification.findById(certificationId);
  if (!cert) {
    const err = new Error('CERTIFICATION_NOT_FOUND');
    err.code = 'CERTIFICATION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const roundData = round === 1 ? cert.round1 : cert.round2;

  if (round === 2) {
    if (cert.round1.status !== 'COMPLETED') {
      const err = new Error('ROUND_1_NOT_COMPLETED');
      err.code = 'ROUND_1_NOT_COMPLETED';
      err.status = 409;
      throw err;
    }
    const sixHours = 6 * 60 * 60 * 1000;
    if (Date.now() - cert.round1.completedAt.getTime() < sixHours) {
      const err = new Error('SIX_HOUR_GAP_NOT_MET');
      err.code = 'SIX_HOUR_GAP_NOT_MET';
      err.status = 409;
      throw err;
    }
    if (roundData.status === 'PENDING') {
      roundData.status = 'IN_PROGRESS';
      cert.overallStatus = 'ROUND_2_IN_PROGRESS';
    }
  }

  const alreadySignedByThisDoctor = roundData.signatures.some(s => s.doctorId.toString() === userId);
  if (alreadySignedByThisDoctor) {
    const err = new Error('DOCTOR_ALREADY_SIGNED_THIS_ROUND');
    err.code = 'DOCTOR_ALREADY_SIGNED_THIS_ROUND';
    err.status = 409;
    throw err;
  }

  const alreadySignedWithThisRole = roundData.signatures.some(s => s.roleInBoard === roleInBoard);
  if (alreadySignedWithThisRole) {
    const err = new Error('ROLE_ALREADY_SIGNED_THIS_ROUND');
    err.code = 'ROLE_ALREADY_SIGNED_THIS_ROUND';
    err.status = 409;
    throw err;
  }

  if (roundData.signatures.length >= 4) {
    const err = new Error('ROUND_ALREADY_HAS_4_SIGNATURES');
    err.code = 'ROUND_ALREADY_HAS_4_SIGNATURES';
    err.status = 409;
    throw err;
  }

  roundData.signatures.push({
    doctorId: userId,
    roleInBoard,
    signatureDocumentUrl: signatureDocumentUrl || null,
    signedAt: new Date()
  });

  if (roundData.signatures.length === 4 && roundData.status !== 'COMPLETED') {
    roundData.status = 'COMPLETED';
    roundData.completedAt = new Date();

    if (round === 1) {
      cert.overallStatus = 'ROUND_1_COMPLETED';
    } else {
      cert.overallStatus = 'COMPLETED';
    }
  }

  await cert.save();

  try {
    await logBrainDeathEvent({
      eventType: 'BRAIN_DEATH_DOCTOR_SIGNED',
      donorId: cert.donorId.toString(),
      hospitalId: cert.hospitalId.toString(),
      actorId: userId,
      payload: {
        certificationId: cert._id.toString(),
        round,
        roleInBoard
      }
    });

    if (roundData.status === 'COMPLETED') {
      await logBrainDeathEvent({
        eventType: 'BRAIN_DEATH_ROUND_COMPLETED',
        donorId: cert.donorId.toString(),
        hospitalId: cert.hospitalId.toString(),
        actorId: userId,
        payload: {
          certificationId: cert._id.toString(),
          round,
          overallStatus: cert.overallStatus
        }
      });
    }

    if (cert.overallStatus === 'COMPLETED') {
      await logBrainDeathEvent({
        eventType: 'BRAIN_DEATH_CERTIFICATION_COMPLETED',
        donorId: cert.donorId.toString(),
        hospitalId: cert.hospitalId.toString(),
        actorId: userId,
        payload: {
          certificationId: cert._id.toString()
        }
      });
    }
  } catch (auditErr) {
    console.error('Audit log failed for brain death signature', auditErr);
  }

  return {
    certificationId: cert._id.toString(),
    overallStatus: cert.overallStatus,
    round,
    signaturesCount: roundData.signatures.length
  };
};

export const getBrainDeathCertificationByDonorId = async (donorId) => {
  if (!mongoose.Types.ObjectId.isValid(donorId)) {
    const err = new Error('INVALID_DONOR_ID');
    err.code = 'INVALID_DONOR_ID';
    err.status = 400;
    throw err;
  }

  const cert = await BrainDeathCertification.findOne({ donorId });
  if (!cert) {
    const err = new Error('CERTIFICATION_NOT_FOUND');
    err.code = 'CERTIFICATION_NOT_FOUND';
    err.status = 404;
    throw err;
  }
  return cert;
};
