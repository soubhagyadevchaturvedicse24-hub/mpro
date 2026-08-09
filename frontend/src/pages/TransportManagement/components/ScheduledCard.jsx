import React from 'react';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const ScheduledCard = ({ data, onSelectScheduled }) => {
  const { isDayMode } = useTheme();
  const { user } = useAuth();
  const isGovAdmin = ['ADMIN', 'PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'].includes((user?.role || '').toUpperCase());

  return (
    <div 
      onClick={() => onSelectScheduled && onSelectScheduled(data)}
      className={`group rounded-xl border backdrop-blur-md transition-all p-4 mb-3.5 cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        isDayMode 
          ? 'bg-gradient-to-br from-white/95 via-white/80 to-amber-50/30 border-white/90 hover:border-amber-400/80 hover:bg-white text-gray-800' 
          : 'bg-gradient-to-br from-[#192742]/80 via-[#131F36]/75 to-[#0E1729]/90 border-white/15 hover:border-amber-500/60 shadow-black/40 hover:bg-[#1C2C4A]/90 text-slate-100'
      }`}
    >
      {/* Top Glass Sheen Highlight Line */}
      <div className={`absolute inset-x-0 top-0 h-[1px] ${
        isDayMode ? 'bg-gradient-to-r from-transparent via-white/90 to-transparent' : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
      }`} />

      {/* Top Row: Organ & Patient + Status Badge */}
      <div className="flex justify-between items-start mb-2.5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border backdrop-blur-xs shadow-2xs ${
              isDayMode 
                ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-800 border-amber-200/80' 
                : 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-300 border-amber-500/40'
            }`}>
              {data.organType || 'Kidney'}
            </span>
            <span className={`text-xs font-mono font-medium ${isDayMode ? 'text-gray-400' : 'text-slate-400'}`}>{data.id}</span>
          </div>
          <h4 className={`font-bold text-sm transition-colors truncate max-w-[220px] ${
            isDayMode ? 'text-gray-900 group-hover:text-amber-600' : 'text-slate-100 group-hover:text-amber-400'
          }`} title={isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}>
            {isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}
          </h4>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-xs shadow-2xs ${
          isDayMode 
            ? 'bg-gradient-to-r from-amber-100/90 to-amber-50/70 text-amber-800 border-amber-200/90' 
            : 'bg-gradient-to-r from-amber-950/80 to-amber-900/50 text-amber-300 border-amber-500/40'
        }`}>
          Scheduled
        </span>
      </div>

      {/* Route Info */}
      <div className={`flex items-center gap-2 text-xs my-2 px-3 py-2 rounded-lg border backdrop-blur-xs relative z-10 ${
        isDayMode 
          ? 'bg-gradient-to-r from-amber-50/40 via-white/60 to-amber-50/40 text-gray-700 border-amber-100/70 shadow-inner' 
          : 'bg-gradient-to-r from-[#0C1527]/90 via-[#0B1324]/80 to-[#0C1527]/90 text-slate-300 border-white/10 shadow-inner shadow-black/30'
      }`}>
        <MapPin size={13} className="text-blue-400 shrink-0" />
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.origin}</span>
        <span className="text-gray-400 font-light">→</span>
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.destination}</span>
      </div>

      {/* Footer Details & Action */}
      <div className="flex justify-between items-center pt-1 mt-1 text-xs relative z-10">
        <div className={`flex items-center gap-1 text-[11px] font-medium ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
          <Clock size={12} className={isDayMode ? 'text-amber-600' : 'text-amber-400'} />
          <span>{data.time || '01:00 PM'}</span>
        </div>

        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectScheduled && onSelectScheduled(data);
          }}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-[0.98] ${
            isDayMode 
              ? 'bg-amber-500/15 hover:bg-amber-500 text-amber-900 hover:text-white border border-amber-300/80' 
              : 'bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-gray-950 border border-amber-500/40'
          }`}
        >
          <span>View Details</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default ScheduledCard;
