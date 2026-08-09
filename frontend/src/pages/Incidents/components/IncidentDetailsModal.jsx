import React from 'react';
import { X, ShieldAlert, AlertCircle, FileCheck } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const IncidentDetailsModal = ({ isOpen, onClose, group }) => {
  const { isDayMode } = useTheme();
  
  if (!isOpen || !group) return null;

  const getIncidentIcon = (type, severity) => {
    if (severity === 'CRITICAL' || type.includes('TAMPER') || type.includes('CRITICAL')) {
      return <ShieldAlert size={15} />;
    }
    return <AlertCircle size={15} />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 ${
        isDayMode 
          ? 'bg-[#F8FAFC] border-gray-200 shadow-gray-400/50' 
          : 'bg-[#0B101D] border-slate-700 shadow-black/80'
      }`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b shrink-0 ${
          isDayMode ? 'bg-white border-gray-200' : 'bg-[#101827] border-slate-800'
        }`}>
          <div>
            <h2 className={`text-xl font-extrabold flex items-center gap-2 ${isDayMode ? 'text-gray-900' : 'text-slate-100'}`}>
              Incident Audit Trail: <span className="font-mono text-blue-500">{group.missionId}</span>
            </h2>
            <p className={`text-xs font-medium mt-1 ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
              Immutable blockchain records for this transportation.
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDayMode ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Logs Table */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className={`rounded-xl border overflow-hidden ${
            isDayMode ? 'bg-white border-gray-200' : 'bg-[#0F1623] border-slate-700'
          }`}>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase font-extrabold tracking-wider border-b ${
                isDayMode ? 'bg-gray-50/80 text-gray-500 border-gray-200' : 'bg-[#162032] text-slate-400 border-slate-700'
              }`}>
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Incident Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Blockchain Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
                {group.incidents.map((block) => {
                  const severity = block.payload?._severity || 'WARNING';
                  const summary = block.payload?._summary || block.eventType;
                  const isCritical = severity === 'CRITICAL' || block.eventType.includes('TAMPER') || block.eventType.includes('CRITICAL');
                  
                  return (
                    <tr key={block.blockIndex} className={`transition-colors ${
                      isDayMode ? 'hover:bg-gray-50/50' : 'hover:bg-slate-800/30'
                    }`}>
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${isDayMode ? 'text-gray-600' : 'text-slate-300'}`}>
                        {new Date(block.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          isCritical
                            ? (isDayMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-950/50 text-red-400 border-red-900/50')
                            : (isDayMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/50 text-amber-400 border-amber-900/50')
                        }`}>
                          {getIncidentIcon(block.eventType, severity)}
                          {block.payload?._alertType || block.eventType}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>
                        {summary}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                          isDayMode ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
                        }`} title={block.hash}>
                          <FileCheck size={13} />
                          {block.hash.substring(0, 14)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;
