import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, Clock, HeartPulse, Activity, UserPlus, Building2, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, WifiOff, Thermometer, Battery
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSimulatorContext } from '../context/SimulatorContext';
import { useTheme } from '../context/ThemeContext';
import { getMissions } from '../services/api';
import { useHospitals } from '../data/useHospitals';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './HospitalOverview.module.css';

const SparklineWave = ({ color }) => (
  <svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 20C10 20 15 15 25 15C35 15 40 18 50 18C60 18 65 10 75 10C85 10 90 14 100 14C110 14 115 8 120 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="117" cy="8" r="3" fill={color} />
  </svg>
);

const HospitalOverview = () => {
  const { user } = useAuth();
  const { isDayMode } = useTheme();
  const socket = useSocket();
  const sim = useSimulatorContext();
  const navigate = useNavigate();
  const { hospitals } = useHospitals();

  const userHospitalName = user?.hospitalName || user?.name || user?.displayName || (hospitals[0]?.name || 'CityCare Hospital');
  const greetingName = user?.displayName || user?.name || userHospitalName;

  const [allMissions, setAllMissions] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [metrics, setMetrics] = useState({ inTransit: 0, scheduled: 0, completed: 0 });
  const [telemetryState, setTelemetryState] = useState({});

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await getMissions();
        const data = Array.isArray(res) ? res : (res?.missions || res?.data || []);
        setAllMissions(data);

        const inT = data.filter(m => ['IN_TRANSIT', 'DISPATCHED', 'EN_ROUTE'].includes((m.status || '').toUpperCase())).length;
        const sch = data.filter(m => ['SCHEDULED', 'PLANNED', 'PENDING'].includes((m.status || '').toUpperCase())).length;
        const cmp = data.filter(m => ['COMPLETED', 'DELIVERED', 'ARRIVED'].includes((m.status || '').toUpperCase())).length;

        setMetrics({ inTransit: inT, scheduled: sch, completed: cmp });
        setActiveMissions(data.filter(m => ['IN_TRANSIT', 'DISPATCHED'].includes((m.status || '').toUpperCase())));
      } catch (err) {
        console.error('Failed to fetch real missions', err);
      }
    };
    fetchMissions();
  }, [user]);

  const organChartData = React.useMemo(() => {
    const organCounts = {};
    
    allMissions.forEach(m => {
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
        { name: 'No Transports Registered', count: 0, color: '#94a3b8' }
      ];
    }

    return Object.keys(organCounts).map(key => ({
      name: key,
      count: organCounts[key],
      color: ORGAN_PALETTE[key] || '#3b82f6'
    }));
  }, [allMissions]);

  useEffect(() => {
    if (!socket) return;
    const handleTelemetry = (payload) => {
      setTelemetryState(prev => ({ ...prev, [payload.missionId || payload.boxId]: payload.telemetry }));
    };
    socket.on('transport:telemetry', handleTelemetry);
    return () => socket.off('transport:telemetry', handleTelemetry);
  }, [socket]);

  return (
    <div className={`${styles.container} ${isDayMode ? styles.dayMode : styles.nightMode}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hospital Dashboard 👋</h1>
          <p className={styles.subtitle}>Welcome back, <span style={{color: '#10b981', fontWeight: '700'}}>{greetingName}</span></p>
        </div>
        <div className={styles.liveIndicator}>
          <CheckCircle2 size={16} />
          <span>System Nominal</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <div className={styles.iconWrapper} style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                  <Plane size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <div className={styles.metricValue}>{metrics.inTransit}</div>
                  <div className={styles.metricLabel}>In Transit</div>
                </div>
              </div>
              <div className={styles.metricBottom}>
                <div className={styles.metricDesc}>Live tracking active</div>
                <div className={styles.sparklineWrap}>
                  <SparklineWave color="#3b82f6" />
                </div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <div className={styles.iconWrapper} style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
                  <Clock size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <div className={styles.metricValue}>{metrics.scheduled}</div>
                  <div className={styles.metricLabel}>Scheduled</div>
                </div>
              </div>
              <div className={styles.metricBottom}>
                <div className={styles.metricDesc}>Pending dispatch</div>
                <div className={styles.sparklineWrap}>
                  <SparklineWave color="#f59e0b" />
                </div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricTop}>
                <div className={styles.iconWrapper} style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                  <HeartPulse size={24} />
                </div>
                <div className={styles.metricInfo}>
                  <div className={styles.metricValue}>{metrics.completed}</div>
                  <div className={styles.metricLabel}>Completed</div>
                </div>
              </div>
              <div className={styles.metricBottom}>
                <div className={styles.metricDesc}>Successfully delivered</div>
                <div className={styles.sparklineWrap}>
                  <SparklineWave color="#8b5cf6" />
                </div>
              </div>
            </div>
          </div>

          {/* Organ Breakdown Graph Section */}
          <div className={styles.sectionCard} style={{ marginBottom: 32 }}>
            <div className={styles.sectionHeader} style={{ marginBottom: 20 }}>
              <div>
                <div className={styles.sectionTitle} style={{ gap: 8 }}>
                  <HeartPulse size={18} color="#ec4899" />
                  Organ Distribution & Category Breakdown
                </div>
                <p style={{ fontSize: '12px', color: isDayMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 26px' }}>
                  Real-time organ volume breakdown across Kidney, Heart, Liver, Lung, Cornea, and Pancreas
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
              
              {/* Donut Chart */}
              <div style={{ width: '100%', height: 210, position: 'relative' }}>
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
                      formatter={(val, name) => [`${val} Transports`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: isDayMode ? '#0f172a' : '#f8fafc' }}>
                    {organChartData.reduce((acc, curr) => acc + curr.count, 0)}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: isDayMode ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>
                    Total Organs
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={organChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDayMode ? "#e2e8f0" : "#334155"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDayMode ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 600 }} 
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
                      {organChartData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        
        {/* Quick Actions (Now Full Width/Centered) */}

        {/* Right Column: Quick Actions */}
        <div>
          <div className={styles.sectionCard} style={{marginBottom: 0}}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Activity size={18} color="#10b981" />
                Quick Actions
              </div>
            </div>
            
            <div className={styles.actionList}>
              <div className={styles.actionItem} onClick={() => navigate('/dashboard/transport-management')}>
                <div className={styles.actionLeft}>
                  <div className={styles.actionIconWrap} style={{background: '#eff6ff', color: '#3b82f6'}}>
                    <Plane size={18} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionTextTitle}>Manage Transports</span>
                    <span className={styles.actionTextSub}>Create, track and manage organ transports</span>
                  </div>
                </div>
                <ChevronRight size={18} className={styles.actionChevron} />
              </div>
              


              <div className={styles.actionItem} onClick={() => navigate('/dashboard/hospital-registry')}>
                <div className={styles.actionLeft}>
                  <div className={styles.actionIconWrap} style={{background: '#f5f3ff', color: '#8b5cf6'}}>
                    <Building2 size={18} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionTextTitle}>Hospital Profile</span>
                    <span className={styles.actionTextSub}>View and update hospital information</span>
                  </div>
                </div>
                <ChevronRight size={18} className={styles.actionChevron} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HospitalOverview;

