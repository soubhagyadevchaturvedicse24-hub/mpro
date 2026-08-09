import Donor from '../models/Donor.js';
import BrainDeathCertification from '../../models/BrainDeathCertification.js';

export const checkDonorReadyForTransplant = async (req, res, next) => {
  try {
    const { donorId } = req.params; // or req.body depending on your route
    if (!donorId) {
      return res.status(400).json({ error: 'DONOR_ID_REQUIRED' });
    }

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });
    }

    if (donor.donorType === 'LIVING') {
      if (['NON_NEAR_RELATIVE', 'FOREIGN_NATIONAL'].includes(donor.relationshipType)) {
        if (donor.authorizationStatus !== 'APPROVED') {
          return res.status(403).json({
            error: 'AC_APPROVAL_REQUIRED',
            message: 'Authorization Committee approval is required for this living donor before transplant.'
          });
        }
      }
      // For NEAR_RELATIVE, no AC approval required by design.
    } else if (donor.donorType === 'DECEASED') {
      if (!donor.brainDeathCertificationId) {
        return res.status(403).json({
          error: 'BRAIN_DEATH_CERTIFICATION_MISSING',
          message: 'Brain death certification is required for deceased donor before transplant.'
        });
      }

      const cert = await BrainDeathCertification.findById(donor.brainDeathCertificationId);
      if (!cert || cert.overallStatus !== 'COMPLETED') {
        return res.status(403).json({
          error: 'BRAIN_DEATH_NOT_CERTIFIED',
          message: 'Brain death certification must be completed (both rounds) before transplant.'
        });
      }
    }

    next();
  } catch (err) {
    return next(err);
  }
};
