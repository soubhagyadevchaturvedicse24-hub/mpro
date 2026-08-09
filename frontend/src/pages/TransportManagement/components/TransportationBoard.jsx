import React from 'react';
import { CalendarClock, Radio, CheckCircle2 } from 'lucide-react';
import ScheduledCard from './ScheduledCard';
import OngoingCard from './OngoingCard';
import CompletedCard from './CompletedCard';

import { useTheme } from '../../../context/ThemeContext';

const TransportationBoard = ({ 
  scheduledItems = [], 
  ongoingItems = [], 
  completedItems = [], 
  onSelectScheduled, 
  onSelectTrack, 
  onSelectAudit 
}) => {
  const { isDayMode } = useTheme();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 min-h-0 flex-1 overflow-hidden transition-all duration-200 ${
      isDayMode ? 'bg-[#F4F7FC]/50' : 'bg-[#060A14]/60'
    }`}>
      
      {/* Column 1: Scheduled */}
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
              <CalendarClock size={16} />
            </div>
            <div>
              <h3 className={`font-extrabold text-xs tracking-wider uppercase ${isDayMode ? 'text-amber-900' : 'text-amber-300'}`}>Scheduled</h3>
              <p className={`text-[10px] font-medium ${isDayMode ? 'text-amber-700/70' : 'text-amber-400/60'}`}>Pre-dispatch logistics</p>
            </div>
          </div>
          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${
            isDayMode ? 'bg-amber-100/90 text-amber-800 border-amber-200/90' : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
          }`}>
            {scheduledItems.length}
          </span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {scheduledItems.map(transport => (
            <ScheduledCard key={transport.id} data={transport} onSelectScheduled={onSelectScheduled} />
          ))}
        </div>
      </div>

      {/* Column 2: In-Transit */}
      <div className={`flex flex-col rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden max-h-full min-h-0 ${
        isDayMode 
          ? 'bg-[#F0FDF4] border-emerald-300/80 shadow-md shadow-emerald-500/10' 
          : 'bg-[#061A14] border-emerald-500/40 shadow-xl shadow-emerald-950/50'
      }`}>
        {/* Animated Active Transport Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse z-10" />

        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative backdrop-blur-sm shadow-xs ${
              isDayMode 
                ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-300/80' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <Radio size={16} />
            </div>
            <div>
              <h3 className={`font-extrabold text-xs tracking-wider uppercase ${isDayMode ? 'text-emerald-900' : 'text-emerald-300'}`}>In-Transit</h3>
              <p className={`text-[10px] font-medium ${isDayMode ? 'text-emerald-700/70' : 'text-emerald-400/60'}`}>Active cold-chain telemetry</p>
            </div>
          </div>
          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-sm flex items-center gap-1.5 ${
            isDayMode ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300/90' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            {ongoingItems.length} LIVE
          </span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {ongoingItems.map(transport => (
            <OngoingCard key={transport.id} data={transport} onSelectTrack={onSelectTrack} />
          ))}
        </div>
      </div>

      {/* Column 3: Completed */}
      <div className={`flex flex-col rounded-2xl p-4 border transition-all duration-200 max-h-full min-h-0 ${
        isDayMode 
          ? 'bg-[#F1F5F9] border-blue-200/80 shadow-sm' 
          : 'bg-[#0D1627] border-blue-500/25 shadow-lg shadow-black/30'
      }`}>
        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-xs ${
              isDayMode 
                ? 'bg-blue-500/15 text-blue-700 border border-blue-200/80' 
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h3 className={`font-extrabold text-xs tracking-wider uppercase ${isDayMode ? 'text-blue-900' : 'text-blue-300'}`}>Completed</h3>
              <p className={`text-[10px] font-medium ${isDayMode ? 'text-blue-700/70' : 'text-blue-400/60'}`}>Handshake & audit log</p>
            </div>
          </div>
          <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${
            isDayMode ? 'bg-blue-100/90 text-blue-800 border-blue-200/90' : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
          }`}>
            {completedItems.length}
          </span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
          {completedItems.map(transport => (
            <CompletedCard key={transport.id} data={transport} onSelectAudit={onSelectAudit} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default TransportationBoard;
