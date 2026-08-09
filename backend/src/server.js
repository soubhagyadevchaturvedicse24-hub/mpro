import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import logger from './logger/index.js';
import { connectDB } from './config/db.js';
import { startHospitalComplianceCron } from './cron/hospitalCompliance.cron.js';
import { initializeAuditSubscriber } from './blockchain/subscribers/audit.subscriber.js';
import { initializeSocket } from './websocket/socket.service.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

connectDB().then(() => {
  initializeAuditSubscriber();
  
  // Initialize WebSockets
  initializeSocket(server);

  // Start cron jobs if enabled
  if (process.env.ENABLE_COMPLIANCE_CRON !== 'false') {
    startHospitalComplianceCron();
    logger.info('Hospital compliance cron ENABLED (daily at 02:00 IST)');
  } else {
    logger.info('Hospital compliance cron DISABLED');
  }

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Health check: GET /health`);
  });
});
