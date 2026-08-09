import express from 'express';
import { getFullHealth } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const uptimeSec = Math.floor(process.uptime());
  res.status(200).json({
    status: 'ok',
    uptime: uptimeSec,
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

router.get('/health/full', getFullHealth);

export default router;
