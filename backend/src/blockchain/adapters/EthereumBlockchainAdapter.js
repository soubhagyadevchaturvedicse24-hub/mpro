/**
 * EthereumBlockchainAdapter.js
 * ────────────────────────────
 * Blockchain adapter that writes audit records to a real Solidity smart
 * contract on local Ganache (or any EVM-compatible network).
 *
 * Each audit event generates a REAL Ethereum transaction. The tx hash
 * becomes the block's "hash" stored in MongoDB, making it verifiable on-chain.
 */

import { ethers }           from 'ethers';
import crypto               from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath }    from 'url';
import { dirname, join, resolve } from 'path';

import BlockchainAdapter    from './BlockchainAdapter.js';
import LedgerBlock          from '../../models/LedgerBlock.js';
import logger               from '../../logger/index.js';

const __filename    = fileURLToPath(import.meta.url);
const __dirname     = dirname(__filename);
const ARTIFACT_PATH = resolve(
  __dirname,
  '../../../../blockchain/contracts/AuditLedger.json'
);

export default class EthereumBlockchainAdapter extends BlockchainAdapter {
  constructor() {
    super();
    this.provider        = null;
    this.wallet          = null;
    this.contract        = null;
    this.abi             = null;
    this.contractAddress = process.env.GANACHE_CONTRACT_ADDRESS || null;
    this.rpcUrl          = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:8545';
    this.isConnected     = false;
    this._init();
  }

