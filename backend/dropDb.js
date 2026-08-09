import { connectDB } from './src/config/db.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
connectDB().then(async () => {
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped');
  process.exit(0);
});
