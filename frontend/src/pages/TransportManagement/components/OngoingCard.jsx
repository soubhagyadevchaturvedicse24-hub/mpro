import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const OngoingCard = ({ data, onSelectTrack }) => {
  const { isDayMode } = useTheme();
  const { user } = useAuth();
  const isGovAdmin = ['ADMIN', 'PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'].includes((user?.role || '').toUpperCase());

  return (
    <div 
      onClick={() => onSelectTrack && onSelectTrack(data)}
      className={`group rounded-xl border backdrop-blur-md transition-all p-4 mb-3.5 cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        isDayMode 
          ? 'bg-gradient-to-br from-white/95 via-white/80 to-emerald-50/40 border-white/90 hover:border-emerald-500/80 hover:bg-white text-gray-800' 
          : 'bg-gradient-to-br from-[#122A23]/80 via-[#0F231D]/75 to-[#0A1A15]/90 border-emerald-500/20 hover:border-emerald-400/80 shadow-emerald-950/40 hover:bg-[#16332B]/90 text-slate-100'
      }`}
    >
      {/* Top Glass Sheen Highlight Line */}
      <div className={`absolute inset-x-0 top-0 h-[1px] ${
        isDayMode ? 'bg-gradient-to-r from-transparent via-emerald-200/90 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent'
      }`} />

      {/* Top Row: Organ & Patient + Status Badge */}
      <div className="flex justify-between items-start mb-2.5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border backdrop-blur-xs shadow-2xs ${
              isDayMode 
                ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-800 border-emerald-200/80' 
                : 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 border-emerald-500/40'
            }`}>
              {data.organType || 'Kidney'}
            </span>
            <span className={`text-xs font-mono font-medium ${isDayMode ? 'text-gray-400' : 'text-slate-400'}`}>{data.id}</span>
          </div>
          <h4 className={`font-bold text-sm transition-colors truncate max-w-[220px] ${
            isDayMode ? 'text-gray-900 group-hover:text-emerald-600' : 'text-slate-100 group-hover:text-emerald-400'
          }`} title={isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}>
            {isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}
          </h4>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-xs flex items-center gap-1.5 shadow-2xs ${
          isDayMode 
            ? 'bg-gradient-to-r from-emerald-100/90 to-emerald-50/70 text-emerald-800 border-emerald-200/90' 
            : 'bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 text-emerald-300 border-emerald-500/40'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          In-Transit
        </span>
      </div>

      {/* Route Info */}
      <div className={`flex items-center gap-2 text-xs my-2 px-3 py-2 rounded-lg border backdrop-blur-xs relative z-10 ${
        isDayMode 
          ? 'bg-gradient-to-r from-emerald-50/50 via-white/60 to-emerald-50/50 text-emerald-900 border-emerald-100/70 shadow-inner' 
          : 'bg-gradient-to-r from-[#081814]/90 via-[#061410]/80 to-[#081814]/90 text-emerald-200 border-emerald-500/15 shadow-inner shadow-black/30'
      }`}>
        <MapPin size={13} className="text-emerald-500 shrink-0" />
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.origin}</span>
        <span className="text-gray-400 font-light">→</span>
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.destination}</span>
      </div>

      {/* Footer Action Button */}
      <div className="flex justify-end pt-1 mt-1 text-xs relative z-10">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTrack && onSelectTrack(data);
          }}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-[0.98] border border-emerald-500/50"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span className="text-white">Track Live</span>
          <ArrowRight size={12} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default OngoingCard;
