import React from 'react';
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const CompletedCard = ({ data, onSelectAudit }) => {
  const { isDayMode } = useTheme();
  const { user } = useAuth();
  const isGovAdmin = ['ADMIN', 'PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'].includes((user?.role || '').toUpperCase());

  return (
    <div 
      onClick={() => onSelectAudit && onSelectAudit(data)}
      className={`group rounded-xl border backdrop-blur-md transition-all p-4 mb-3.5 cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        isDayMode 
          ? 'bg-gradient-to-br from-white/95 via-white/80 to-blue-50/40 border-white/90 hover:border-blue-400/80 hover:bg-white text-gray-800' 
          : 'bg-gradient-to-br from-[#14233D]/80 via-[#101D33]/75 to-[#0B1526]/90 border-blue-500/20 hover:border-blue-400/80 shadow-black/40 hover:bg-[#182B4B]/90 text-slate-100'
      }`}
    >
      {/* Top Glass Sheen Highlight Line */}
      <div className={`absolute inset-x-0 top-0 h-[1px] ${
        isDayMode ? 'bg-gradient-to-r from-transparent via-blue-200/90 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent'
      }`} />

      {/* Top Row: Organ & Patient + Status Badge */}
      <div className="flex justify-between items-start mb-2.5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border backdrop-blur-xs shadow-2xs ${
              isDayMode 
                ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-800 border-blue-200/80' 
                : 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-300 border-blue-500/40'
            }`}>
              {data.organType || 'Kidney'}
            </span>
            <span className={`text-xs font-mono font-medium ${isDayMode ? 'text-gray-400' : 'text-slate-400'}`}>{data.id}</span>
          </div>
          <h4 className={`font-bold text-sm transition-colors truncate max-w-[220px] ${
            isDayMode ? 'text-gray-900 group-hover:text-blue-600' : 'text-slate-100 group-hover:text-blue-400'
          }`} title={isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}>
            {isGovAdmin ? `${data.organType || 'Organ'} Transport Logistics` : data.patientName}
          </h4>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-xs flex items-center gap-1 shadow-2xs ${
          isDayMode 
            ? 'bg-gradient-to-r from-emerald-100/90 to-emerald-50/70 text-emerald-800 border-emerald-200/90' 
            : 'bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 text-emerald-300 border-emerald-500/40'
        }`}>
          <CheckCircle2 size={11} /> Delivered
        </span>
      </div>

      {/* Route Info */}
      <div className={`flex items-center gap-2 text-xs my-2 px-3 py-2 rounded-lg border backdrop-blur-xs relative z-10 ${
        isDayMode 
          ? 'bg-gradient-to-r from-blue-50/50 via-white/60 to-blue-50/50 text-blue-900 border-blue-100/70 shadow-inner' 
          : 'bg-gradient-to-r from-[#0B1527]/90 via-[#08101E]/80 to-[#0B1527]/90 text-slate-300 border-blue-500/15 shadow-inner shadow-black/30'
      }`}>
        <MapPin size={13} className="text-gray-400 shrink-0" />
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.origin}</span>
        <span className="text-gray-400 font-light">→</span>
        <span className={`font-medium truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.destination}</span>
      </div>

      {/* Footer: Delivery Info & Action Button */}
      <div className="flex justify-between items-center pt-1 mt-1 text-xs relative z-10">
        <span className={`text-[11px] font-mono font-medium flex items-center gap-1 ${isDayMode ? 'text-blue-700' : 'text-blue-400'}`}>
          <CheckCircle2 size={11} className="text-blue-500" /> Audit Verified
        </span>

        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAudit && onSelectAudit(data);
          }}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-[0.98] ${
            isDayMode 
              ? 'bg-blue-500/15 hover:bg-blue-600 text-blue-900 hover:text-white border border-blue-200/80' 
              : 'bg-blue-500/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40'
          }`}
        >
          <span>View Audit</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default CompletedCard;
