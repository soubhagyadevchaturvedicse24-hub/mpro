import crypto from 'crypto';
import logger from '../logger/index.js';

/**
 * IrysConnector — DEMO MODE (offline)
 * Irys permaweb upload is disabled for offline demo.
 * All uploads return a deterministic mock TX ID instantly.
 * Re-enable by restoring the original IrysConnector.js with @irys/sdk.
 */
class IrysConnector {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;
        logger.info('Irys Network: DEMO MODE — offline (no external calls). Permaweb upload simulated.');
    }

    maskPayload(payload) {
        if (!payload) return payload;
        const masked = JSON.parse(JSON.stringify(payload));
        const redact = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            for (let key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    redact(obj[key]);
                } else if (['name', 'phone', 'email', 'address', 'nextOfKinName', 'nextOfKinContact', 'hospitalCode', 'registrationNumber'].includes(key)) {
                    if (obj[key]) {
                        obj[key] = 'MASKED:' + crypto.createHash('sha256').update(String(obj[key])).digest('hex').substring(0, 16);
                    }
                }
            }
        };
        redact(masked);
        return masked;
    }

    async uploadPayload(payload) {
        // DEMO MODE: Return a deterministic mock TX ID without any network call
        await this.init();
        const mockTx = 'DEMO_' + crypto.createHash('sha256')
            .update(JSON.stringify(payload || {}) + Date.now())
            .digest('hex').substring(0, 43);
        logger.info(`[Irys] DEMO MODE — Simulated permaweb TX: ${mockTx}`);
        return mockTx;
    }
}

export default new IrysConnector();
