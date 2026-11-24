import mongoose from 'mongoose';
import logger from '../logger/index.js';
import path from 'path';
import fs from 'fs';

let mongoServer;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  // ── Try Atlas / remote URI first (only if it looks like a real URI) ───
  const useAtlas = mongoUri && mongoUri.startsWith('mongodb') && !mongoUri.startsWith('mongodb://localhost') && mongoUri !== 'local';

  if (useAtlas) {
    try {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      logger.info(`MongoDB Connected (Atlas): ${conn.connection.host}`);
      return; // ← success, done
    } catch (error) {
      logger.warn(`Atlas connection failed (${error.message}) — switching to local persistent DB...`);
    }
  }

  // ── Persistent local WiredTiger DB (guaranteed offline-first) ─────────
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');

    const dbPath = path.join(process.cwd(), '.local-db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });

    const uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);
    logger.info(`Local Persistent DB Connected: ${conn.connection.host} (WiredTiger @ ${dbPath})`);

    // Auto-seed ONLY if DB is completely empty
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      if (collections.length === 0) {
        logger.info('Empty DB detected — running auto-seed...');
        const { seedData } = await import('../scripts/seed.js');
        await seedData();
        logger.info('Auto-seed complete!');
      } else {
        logger.info(`Local DB has existing data (${collections.length} collections). Skipping seed.`);
      }
    } catch (seedErr) {
      logger.error(`Auto-seed failed: ${seedErr.message}`);
    }
  } catch (localErr) {
    logger.error(`FATAL: Cannot start local DB — ${localErr.message}`);
    process.exit(1);
  }
};
