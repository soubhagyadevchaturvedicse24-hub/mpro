import { getBlockchainAdapter } from '../blockchain/adapters/BlockchainAdapterFactory.js';
import logger from '../logger/index.js';

export const logHospitalEvent = async ({ eventType, hospitalId, actorId, payload }) => {
  try {
    const ledgerAdapter = getBlockchainAdapter();
    // Assuming ledgerAdapter.append signature: (eventName, entityType, entityId, payload)
    await ledgerAdapter.append(
      eventType,
      'Hospital',
      hospitalId,
      {
        ...payload,
        actorId,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    logger.error(`Failed to notarize ${eventType} for hospital ${hospitalId}: ${error.message}`);
  }
};

export const logAuthorizationEvent = async ({ eventType, donorId, hospitalId, actorId, payload }) => {
  try {
    const ledgerAdapter = getBlockchainAdapter();
    await ledgerAdapter.append(
      eventType,
      'Donor',
      donorId,
      {
        ...payload,
        hospitalId,
        actorId,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    logger.error(`Failed to notarize ${eventType} for donor ${donorId}: ${error.message}`);
  }
};

export const logBrainDeathEvent = async ({ eventType, donorId, hospitalId, actorId, payload }) => {
  try {
    const ledgerAdapter = getBlockchainAdapter();
    await ledgerAdapter.append(
      eventType,
      'Donor',
      donorId,
      {
        ...payload,
        hospitalId,
        actorId,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    logger.error(`Failed to notarize ${eventType} for donor ${donorId}: ${error.message}`);
  }
};
