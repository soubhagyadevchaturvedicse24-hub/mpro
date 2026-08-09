import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import TransportBox from '../models/TransportBox.js';

(async () => {
  await connectDB();
  
  const boxes = await TransportBox.find({});
  console.log('\nCurrent boxes:');
  boxes.forEach(b => console.log(` - ${b.boxId} → status: ${b.status}`));

  if (boxes.length === 0) {
    console.log('No boxes found — creating 3 fresh AVAILABLE boxes...');
    await TransportBox.create([
      { boxId: 'BOX-CARD-1', deviceId: 'HW-MAC-CARD1', deviceSecret: 'secret123', status: 'AVAILABLE', lastKnownLocation: { type: 'Point', coordinates: [81.6296, 21.2514] } },
      { boxId: 'BOX-CARD-2', deviceId: 'HW-MAC-CARD2', deviceSecret: 'secret123', status: 'AVAILABLE', lastKnownLocation: { type: 'Point', coordinates: [81.6296, 21.2514] } },
      { boxId: 'BOX-CARD-3', deviceId: 'HW-MAC-CARD3', deviceSecret: 'secret123', status: 'AVAILABLE', lastKnownLocation: { type: 'Point', coordinates: [81.6296, 21.2514] } },
    ]);
    console.log('✅ Created 3 new AVAILABLE boxes.');
  } else {
    // Reset all non-AVAILABLE boxes to AVAILABLE
    const result = await TransportBox.updateMany(
      { status: { $ne: 'AVAILABLE' } },
      { $set: { status: 'AVAILABLE' } }
    );
    console.log(`\n✅ Reset ${result.modifiedCount} box(es) back to AVAILABLE.`);

    // Show updated state
    const updated = await TransportBox.find({});
    console.log('\nUpdated boxes:');
    updated.forEach(b => console.log(` - ${b.boxId} → status: ${b.status}`));
  }

  process.exit(0);
})();
