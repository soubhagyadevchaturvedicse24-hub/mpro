import Hospital from '../../models/Hospital.js';
import { logHospitalEvent } from '../../utils/auditLogger.js';
import { sendThotaExpiringSoonEmail, sendThotaExpiredEmail } from '../../utils/notificationStub.js';

const EXPIRING_SOON_DAYS = 30;

export const runThotaExpiryComplianceJob = async () => {
  const now = new Date();
  const thresholdDate = new Date(
    now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000
  );

  // Find hospitals that are APPROVED/ACTIVE and have a validUntil
  const hospitals = await Hospital.find({
    status: { $in: ['APPROVED', 'ACTIVE'] },
    'thota.validUntil': { $exists: true, $ne: null }
  });

  const expiredIds = [];
  const expiringSoonIds = [];

  for (const hospital of hospitals) {
    const expiry = new Date(hospital.thota.validUntil);
    if (expiry <= now) {
      // Already expired
      hospital.status = 'EXPIRED';
      hospital.suspensionReason = 'THOTA registration expired';
      hospital.lastComplianceCheckAt = now;
      await hospital.save();

      // Audit
      try {
        await logHospitalEvent({
          eventType: 'HOSPITAL_THOTA_EXPIRED',
          hospitalId: hospital._id.toString(),
          actorId: 'SYSTEM_CRON',
          payload: {
            validUntil: expiry.toISOString(),
            expiredAt: now.toISOString()
          }
        });
      } catch (e) {
        console.error('Audit log failed for HOSPITAL_THOTA_EXPIRED', e);
      }

      expiredIds.push(hospital._id.toString());

      // Send notifications (email/SMS) to:
      await sendThotaExpiredEmail(hospital);
    } else if (expiry <= thresholdDate) {
      // Expiring soon
      hospital.lastComplianceCheckAt = now;
      await hospital.save();

      expiringSoonIds.push(hospital._id.toString());

      // Send reminder notifications to:
      await sendThotaExpiringSoonEmail(hospital, expiry);
    }
  }

  return {
    runAt: now.toISOString(),
    expiredCount: expiredIds.length,
    expiringSoonCount: expiringSoonIds.length,
    expiredIds,
    expiringSoonIds
  };
};