  // ── Initialise connection ──────────────────────────────────────────────────
  async _init() {
    try {
      // Load compiled ABI
      if (!existsSync(ARTIFACT_PATH)) {
        logger.warn('ETH_CHAIN: AuditLedger.json not found — run: node blockchain/scripts/compile-contract.js');
        return;
      }
      const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf-8'));
      this.abi = artifact.abi;

      // Connect provider
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      await this.provider.getBlockNumber(); // throws if offline

      // Connect wallet
      const pk = process.env.GANACHE_PRIVATE_KEY;
      if (!pk) {
        logger.warn('ETH_CHAIN: GANACHE_PRIVATE_KEY not set. Run deploy-ethereum.js for instructions.');
        return;
      }
      this.wallet = new ethers.Wallet(pk, this.provider);

      // Connect contract
      if (!this.contractAddress) {
        logger.warn('ETH_CHAIN: GANACHE_CONTRACT_ADDRESS not set. Run blockchain/scripts/deploy-ethereum.js first.');
        return;
      }
      this.contract    = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
      this.isConnected = true;

      const total = await this.contract.getTotalRecords();
      logger.info(
        `⛓️  ETH_CHAIN: Connected → Ganache ${this.rpcUrl} | Contract ${this.contractAddress} | On-chain records: ${total}`
      );
    } catch (err) {
      this.isConnected = false;
      logger.warn(`ETH_CHAIN: Ganache offline or misconfigured — ${err.message}. Running in MongoDB-only fallback.`);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  _canonicalStringify(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(i => this._canonicalStringify(i)).join(',')}]`;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${this._canonicalStringify(obj[k])}`).join(',')}}`;
  }

  // ── append ─────────────────────────────────────────────────────────────────
  async append(eventType, entityType, entityId, payload) {
    let retries = 5;
    while (retries > 0) {
      try {
        const rawPayload    = payload ? JSON.parse(JSON.stringify(payload)) : {};
        const payloadString = this._canonicalStringify(rawPayload);
        const sha256Hex     = crypto.createHash('sha256').update(payloadString).digest('hex');
        const payloadHash32 = '0x' + sha256Hex; // bytes32 on-chain

        let txHash      = null;
        let blockNumber = null;
        let onChainIdx  = null;

        // ── Write to Ganache smart contract ─────────────────────────────────
        if (this.isConnected && this.contract && retries === 5) {
          try {
            const tx      = await this.contract.appendRecord(eventType, entityType, entityId, payloadHash32);
            const receipt = await tx.wait();
            txHash      = receipt.hash;
            blockNumber = Number(receipt.blockNumber);

            // Parse RecordAppended event to get onChainIdx
            const iface  = new ethers.Interface(this.abi);
            for (const log of receipt.logs) {
              try {
                const parsed = iface.parseLog(log);
                if (parsed?.name === 'RecordAppended') {
                  onChainIdx = Number(parsed.args.recordIndex);
                }
              } catch { /* not our event */ }
            }

            logger.info(`ETH_CHAIN: ✅ On-chain record #${onChainIdx} | TxHash: ${txHash} | Block: ${blockNumber}`);
          } catch (ethErr) {
            logger.error(`ETH_CHAIN: Contract write failed — ${ethErr.message}. Falling back to MongoDB hash.`);
          }
        }

        // ── Persist to MongoDB (always, for rich querying & display) ────────
        const lastBlock    = await LedgerBlock.findOne().sort({ blockIndex: -1 }).lean();
        const blockIndex   = lastBlock ? lastBlock.blockIndex + 1 : 0;
        const previousHash = lastBlock
          ? lastBlock.hash
          : '0000000000000000000000000000000000000000000000000000000000000000';
        const timestamp    = new Date();

        // Use real Ganache txHash when available, else generate local hash
        const hash = txHash
          || crypto.createHash('sha256')
               .update(`${blockIndex}|${timestamp.toISOString()}|${sha256Hex}`)
               .digest('hex');

        const ethereumMeta = txHash
          ? { txHash, blockNumber, onChainIndex: onChainIdx, contractAddress: this.contractAddress,
              network: 'Ethereum (Ganache Local)', payloadHash: payloadHash32 }
          : { network: 'Ethereum (Offline Fallback)', payloadHash: payloadHash32 };

        const block = new LedgerBlock({
          blockIndex,
          timestamp,
          previousHash,
          hash,
          eventType,
          entityType,
          entityId,
          payload: { ...rawPayload, _ethereum: ethereumMeta },
          arweaveTxId: null,
        });

        await block.save();
        logger.info(`ETH_CHAIN: Block #${blockIndex} persisted [${eventType} → ${entityType}:${entityId}]`);
        return block;
      } catch (error) {
        if (error.code === 11000 && retries > 1) {
          // Duplicate key error on blockIndex, meaning another process appended a block concurrently.
          // Wait a brief random time and retry.
          retries--;
          const delay = Math.floor(Math.random() * 100) + 50;
          logger.warn(`ETH_CHAIN Concurrent append detected. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        logger.error(`ETH_CHAIN Append Error: ${error.message}`);
        throw error;
      }
    }
  }

  // ── getHistory ─────────────────────────────────────────────────────────────
  async getHistory(entityType, entityId) {
    const blocks = await LedgerBlock.find({ entityType, entityId }).sort({ blockIndex: 1 }).lean();
    return blocks.map(b => ({
      blockIndex   : b.blockIndex,
      timestamp    : b.timestamp,
      eventType    : b.eventType,
      payload      : b.payload,
      hash         : b.hash,
      previousHash : b.previousHash,
      arweaveTxId  : b.arweaveTxId,
    }));
  }

  // ── verify ─────────────────────────────────────────────────────────────────
  async verify() {
    let onChainCount = null;
    let chainIntact  = null;

    if (this.isConnected && this.contract) {
      try {
        const result  = await this.contract.verifyIntegrity();
        onChainCount  = Number(result.totalRecords);
        chainIntact   = result.chainIntact;
      } catch (err) {
        logger.error(`ETH_CHAIN Verify error: ${err.message}`);
      }
    }

    const mongoCount = await LedgerBlock.countDocuments();
    const valid      = onChainCount === null || onChainCount === mongoCount;

    return {
      valid,
      totalBlocks      : mongoCount,
      verifiedBlocks   : mongoCount,
      onChainRecords   : onChainCount,
      mongoRecords     : mongoCount,
      ganacheConnected : this.isConnected,
      network          : 'Ethereum (Ganache Local)',
      contractAddress  : this.contractAddress,
      chainIntact,
      brokenBlock      : null,
      ...((!valid && onChainCount !== null) && {
        warning: `On-chain count (${onChainCount}) ≠ MongoDB count (${mongoCount}) — possible tampering detected!`
      }),
    };
  }

  // ── networkStatus ──────────────────────────────────────────────────────────
  async getNetworkStatus() {
    let blockNumber = null;
    let walletAddress = this.wallet?.address || null;
    if (this.isConnected) {
      try { blockNumber = await this.provider.getBlockNumber(); } catch { /* ignore */ }
    }
    return {
      adapter          : 'ethereum',
      ganacheConnected : this.isConnected,
      rpcUrl           : this.rpcUrl,
      contractAddress  : this.contractAddress,
      walletAddress,
      currentBlock     : blockNumber,
      network          : 'Ethereum (Ganache Local)',
    };
  }
}
