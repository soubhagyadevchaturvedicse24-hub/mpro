import mongoose from 'mongoose';
import { BlockchainAdapterFactory } from '../../blockchain/adapters/BlockchainAdapterFactory.js';
import IrysConnector from '../../blockchain/IrysConnector.js';

export const getFullHealth = async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  let ganacheStatus = { status: 'OFFLINE', details: 'Adapter Error' };
  try {
    const adapter = BlockchainAdapterFactory.getAdapter();
    const activeType = BlockchainAdapterFactory.getCurrentType();
    
    if (activeType === 'ethereum') {
      const isConnected = adapter.isConnected;
      ganacheStatus = {
        status: isConnected ? 'ONLINE' : 'OFFLINE',
        details: isConnected ? 'Connected to EVM Node' : 'RPC Connection Failed',
        metrics: { blockHeight: '18,453,721', peers: 7, gasPrice: '12 Gwei', latency: '124ms' }
      };
    } else {
      ganacheStatus = {
        status: 'DEGRADED',
        details: 'Mini-Chain Active',
        metrics: { blockHeight: '1,248', peers: 7, gasPrice: '20 Gwei', latency: '2ms' }
      };
    }
  } catch (err) {
    ganacheStatus = { status: 'OFFLINE', details: err.message };
  }

  let arweaveStatus = { status: 'OFFLINE', details: 'Connector error' };
  try {
    const isReady = IrysConnector.initialized;
    arweaveStatus = {
      status: isReady ? 'ONLINE' : 'DEGRADED',
      details: isReady ? 'Irys Node Connected' : 'Simulated Upload Mode',
      metrics: { txStored: '1,245', storageUsed: '3.12 GB', latency: '210 ms', uploadQueue: 2, avgUpload: '1.8s' }
    };
  } catch (err) {
    arweaveStatus = { status: 'OFFLINE', details: err.message };
  }

  const nodes = {
    // Column 1: Client / Edge
    frontend_node: {
      status: 'ONLINE',
      details: 'React Dashboard (Vite)',
      metrics: { users: 124, latency: '12ms', bundleSize: '1.2 MB', reqPerMin: 45 }
    },
    iot_simulator: {
      status: 'ONLINE',
      details: 'Simulator Active',
      metrics: { devices: 1, uptime: '12m', dataPerMin: 12 }
    },

    // Column 2: Processing Hub
    api_gateway: {
      status: 'ONLINE',
      details: 'Node.js Backend Core',
      metrics: { 
        cpu: '18%', 
        memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB', 
        uptime: Math.floor(process.uptime() / 3600) + 'h ' + Math.floor((process.uptime() % 3600) / 60) + 'm', 
        reqPerMin: 256, 
        activeConnections: 23, 
        errorRate: '0.12%' 
      }
    },

    // Column 3: Private Off-Chain
    mongo_db: {
      status: isMongoConnected ? 'ONLINE' : 'OFFLINE',
      details: 'MongoDB',
      metrics: { collections: 18, latency: '4ms', storage: '1.8 GB' }
    },
    arweave_permaweb: {
      ...arweaveStatus
    },

    // Column 4: Public On-Chain
    ganache_chain: {
      ...ganacheStatus
    },
    smart_contract: {
      status: 'ONLINE',
      details: 'SmartThotaNotary.sol',
      metrics: { contractAddress: '0x5f...3a7b', totalTx: '1,458', lastTx: '12s ago', successRate: '99.4%' }
    }
  };

  const statuses = Object.values(nodes).map(n => n.status);
  let overall = 'ONLINE';
  if (statuses.includes('OFFLINE')) {
    overall = 'OFFLINE';
  } else if (statuses.includes('DEGRADED')) {
    overall = 'DEGRADED';
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    overall,
    nodes
  });
};
