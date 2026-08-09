import MiniBlockchainAdapter     from './MiniBlockchainAdapter.js';
import FabricBlockchainAdapter   from './FabricBlockchainAdapter.js';
import EthereumBlockchainAdapter from './EthereumBlockchainAdapter.js';
import logger from '../../logger/index.js';

let adapterInstance = null;
let currentAdapterType = (process.env.BLOCKCHAIN_ADAPTER || 'mini').toLowerCase();

export class BlockchainAdapterFactory {

  static getAdapter() {
    if (!adapterInstance) {
      adapterInstance = BlockchainAdapterFactory._create(currentAdapterType);
    }
    return adapterInstance;
  }

  /**
   * Hot-switch the active blockchain adapter at runtime.
   * @param {'mini'|'ethereum'|'ganache'|'fabric'|'hyperledger'} type
   */
  static switchAdapter(type) {
    const normalized = type.toLowerCase();
    if (normalized === currentAdapterType && adapterInstance) {
      logger.info(`⛓️  BLOCKCHAIN FACTORY: Already using "${normalized}" adapter — no change.`);
      return adapterInstance;
    }
    logger.info(`⛓️  BLOCKCHAIN FACTORY: Switching adapter → "${normalized}"`);
    adapterInstance    = BlockchainAdapterFactory._create(normalized);
    currentAdapterType = normalized;
    return adapterInstance;
  }

  /** Returns the currently active adapter type string */
  static getCurrentType() {
    return currentAdapterType;
  }

  /** Internal factory */
  static _create(type) {
    if (type === 'ethereum' || type === 'ganache') {
      logger.info('⛓️  BLOCKCHAIN FACTORY: Initializing Ethereum / Ganache Adapter...');
      return new EthereumBlockchainAdapter();
    }
    if (type === 'fabric' || type === 'hyperledger') {
      logger.info('⛓️  BLOCKCHAIN FACTORY: Initializing Hyperledger Fabric Adapter...');
      return new FabricBlockchainAdapter();
    }
    logger.info('⛓️  BLOCKCHAIN FACTORY: Initializing Mini Blockchain Adapter (MongoDB)...');
    return new MiniBlockchainAdapter();
  }
}

export const getBlockchainAdapter = () => BlockchainAdapterFactory.getAdapter();
