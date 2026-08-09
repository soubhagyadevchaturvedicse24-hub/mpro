import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, ShieldAlert, CheckCircle2, Search, CheckSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import IncidentDetailsModal from './components/IncidentDetailsModal';
import { confirmTamper } from '../../services/api';

const Incidents = () => {
  const { isDayMode } = useTheme();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const isGovAdmin = ['ADMIN', 'PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'].includes((user?.role || '').toUpperCase());

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('neolife_token');
      const res = await axios.get('/api/v1/audit/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rawIncidents = res.data.data;
      
      // Group incidents by Mission ID
      const grouped = rawIncidents.reduce((acc, inc) => {
        if (!acc[inc.entityId]) {
          acc[inc.entityId] = {
            missionId: inc.entityId,
            incidents: [],
            hasTamper: false
          };
        }
        acc[inc.entityId].incidents.push(inc);
        
        if (inc.eventType.includes('TAMPER')) {
          acc[inc.entityId].hasTamper = true;
        }
        
        return acc;
      }, {});

      const missionGroups = Object.values(grouped);

      // Sort groups: Tampered missions first, then by Mission ID
      missionGroups.sort((a, b) => {
        if (a.hasTamper && !b.hasTamper) return -1;
        if (!a.hasTamper && b.hasTamper) return 1;
        return a.missionId.localeCompare(b.missionId);
      });

      // Sort incidents within each group (newest first)
      missionGroups.forEach(group => {
        group.incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      setIncidents(missionGroups);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load incidents");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleConfirmTamper = async (e, missionId) => {
    e.stopPropagation();
    try {
      await confirmTamper(missionId, 'Tampering confirmed manually by Nodal Officer.');
      await fetchIncidents(); // Refresh to move it to the critical column
    } catch (err) {
      console.error(err);
      alert('Failed to confirm tampering on the blockchain.');
    }
  };

  const criticalMissions = incidents.filter(g => g.hasTamper);
  const warningMissions = incidents.filter(g => !g.hasTamper);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full min-h-[400px] ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Search size={32} className="opacity-50" />
          <p className="font-medium tracking-wide">Scanning blockchain records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4 opacity-80" />
          <h3 className={`text-lg font-bold mb-1 ${isDayMode ? 'text-gray-900' : 'text-white'}`}>Access Error</h3>
          <p className={`text-sm ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>{error}</p>
        </div>
      </div>
    );
  }

  const renderMissionCard = (group) => {
    const isCritical = group.hasTamper;
    const latestIncident = group.incidents[0];

    return (
      <div 
        key={group.missionId}
        onClick={() => setSelectedGroup(group)}
        className={`group rounded-xl border backdrop-blur-md transition-all p-4 mb-3.5 cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
          isDayMode 
            ? (isCritical 
                ? 'bg-gradient-to-br from-white/95 via-white/80 to-red-50/40 border-red-200/90 hover:border-red-500/80 hover:bg-white text-gray-800' 
                : 'bg-gradient-to-br from-white/95 via-white/80 to-amber-50/40 border-amber-200/90 hover:border-amber-500/80 hover:bg-white text-gray-800')
            : (isCritical 
                ? 'bg-gradient-to-br from-[#2A1215]/80 via-[#230F12]/75 to-[#1A0A0C]/90 border-red-500/20 hover:border-red-400/80 shadow-red-950/40 hover:bg-[#33161A]/90 text-slate-100'
                : 'bg-gradient-to-br from-[#2A2312]/80 via-[#231E0F]/75 to-[#1A160A]/90 border-amber-500/20 hover:border-amber-400/80 shadow-amber-950/40 hover:bg-[#332A16]/90 text-slate-100')
        }`}
      >
        <div className={`absolute inset-x-0 top-0 h-[1px] ${
          isDayMode 
            ? (isCritical ? 'bg-gradient-to-r from-transparent via-red-300/90 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-300/90 to-transparent') 
            : (isCritical ? 'bg-gradient-to-r from-transparent via-red-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-amber-500/40 to-transparent')
        }`} />

        <div className="flex justify-between items-start mb-2.5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border backdrop-blur-xs shadow-2xs ${
                isDayMode 
                  ? (isCritical ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')
                  : (isCritical ? 'bg-red-950/50 text-red-400 border-red-900/50' : 'bg-amber-950/50 text-amber-400 border-amber-900/50')
              }`}>
                {group.incidents.length} LOGS
              </span>
            </div>
            <h4 className={`font-bold font-mono text-sm transition-colors truncate max-w-[220px] mt-1.5 ${
              isDayMode 
                ? (isCritical ? 'text-red-900 group-hover:text-red-600' : 'text-amber-900 group-hover:text-amber-600')
                : (isCritical ? 'text-red-100 group-hover:text-red-400' : 'text-amber-100 group-hover:text-amber-400')
            }`}>
              {group.missionId}
            </h4>
          </div>

          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-xs flex items-center gap-1.5 shadow-2xs ${
            isDayMode 
              ? (isCritical ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300')
              : (isCritical ? 'bg-red-950 text-red-300 border-red-500/50' : 'bg-amber-950 text-amber-300 border-amber-500/50')
          }`}>
            {isCritical ? (
              <><ShieldAlert size={12}/> TAMPER RISK</>
            ) : (
              <><AlertCircle size={12}/> WARNING</>
            )}
          </span>
        </div>

        <div className={`text-xs mt-1 py-2 px-3 rounded-lg border backdrop-blur-xs relative z-10 ${
          isDayMode 
            ? 'bg-white/60 border-gray-100 text-gray-600 shadow-inner' 
            : 'bg-black/20 border-slate-700/50 text-slate-300 shadow-inner'
        }`}>
          <div className="font-medium opacity-80 mb-1">Latest Update:</div>
          <div className="truncate">{latestIncident?.payload?._summary || latestIncident?.eventType}</div>
          <div className="flex justify-between items-center mt-1">
            <div className="text-[10px] opacity-60">{new Date(latestIncident?.timestamp).toLocaleString()}</div>
            {!isCritical && isGovAdmin && (
              <button 
                onClick={(e) => handleConfirmTamper(e, group.missionId)}
                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
              >
                <CheckSquare size={12} /> Confirm Tamper
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 h-full flex flex-col transition-colors duration-200 ${isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#070C18]'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight transition-colors ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>
            Incident Audit Board
          </h1>
          <p className={`text-xs mt-0.5 font-medium transition-colors ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
            Blockchain-notarized transport anomalies and alerts
          </p>
        </div>
      </div>

      <div className={`flex-1 rounded-2xl shadow-xl backdrop-blur-md border transition-all duration-200 overflow-hidden flex flex-col ${
        isDayMode 
          ? 'bg-white/80 border-slate-200/80 shadow-slate-200/50' 
          : 'bg-[#0B101D]/90 border-slate-800 shadow-black/70'
      }`}>
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-80" />
            <h3 className={`text-lg font-bold mb-2 ${isDayMode ? 'text-gray-900' : 'text-white'}`}>No Incidents Found</h3>
            <p className={isDayMode ? 'text-gray-500' : 'text-slate-400'}>All transport missions have been fully compliant.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 min-h-0 flex-1 overflow-hidden transition-all duration-200 ${
            isDayMode ? 'bg-[#F4F7FC]/50' : 'bg-[#060A14]/60'
          }`}>
            
            {/* Column 1: Critical Intrusions */}
            <div className={`flex flex-col rounded-2xl p-4 border transition-all duration-200 max-h-full min-h-0 ${
              isDayMode 
                ? 'bg-[#FFFDFD] border-red-200/80 shadow-sm' 
                : 'bg-[#150D0D] border-red-500/25 shadow-lg shadow-black/30'
            }`}>
              <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-xs ${
                    isDayMode 
                      ? 'bg-red-500/15 text-red-700 border border-red-200/80' 
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}>
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-xs tracking-wider uppercase ${isDayMode ? 'text-red-900' : 'text-red-400'}`}>Critical Intrusions</h3>
                    <p className={`text-[10px] font-medium ${isDayMode ? 'text-red-700/70' : 'text-red-400/60'}`}>Tampering Detected</p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-sm flex items-center gap-1.5 ${
                  isDayMode ? 'bg-red-100/90 text-red-800 border-red-200/90' : 'bg-red-950/80 text-red-300 border-red-500/40'
                }`}>
                  {criticalMissions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {criticalMissions.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                {criticalMissions.length > 0 ? (
                  criticalMissions.map(renderMissionCard)
                ) : (
                  <div className={`text-xs font-medium italic text-center p-4 rounded-xl border border-dashed ${
                    isDayMode ? 'text-gray-400 border-gray-300' : 'text-slate-500 border-slate-700'
                  }`}>No critical intrusions</div>
                )}
              </div>
            </div>

            {/* Column 2: Telemetry Anomalies */}
            <div className={`flex flex-col rounded-2xl p-4 border transition-all duration-200 max-h-full min-h-0 ${
              isDayMode 
                ? 'bg-[#FFFDF8] border-amber-200/80 shadow-sm' 
                : 'bg-[#15120D] border-amber-500/25 shadow-lg shadow-black/30'
            }`}>
              <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-xs ${
                    isDayMode 
                      ? 'bg-amber-500/15 text-amber-700 border border-amber-200/80' 
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-xs tracking-wider uppercase ${isDayMode ? 'text-amber-900' : 'text-amber-300'}`}>Anomalies</h3>
                    <p className={`text-[10px] font-medium ${isDayMode ? 'text-amber-700/70' : 'text-amber-400/60'}`}>Temp / Battery / Alerts</p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${
                  isDayMode ? 'bg-amber-100/90 text-amber-800 border-amber-200/90' : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {warningMissions.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                {warningMissions.length > 0 ? (
                  warningMissions.map(renderMissionCard)
                ) : (
                  <div className={`text-xs font-medium italic text-center p-4 rounded-xl border border-dashed ${
                    isDayMode ? 'text-gray-400 border-gray-300' : 'text-slate-500 border-slate-700'
                  }`}>No anomalies detected</div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      <IncidentDetailsModal 
        isOpen={!!selectedGroup} 
        onClose={() => setSelectedGroup(null)} 
        group={selectedGroup} 
      />
    </div>
  );
};

export default Incidents;
