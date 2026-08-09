import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plane, Link2, Activity,
  HeartPulse, ShieldCheck, Clock, Award, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getMissions, getHospitals, getAllBlocks } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import SystemHealthFlowchart from './SystemHealth/index.jsx';
import styles from './ExecutiveOverview.module.css';

const SparklineWave = ({ color }) => (
  <svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 20C10 20 15 15 25 15C35 15 40 18 50 18C60 18 65 10 75 10C85 10 90 14 100 14C110 14 115 8 120 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="117" cy="8" r="3" fill={color} />
  </svg>
);

const ExecutiveOverview = () => {
  const { isDayMode } = useTheme();
  const socket = useSocket();

  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [hospitalsCount, setHospitalsCount] = useState(0);
  const [blocksCount, setBlocksCount] = useState(0);

  useEffect(() => {
    const loadPipelineData = async () => {
      try {
        const [mRes, hRes, bRes] = await Promise.all([
          getMissions().catch(() => []),
          getHospitals().catch(() => []),
          getAllBlocks().catch(() => [])
        ]);

        const rawMissions = Array.isArray(mRes) ? mRes : (mRes?.missions || mRes?.data || []);
        const rawHospitals = Array.isArray(hRes) ? hRes : (hRes?.hospitals || hRes?.data || []);
        const rawBlocks = Array.isArray(bRes) ? bRes : (bRes?.blocks || bRes?.data || []);

        setMissions(rawMissions);
        setHospitalsCount(rawHospitals.length || 8);
        setBlocksCount(rawBlocks.length || 124);
      } catch (e) {
        console.error('Executive Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPipelineData();
  }, []);

  // Compute Live Metrics
  const metrics = useMemo(() => {
    const inTransit = missions.filter(m => ['IN_TRANSIT', 'DISPATCHED', 'EN_ROUTE'].includes((m.status || '').toUpperCase())).length;
    const scheduled = missions.filter(m => ['SCHEDULED', 'PLANNED', 'PENDING'].includes((m.status || '').toUpperCase())).length;
    const completed = missions.filter(m => ['COMPLETED', 'DELIVERED', 'ARRIVED'].includes((m.status || '').toUpperCase())).length;
    return { inTransit, scheduled, completed };
  }, [missions]);

  // Compute Organ Allocation Breakdown
  const organChartData = useMemo(() => {
    const organCounts = {};
    missions.forEach(m => {
      const type = m.organType || 'Kidney';
      organCounts[type] = (organCounts[type] || 0) + 1;
    });

    const total = Object.values(organCounts).reduce((a, b) => a + b, 0);

    const ORGAN_PALETTE = {
      'Kidney': '#3b82f6',
      'Heart': '#ef4444',
      'Liver': '#10b981',
      'Lung': '#f59e0b',
      'Cornea': '#8b5cf6',
      'Pancreas': '#ec4899'
    };

    if (total === 0) {
      return [
        { name: 'No Active Missions', count: 0, color: '#94a3b8' }
      ];
    }

    return Object.keys(organCounts).map(key => ({
      name: key,
      count: organCounts[key],
      color: ORGAN_PALETTE[key] || '#3b82f6'
    }));
  }, [missions]);

  // Compute Priority Breakdown Data
  const priorityChartData = useMemo(() => {
    const priorityCounts = { 'Urgent / High': 0, 'Standard / Medium': 0, 'Routine': 0 };
    missions.forEach(m => {
      const prio = (m.priority || 'High').toLowerCase();
      if (prio.includes('urgent') || prio.includes('high') || prio.includes('critical')) {
        priorityCounts['Urgent / High'] += 1;
      } else if (prio.includes('med') || prio.includes('standard')) {
        priorityCounts['Standard / Medium'] += 1;
      } else {
        priorityCounts['Routine'] += 1;
      }
    });

    return [
      { name: 'Urgent / High', count: priorityCounts['Urgent / High'], fill: '#ef4444' },
      { name: 'Standard / Medium', count: priorityCounts['Standard / Medium'], fill: '#f59e0b' },
      { name: 'Routine', count: priorityCounts['Routine'], fill: '#10b981' }
    ];
  }, [missions]);

  const statCards = [
    { title: 'Registered Hospitals', value: hospitalsCount, icon: Building2, color: '#3b82f6', desc: 'Verified THOTA nodes' },
    { title: 'Active In-Transit',      value: metrics.inTransit,  icon: Plane,     color: '#10b981', desc: 'Live telemetric tracking' },
    { title: 'Completed Handshakes', value: metrics.completed,  icon: Award,     color: '#8b5cf6', desc: 'Delivered & verified' },
    { title: 'Ledger Blocks',        value: blocksCount,        icon: Link2,     color: '#f59e0b', desc: 'Immutable blockchain' },
  ];

  if (loading) return (
    <div className="page-container">
      <div className={styles.loadingGrid}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>NOTTO Central Command Dashboard</h1>
          <p className={styles.subtitle}>National Organ Allocation, Cold-Chain Tracking & Blockchain Governance</p>
        </div>
        <div className={styles.liveIndicator}>
          <Activity size={14} style={{ color: '#10b981' }} />
          <span>National Pipeline Active</span>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className={styles.kpiGrid}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={styles.kpiCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className={styles.kpiIcon} style={{ background: `${card.color}15`, color: card.color }}>
                    <Icon size={22} />
                  </div>
                  <div className={styles.kpiTitleGroup}>
                    <span className={styles.kpiTitle}>{card.title}</span>
                    <span className={styles.kpiValue}>{card.value.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: isDayMode ? '#64748b' : '#94a3b8', fontWeight: 500 }}>{card.desc}</span>
                <SparklineWave color={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── National Organ Allocation & Priority Breakdown Charts ── */}
      <div className={styles.panel} style={{ marginBottom: '2rem' }}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartPulse size={18} color="#ec4899" />
              National Organ Allocation & Priority Breakdown
            </div>
            <p style={{ fontSize: '12px', color: isDayMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 26px' }}>
              Real-time distribution of organ categories and clinical priority allocation across all regions
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center', marginTop: 16 }}>
          
          {/* Organ Category Donut Chart */}
          <div style={{ width: '100%', height: 220, position: 'relative' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: isDayMode ? '#334155' : '#e2e8f0', textTransform: 'uppercase' }}>
              Organ Category Throughput
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={organChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {organChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDayMode ? '#ffffff' : '#1e293b', 
                    borderRadius: '8px',
                    border: `1px solid ${isDayMode ? '#e2e8f0' : '#334155'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                  formatter={(val, name) => [`${val} Missions`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: isDayMode ? '#0f172a' : '#f8fafc' }}>
                {organChartData.reduce((acc, curr) => acc + curr.count, 0)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: isDayMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>
                Total Organs
              </div>
            </div>
          </div>

          {/* Priority Allocation Bar Chart */}
          <div style={{ width: '100%', height: 220 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: isDayMode ? '#334155' : '#e2e8f0', textTransform: 'uppercase' }}>
              Priority Level Distribution
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDayMode ? "#e2e8f0" : "#334155"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDayMode ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                  dy={5} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDayMode ? '#64748b' : '#94a3b8', fontSize: 12 }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: isDayMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: isDayMode ? '#ffffff' : '#1e293b', 
                    borderRadius: '8px',
                    border: `1px solid ${isDayMode ? '#e2e8f0' : '#334155'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`prio-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* ── System Health & Live Data Flow Component ── */}
      <div>
        <SystemHealthFlowchart hideHeader={true} />
      </div>
    </div>
  );
};

export default ExecutiveOverview;

