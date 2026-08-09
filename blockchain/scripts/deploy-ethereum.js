/**
 * deploy-ethereum.js
 * ──────────────────
 * Deploys AuditLedger.sol to a local Ganache instance.
 *
 * Prerequisites:
 *   1. Ganache running:  start-ganache.bat  (port 8545, deterministic mode)
 *   2. Contract compiled: node blockchain/scripts/compile-contract.js
 *
 * Usage:
 *   node blockchain/scripts/deploy-ethereum.js
 *
 * After running, copy the printed CONTRACT_ADDRESS and PRIVATE_KEY into
 * backend/.env as GANACHE_CONTRACT_ADDRESS and GANACHE_PRIVATE_KEY.
 */

import { ethers }    from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '../../');

const GANACHE_URL     = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:8545';
const ARTIFACT_PATH   = join(ROOT, 'blockchain/contracts/AuditLedger.json');

const LINE = '═'.repeat(60);

async function deploy() {
  console.log(`\n${LINE}`);
  console.log('   NeoLife — Deploy AuditLedger.sol to Ganache');
  console.log(`${LINE}\n`);

  // ── 1. Load compiled artifact ─────────────────────────────────────────────
  if (!existsSync(ARTIFACT_PATH)) {
    console.error('❌  AuditLedger.json not found.');
    console.error('   Run first: node blockchain/scripts/compile-contract.js\n');
    process.exit(1);
  }

  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf-8'));
  console.log(`✅  Artifact loaded: ${artifact.contractName}  (compiled ${artifact.compiledAt})`);

  // ── 2. Connect to Ganache ─────────────────────────────────────────────────
  let provider;
  try {
    provider = new ethers.JsonRpcProvider(GANACHE_URL);
    await provider.getBlockNumber();
    console.log(`✅  Connected to Ganache: ${GANACHE_URL}`);
  } catch {
    console.error(`❌  Cannot connect to Ganache at ${GANACHE_URL}`);
    console.error('   Make sure start-ganache.bat is running!\n');
    process.exit(1);
  }

  // ── 3. Use first deterministic Ganache account ────────────────────────────
  // Ganache --deterministic always gives the same 10 accounts.
  // Account 0 private key is fixed and well-known for dev use only.
  const DETERMINISTIC_PRIVATE_KEYS = [
    '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
  ];

  let wallet;
  for (const pk of DETERMINISTIC_PRIVATE_KEYS) {
    try {
      const w = new ethers.Wallet(pk, provider);
      const bal = await provider.getBalance(w.address);
      if (bal > 0n) { wallet = w; break; }
    } catch { /* try next */ }
  }

  if (!wallet) {
    // If deterministic keys don't work, try GANACHE_PRIVATE_KEY from env
    const envKey = process.env.GANACHE_PRIVATE_KEY;
    if (envKey) {
      wallet = new ethers.Wallet(envKey, provider);
    } else {
      console.error('❌  Could not find a funded Ganache account.');
      console.error('   Make sure you started Ganache with --deterministic flag.');
      console.error('   Or set GANACHE_PRIVATE_KEY in backend/.env\n');
      process.exit(1);
    }
  }

  const balance = await provider.getBalance(wallet.address);
  console.log(`✅  Deployer: ${wallet.address}`);
  console.log(`   Balance : ${ethers.formatEther(balance)} ETH (test)\n`);

  // ── 4. Deploy contract ────────────────────────────────────────────────────
  console.log('🚀  Deploying AuditLedger...');
  const factory  = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  const receipt  = await contract.deploymentTransaction().wait();
  const address  = await contract.getAddress();

  console.log(`\n${LINE}`);
  console.log('   ✅  DEPLOYMENT SUCCESSFUL');
  console.log(`${LINE}`);
  console.log(`   Contract Address : ${address}`);
  console.log(`   Deploy Tx Hash   : ${receipt.hash}`);
  console.log(`   Block Number     : ${receipt.blockNumber}`);
  console.log(`   Gas Used         : ${receipt.gasUsed.toString()}`);
  console.log(`${LINE}`);

  // ── 5. Verify with a quick test call ─────────────────────────────────────
  const deployed = new ethers.Contract(address, artifact.abi, wallet);
  const total    = await deployed.getTotalRecords();
  console.log(`\n🔍  Verified: getTotalRecords() = ${total} (expected 0)`);

  // ── 6. Print env instructions ─────────────────────────────────────────────
  console.log(`\n${LINE}`);
  console.log('   📋  NEXT STEP — Add these to backend/.env:');
  console.log(`${LINE}`);
  console.log(`GANACHE_PRIVATE_KEY=${wallet.privateKey}`);
  console.log(`GANACHE_CONTRACT_ADDRESS=${address}`);
  console.log(`BLOCKCHAIN_ADAPTER=ethereum`);
  console.log(`${LINE}\n`);
  console.log('   Then restart your backend server.\n');
}

deploy().catch(err => {
  console.error('❌  Deploy failed:', err.message);
  process.exit(1);
});
