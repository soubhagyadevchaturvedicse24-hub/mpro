import {
  initiateBrainDeathCertification,
  signBrainDeathRound,
  getBrainDeathCertificationByDonorId
} from '../services/brainDeath.service.js';

export const initiateBrainDeathController = async (req, res, next) => {
  try {
    const { donorId } = req.params;
    const userId = req.user.id || req.user.sub;

    const cert = await initiateBrainDeathCertification(donorId, userId);

    return res.status(201).json({
      certificationId: cert._id.toString(),
      donorId: cert.donorId.toString(),
      hospitalId: cert.hospitalId.toString(),
      overallStatus: cert.overallStatus,
      message: 'Brain death certification initiated successfully.'
    });
  } catch (err) {
    if (err.code === 'INVALID_DONOR_ID' || err.code === 'DONOR_NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: 'Donor not found or invalid.' });
    }
    if (err.code === 'ONLY_DECEASED_DONORS_CAN_HAVE_BRAIN_DEATH_CERTIFICATION') {
      return res.status(400).json({ error: err.code, message: 'Brain death certification is only for deceased donors.' });
    }
    if (err.code === 'HOSPITAL_NOT_APPROVED') {
      return res.status(403).json({ error: err.code, message: 'Hospital is not approved.' });
    }
    if (err.code === 'BRAIN_DEATH_CERTIFICATION_ALREADY_EXISTS') {
      return res.status(409).json({ error: err.code, message: 'Brain death certification already exists for this donor.' });
    }
    return next(err);
  }
};

export const signBrainDeathRoundController = async (req, res, next) => {
  try {
    const { certificationId, round } = req.params;
    const userId = req.user.id || req.user.sub;
    const { roleInBoard, signatureDocumentUrl } = req.body;

    const roundNum = Number(round);
    if (!roleInBoard) {
      return res.status(400).json({ error: 'ROLE_IN_BOARD_REQUIRED', message: 'roleInBoard is required.' });
    }

    const result = await signBrainDeathRound(certificationId, roundNum, userId, { roleInBoard, signatureDocumentUrl });

    return res.status(200).json({
      certificationId: result.certificationId,
      overallStatus: result.overallStatus,
      round: result.round,
      signaturesCount: result.signaturesCount,
      message: 'Signature recorded successfully.'
    });
  } catch (err) {
    if (err.code === 'INVALID_ROUND' || err.code === 'INVALID_ROLE_IN_BOARD') {
      return res.status(400).json({ error: err.code, message: 'Invalid round or roleInBoard.' });
    }
    if (err.code === 'CERTIFICATION_NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: 'Certification not found.' });
    }
    if (err.code === 'ROUND_1_NOT_COMPLETED' || err.code === 'SIX_HOUR_GAP_NOT_MET') {
      return res.status(409).json({ error: err.code, message: 'Round 2 preconditions not met.' });
    }
    if (err.code === 'DOCTOR_ALREADY_SIGNED_THIS_ROUND' ||
        err.code === 'ROLE_ALREADY_SIGNED_THIS_ROUND' ||
        err.code === 'ROUND_ALREADY_HAS_4_SIGNATURES') {
      return res.status(409).json({ error: err.code, message: 'Duplicate signature or round full.' });
    }
    return next(err);
  }
};

export const getBrainDeathCertificationController = async (req, res, next) => {
  try {
    const { donorId } = req.params;
    const cert = await getBrainDeathCertificationByDonorId(donorId);

    return res.status(200).json(cert);
  } catch (err) {
    if (err.code === 'INVALID_DONOR_ID' || err.code === 'CERTIFICATION_NOT_FOUND') {
      return res.status(404).json({ error: err.code, message: 'Certification not found.' });
    }
    return next(err);
  }
};
