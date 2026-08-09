import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const LedgerBlock = (await import('./src/models/LedgerBlock.js')).default;
  const MiniBlockchainAdapter = (await import('./src/blockchain/adapters/MiniBlockchainAdapter.js')).default;
  const adapter = new MiniBlockchainAdapter();
  
  const block = await LedgerBlock.findOne({ blockIndex: 33 }).lean();
  console.log('--- Block 33 ---');
  console.log('block.hash:', block.hash);
  
  const rawPayload = block.payload ? JSON.parse(JSON.stringify(block.payload)) : block.payload;
  const canonicalPayload = adapter._canonicalStringify(rawPayload);
  const dataString = `${block.blockIndex}|${block.timestamp.toISOString()}|${block.previousHash}|${block.eventType}|${block.entityType}|${block.entityId}|${canonicalPayload}|${block.arweaveTxId || 'none'}`;
  const expectedHash = crypto.createHash('sha256').update(dataString).digest('hex');
  
  console.log('expectedHash:', expectedHash);
  console.log('DATA STRING USED FOR VERIFY:');
  console.log(dataString);
  
  const prevBlock = await LedgerBlock.findOne({ blockIndex: 32 }).lean();
  console.log('Actual previousBlock.hash:', prevBlock ? prevBlock.hash : 'none');
  console.log('block.previousHash stored:', block.previousHash);
  
  process.exit(0);
});
