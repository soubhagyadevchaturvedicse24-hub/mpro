import fetch from 'node-fetch';

async function checkBlocks() {
  const res = await fetch('http://localhost:5000/api/v1/audit/blocks');
  const json = await res.json();
  console.log('--- AUDIT BLOCKS REAL-TIME VERIFICATION ---');
  console.log('Success:', json.success);
  console.log('Total blocks in DB:', json.total);
  console.log('Count returned:', json.count);
  console.log('Latest block index:', json.data[0]?.blockIndex);
  if (json.total >= 700 && json.count >= 700) {
    console.log('✓ PASS: Total block count and returned blocks are no longer capped at 300!');
  } else {
    console.log(`Info: Total = ${json.total}, Count = ${json.count}`);
  }
}

checkBlocks();
