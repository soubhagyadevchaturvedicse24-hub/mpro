import Hospital from '../models/Hospital.js';

export const checkHospitalActive = async (req, res, next) => {
  try {
    // Determine hospitalId from params or user's hospital
    const hospitalId = req.params.hospitalId || (req.user && req.user.hospitalId);

    if (!hospitalId) {
      return res.status(400).json({ error: 'MISSING_HOSPITAL_ID', message: 'Hospital ID is required' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'HOSPITAL_NOT_FOUND', message: 'Hospital not found' });
    }

    // 1. Check Status
    if (hospital.status !== 'APPROVED' && hospital.status !== 'ACTIVE') {
      return res.status(403).json({ 
        error: 'HOSPITAL_NOT_APPROVED', 
        message: `Hospital cannot perform this action (Status: ${hospital.status})` 
      });
    }

    // 2. Check THOTA Expiry
    if (!hospital.thota || !hospital.thota.validUntil) {
      return res.status(403).json({
        error: 'THOTA_EXPIRED',
        message: 'Hospital does not have a valid THOTA certificate date'
      });
    }

    if (new Date(hospital.thota.validUntil) <= new Date()) {
      return res.status(403).json({
        error: 'THOTA_EXPIRED',
        message: 'Hospital THOTA registration has expired'
      });
    }

    // Attach hospital to request for downstream use if needed
    req.hospital = hospital;
    next();
  } catch (error) {
    next(error);
  }
};
