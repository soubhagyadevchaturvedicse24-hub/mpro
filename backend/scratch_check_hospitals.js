import mongoose from 'mongoose';
import Hospital from './src/models/Hospital.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/organ-transport');
  const all = await Hospital.find({});
  console.log('TOTAL_HOSPITALS_IN_DB:', all.length);
  all.forEach(h => {
    console.log(- ID:  | Code:  | Name:  | Status: );
  });
  await mongoose.disconnect();
};
run().catch(console.error);
