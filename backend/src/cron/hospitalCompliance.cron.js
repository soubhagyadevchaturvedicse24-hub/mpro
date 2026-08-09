import cron from 'node-cron';
import { runThotaExpiryComplianceJob } from '../hospital/services/hospitalCompliance.service.js';

let jobInstance = null;

export const startHospitalComplianceCron = () => {
  if (jobInstance) {
    return jobInstance;
  }

  // Every day at 02:00
  const job = cron.schedule('0 2 * * *', async () => {
    try {
      const result = await runThotaExpiryComplianceJob();
      console.log('Hospital compliance cron completed', result);
    } catch (err) {
      console.error('Hospital compliance cron failed', err);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata' 
  });

  jobInstance = job;
  return job;
};

export const stopHospitalComplianceCron = () => {
  if (jobInstance) {
    jobInstance.stop();
    jobInstance = null;
  }
};
