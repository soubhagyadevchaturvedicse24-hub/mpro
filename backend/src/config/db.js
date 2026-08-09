import mongoose from 'mongoose';
import logger from '../logger/index.js';
import path from 'path';
import fs from 'fs';

let mongoServer;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/organ-transport', { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Primary DB connection failed (${error.message}), using robust local fallback database...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      
      const dbPath = path.join(process.cwd(), '.local-db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      logger.info(`Robust Local Database Connected: ${conn.connection.host} (Persistent)`);
      
      // Auto-seed only if the database is completely empty
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length === 0) {
          const { seedData } = await import('../scripts/seed.js');
          logger.info(`Auto-seeding robust local database...`);
          await seedData();
          logger.info(`Auto-seeding complete!`);
        } else {
          logger.info(`Local database already contains data. Skipping seed.`);
        }
      } catch (seedErr) {
        logger.error(`Auto-seeding failed: ${seedErr.message}`);
      }

    } catch (inMemErr) {
      logger.error(`Error starting in-memory DB: ${inMemErr.message}`);
      process.exit(1);
    }
  }
};
