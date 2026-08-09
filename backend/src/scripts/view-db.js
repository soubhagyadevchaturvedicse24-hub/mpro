import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

dotenv.config();

const viewDatabase = async () => {
  console.log('\n==================================================');
  console.log('      JEEVAN SETU — LIVE MONGODB DATA VIEWER     ');
  console.log('==================================================\n');

  await connectDB();

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`📌 Connected Database: "${mongoose.connection.db.databaseName}"`);
  console.log(`📁 Total Collections Found: ${collections.length}\n`);

  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`--------------------------------------------------`);
    console.log(`📂 Collection: "${col.name}" | Total Records: ${count}`);
    const sample = await mongoose.connection.db.collection(col.name).find().limit(2).toArray();
    console.log(`   Sample Data Record:`, JSON.stringify(sample[0] || {}, null, 2));
  }

  console.log('\n==================================================\n');
  process.exit(0);
};

viewDatabase();
