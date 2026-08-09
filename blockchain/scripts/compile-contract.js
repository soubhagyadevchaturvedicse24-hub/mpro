/**
 * compile-contract.js
 * ───────────────────
 * Compiles AuditLedger.sol using the solc npm package and writes the
 * ABI + bytecode to blockchain/contracts/AuditLedger.json.
 *
 * Usage:  node blockchain/scripts/compile-contract.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const ROOT         = resolve(__dirname, '../../');
const CONTRACT_SRC = join(ROOT, 'blockchain/contracts/AuditLedger.sol');
const OUTPUT_PATH  = join(ROOT, 'blockchain/contracts/AuditLedger.json');

console.log('🔨  NeoLife — Compiling AuditLedger.sol...\n');

// Load solc
let solc;
try {
  solc = require('solc');
} catch {
  console.error('❌  solc not found. Run: npm install --save-dev solc');
  process.exit(1);
}

// Read source
const source = readFileSync(CONTRACT_SRC, 'utf-8');

// Build solc input object
const input = {
  language: 'Solidity',
  sources: {
    'AuditLedger.sol': { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
      },
    },
  },
};

// Compile
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  const fatal = output.errors.filter(e => e.severity === 'error');
  if (fatal.length) {
    console.error('❌  Compilation errors:');
    fatal.forEach(e => console.error('   ', e.formattedMessage));
    process.exit(1);
  }
  // Print warnings
  output.errors
    .filter(e => e.severity === 'warning')
    .forEach(e => console.warn('⚠️  ', e.formattedMessage));
}

const contractOutput = output.contracts['AuditLedger.sol']['AuditLedger'];

const artifact = {
  contractName : 'AuditLedger',
  abi          : contractOutput.abi,
  bytecode     : '0x' + contractOutput.evm.bytecode.object,
  deployedBytecode: '0x' + contractOutput.evm.deployedBytecode.object,
  compiler     : `solc ${solc.version()}`,
  compiledAt   : new Date().toISOString(),
};

mkdirSync(join(ROOT, 'blockchain/contracts'), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(artifact, null, 2), 'utf-8');

console.log('✅  Compiled successfully!');
console.log(`   ABI functions : ${artifact.abi.filter(f => f.type === 'function').length}`);
console.log(`   Output        : blockchain/contracts/AuditLedger.json\n`);
