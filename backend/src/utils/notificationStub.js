export const sendThotaExpiringSoonEmail = async (hospital, expiryDate) => {
  const to = hospital.contactInfo?.email || 'admin@hospital.com';
  const subject = `THOTA Registration Expiring Soon – ${hospital.legalName || 'Hospital'}`;
  const body = `Your THOTA registration is expiring on ${expiryDate.toISOString()}. Please renew to avoid service interruption.`;
  console.log('[NOTIFICATION STUB] Email:', { to, subject, body });
};

export const sendThotaExpiredEmail = async (hospital) => {
  const to = hospital.contactInfo?.email || 'admin@hospital.com';
  const subject = `THOTA Registration Expired – ${hospital.legalName || 'Hospital'}`;
  const body = `Your THOTA registration has expired. Your hospital status has been set to EXPIRED. Contact the Appropriate Authority for renewal.`;
  console.log('[NOTIFICATION STUB] Email:', { to, subject, body });
};
