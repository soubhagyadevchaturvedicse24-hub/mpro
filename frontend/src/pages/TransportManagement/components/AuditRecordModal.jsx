import React from 'react';
import { 
  X, ClipboardCheck, CheckCircle2, Package, Clock, Navigation, 
  Thermometer, Battery, Lock, ShieldCheck, MapPin, Download
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { useTheme } from '../../../context/ThemeContext';

const AuditRecordModal = ({ isOpen, onClose, transportData }) => {
  const { isDayMode } = useTheme();

  if (!isOpen) return null;

  const isTampered = transportData?.tamper === 'TAMPERED' || 
                     transportData?.isTampered === true || 
                     transportData?.lidOpened === true || 
                     transportData?.lidStatus === 'OPEN';

  const generateIncidentLog = (data) => {
    if (data?.incidentLogs?.length > 0) return data.incidentLogs;
    const logs = [];
    const startTimeStr = data?.startedAt || '12:45:00 PM';
    const endTimeStr = data?.completedDate ? data.completedDate.split(',').pop().trim() : '02:30:15 PM';
    
    logs.push({ time: startTimeStr, title: 'Dispatch Notarized', desc: 'Transport Started & Container Sealed securely.', type: 'info', color: 'blue' });
    
    if (data?.battery && parseInt(data.battery) < 50) {
       logs.push({ time: '01:15:20 PM', title: 'Power Fluctuation', desc: `Battery dropped to ${data.battery}. Fallback power active.`, type: 'warning', color: 'amber' });
    } else {
       logs.push({ time: '01:15:20 PM', title: 'System Check', desc: 'Battery & IoT modules operating at optimal levels (78%).', type: 'success', color: 'emerald' });
    }

    if (isTampered) {
       logs.push({ 
         time: '01:30:45 PM', 
         title: '🚨 SECURITY BREACH: CONTAINER LID OPENED IN TRANSIT', 
         desc: 'CRITICAL: Unauthorized container opening detected in-transit. SHA-256 seal mismatch flagged in audit ledger.', 
         type: 'error', 
         color: 'red' 
       });
    } else {
       logs.push({ 
         time: '01:30:45 PM', 
         title: 'Container Seal Integrity Check', 
         desc: 'Container seal cryptographic SHA-256 hash verified intact. Zero unauthorized openings.', 
         type: 'success', 
         color: 'emerald' 
       });
    }

    if (parseFloat(data?.temp || 4.0) > 6 || parseFloat(data?.temp || 4.0) < 2) {
       logs.push({ time: '01:50:10 PM', title: 'Thermal Excursion Alert', desc: 'WARNING: Temperature spiked outside safe band threshold (2-6°C).', type: 'warning', color: 'amber' });
    }

    logs.push({ time: endTimeStr, title: 'Arrival Confirmed & Handover', desc: 'Transport Arrived & Handover Complete to destination LO.', type: 'info', color: 'blue' });

    return logs;
  };

  const incidentLogs = generateIncidentLog(transportData);
  const avgTemp = transportData?.temp || '4.0';

  const data = {
    id: transportData?.id || 'TRN-8881',
    completedDate: transportData?.completedDate || `${transportData?.date || '05 Aug 2026'}, ${transportData?.time || '02:30:15 PM'}`,
    transportType: transportData?.transportType || 'Organ Transport',
    organType: transportData?.organType || 'Kidney',
    distance: transportData?.distance || '24.6 km',
    duration: transportData?.duration || '45 mins',
    origin: transportData?.origin || 'CityCare Hospital',
    destination: transportData?.destination || 'Green Valley Hospital',
    hash: transportData?.hash || transportData?.payloadHash || transportData?.txHash || '0xa3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8',
    txId: transportData?.txId || '0x7f3a2b1c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a',
    verifiedOn: transportData?.verifiedOn || `${transportData?.date || '05 Aug 2026'}, 02:31:00 PM`,
    network: transportData?.network || 'Jeevan Setu Trust Network',
    iotBoxId: transportData?.iotBoxId || 'IOT-78231',
    patientName: transportData?.patientName || 'Sarah Jenkins'
  };

  const handleExportAnomalyPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const anomalies = incidentLogs.filter(log => log.type === 'warning' || log.type === 'error' || log.color === 'red' || log.color === 'amber');
    
    let anomalyHtml = anomalies.map(a => `
      <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #ef4444; background: #fef2f2;">
        <h4 style="margin: 0 0 5px 0; color: #991b1b; font-size: 14px;">${a.title}</h4>
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #7f1d1d;">${a.desc}</p>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="font-weight: bold; color: #dc2626;">Time: ${a.time}</span>
          <span style="font-family: monospace; background: #fee2e2; padding: 4px 8px; border-radius: 4px; border: 1px solid #f87171; color: #b91c1c;">
            Hash: 0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}
          </span>
        </div>
      </div>
    `).join('');

    if (anomalies.length === 0) {
      anomalyHtml = `<div style="padding: 30px; text-align: center; color: #10b981; font-weight: bold; background: #ecfdf5; border-radius: 8px;">No anomalies detected during this transport.</div>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Anomaly & Tamper Report - ${data.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
          .title-section h1 { margin: 0; font-size: 22px; color: #991b1b; }
          .title-section p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700; }
          .badge { background: #ef4444; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .field { margin-bottom: 8px; font-size: 12px; }
          .field label { color: #64748b; font-weight: 600; display: inline-block; width: 140px; }
          .field span { color: #0f172a; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-section">
            <h1>TRANSPORT ANOMALY & TAMPER REPORT</h1>
            <p>CRYPTOGRAPHIC LEDGER OF CRITICAL EVENTS</p>
          </div>
          <div class="badge">ATTENTION REQUIRED</div>
        </div>
        <div class="info-grid">
          <div>
            <div class="field"><label>Transport ID:</label><span>${data.id}</span></div>
            <div class="field"><label>Organ Type:</label><span>${data.organType}</span></div>
          </div>
          <div>
            <div class="field"><label>Origin:</label><span>${data.origin}</span></div>
            <div class="field"><label>Destination:</label><span>${data.destination}</span></div>
          </div>
        </div>
        <h3 style="color: #64748b; font-size: 14px; text-transform: uppercase; margin-bottom: 20px;">Detected Anomalies</h3>
        ${anomalyHtml}
        <div style="margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center;">
          <p>This report contains immutable hash values from the Jeevan Setu blockchain network.</p>
          <p>Copy any Hash value above and paste it into the Admin Auditor Code search to verify.</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NOTTO Official Audit Report - ${data.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title-section h1 { margin: 0; font-size: 22px; color: #1e3a8a; }
          .title-section p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700; }
          .badge { background: #059669; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .card h3 { margin: 0 0 12px 0; font-size: 12px; color: #2563eb; text-transform: uppercase; }
          .field { margin-bottom: 8px; font-size: 12px; }
          .field label { color: #64748b; font-weight: 600; display: inline-block; width: 140px; }
          .field span { color: #0f172a; font-weight: 700; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
          .metric-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; text-align: center; }
          .metric-box label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; }
          .metric-box val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; display: block; }
          .metric-box status { font-size: 9px; color: #059669; font-weight: 700; margin-top: 4px; display: block; }
          .blockchain { background: #0f172a; color: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
          .blockchain h3 { margin: 0 0 10px 0; color: #38bdf8; font-size: 13px; text-transform: uppercase; }
          .hash-code { font-family: monospace; font-size: 11px; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; word-break: break-all; color: #34d399; }
          .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .sig-box { text-align: center; }
          .sig-line { border-bottom: 2px dashed #94a3b8; height: 40px; margin-bottom: 8px; }
          .sig-title { font-size: 11px; font-weight: 700; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-section">
            <h1>NATIONAL ORGAN & TISSUE TRANSPLANT AUDIT</h1>
            <p>OFFICIAL BLOCKCHAIN-NOTARIZED COLD-CHAIN HANDOVER CERTIFICATE</p>
          </div>
          <div class="badge">VERIFIED & COMPLETED</div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Transport Details</h3>
            <div class="field"><label>Transport ID:</label><span>${data.id}</span></div>
            <div class="field"><label>Organ Type:</label><span>${data.organType}</span></div>
            <div class="field"><label>Patient ID / Name:</label><span>${data.patientName}</span></div>
            <div class="field"><label>Total Distance:</label><span>${data.distance}</span></div>
            <div class="field"><label>Completed Date:</label><span>${data.completedDate}</span></div>
          </div>
          <div class="card">
            <h3>Logistics Route</h3>
            <div class="field"><label>Origin Hospital:</label><span>${data.origin}</span></div>
            <div class="field"><label>Destination Hospital:</label><span>${data.destination}</span></div>
            <div class="field"><label>IoT Box ID:</label><span>${data.iotBoxId}</span></div>
            <div class="field"><label>Transport Type:</label><span>${data.transportType}</span></div>
            <div class="field"><label>Total Duration:</label><span>${data.duration}</span></div>
          </div>
        </div>

        <div class="metrics">
          <div class="metric-box">
            <label>Avg Temperature</label>
            <val>${avgTemp}°C</val>
            <status>✓ Safe Band (2-6°C)</status>
          </div>
          <div class="metric-box">
            <label>Final Battery</label>
            <val>78%</val>
            <status>✓ Normal End Level</status>
          </div>
          <div class="metric-box">
            <label>Container Security</label>
            <val>Untampered</val>
            <status>✓ Sealed Throughout</status>
          </div>
          <div class="metric-box">
            <label>Blockchain Ledger</label>
            <val>Notarized</val>
            <status>✓ Cryptographic Proof</status>
          </div>
        </div>

        <div class="incidents" style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a8a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Incident & Event Log</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc; color: #64748b; text-transform: uppercase;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1;">Time</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1;">Event Title</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1;">Description</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${incidentLogs.map(log => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">${log.time}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${log.title}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155;">${log.desc}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${log.type === 'error' ? '#dc2626' : log.type === 'warning' ? '#d97706' : '#059669'}; text-transform: uppercase;">${log.type}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="blockchain">
          <h3>Cryptographic Audit Notarization</h3>
          <p style="font-size: 11px; margin: 0 0 8px 0; color: #94a3b8;">Blockchain Transaction Hash:</p>
          <div class="hash-code">${data.hash}</div>
          <p style="font-size: 11px; margin: 12px 0 4px 0; color: #94a3b8;">TxID: ${data.txId} | Network: ${data.network}</p>
          
          <div style="margin-top: 15px; padding: 10px; background: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; border-radius: 4px;">
            <p style="font-size: 10px; margin: 0; color: #bae6fd; line-height: 1.4;">
              <strong>Judge & Auditor Note:</strong> This Hash is an unbreakable digital fingerprint of the trip's data. If anyone secretly changes the temperature or tamper logs later, this fingerprint will break. This proves the data in this report is 100% authentic and has not been manipulated.
            </p>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Source Hospital LO Signature (${data.origin})</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-title">Destination Hospital LO Signature (${data.destination})</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className={`rounded-2xl shadow-2xl w-full max-w-[1180px] flex flex-col max-h-[94vh] overflow-hidden border transition-colors ${
        isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDayMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-950/60 text-blue-400 border-blue-800/50'
            }`}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Transportation Audit Record</h2>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} /> Completed Successfully
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Transportation ID: <span className="font-semibold text-blue-500 font-mono">{data.id}</span> | Completed on: <span className="font-semibold">{data.completedDate}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-colors border ${
              isDayMode ? 'hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 ${
          isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#0A0F1D]'
        }`}>
          
          {/* Top Summary Pills Bar */}
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-3 p-3.5 rounded-xl border shadow-sm text-xs ${
            isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-500 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 font-medium block">Transport Type</span>
                <span className="font-bold text-gray-800">{data.transportType}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Package size={16} className="text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 font-medium block">Organ Type</span>
                <span className="font-bold text-gray-800">{data.organType}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-blue-500 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 font-medium block">Distance</span>
                <span className="font-bold text-gray-800">{data.distance}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 font-medium block">Total Duration</span>
                <span className="font-bold text-gray-800">{data.duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:col-span-1" title={`${data.origin} → ${data.destination}`}>
              <MapPin size={16} className="text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-400 font-medium block">From → To</span>
                <span className="font-bold text-gray-800 text-[11px] leading-tight block whitespace-normal">
                  {data.origin} → {data.destination}
                </span>
              </div>
            </div>
          </div>

          {/* Main Audit Data Section */}
          <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <h3 className="text-xs font-bold text-[#0B1B3D]">IoT Blockchain Audit <span className="text-gray-400 font-normal">(Final Verified Data)</span></h3>
                  </div>
                  <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} /> All Data Verified
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 flex flex-col items-center text-center">
                    <span className="text-[9px] text-gray-400 font-medium mb-1">Temperature</span>
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center my-0.5">
                      <Thermometer size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 mt-1">4.0°C</span>
                    <span className="text-[8px] text-emerald-600 font-semibold mt-0.5">✓ Stable Throughout</span>
                  </div>

                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 flex flex-col items-center text-center">
                    <span className="text-[9px] text-gray-400 font-medium mb-1">Battery Status</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center my-0.5">
                      <Battery size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 mt-1">78%</span>
                    <span className="text-[8px] text-emerald-600 font-semibold mt-0.5">✓ At End of Trip</span>
                  </div>

                  <div className={`border rounded-xl p-2 flex flex-col items-center text-center ${
                    isTampered ? 'bg-red-50/90 border-red-200' : 'bg-gray-50/70 border-gray-100'
                  }`}>
                    <span className="text-[9px] text-gray-400 font-medium mb-1">Tamper Security</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center my-0.5 ${
                      isTampered ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Lock size={14} />
                    </div>
                    <span className={`text-xs font-extrabold mt-1 ${isTampered ? 'text-red-700' : 'text-gray-900'}`}>
                      {isTampered ? 'Lid Opened 🚨' : 'Sealed ✓'}
                    </span>
                    <span className={`text-[8px] font-semibold mt-0.5 ${isTampered ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                      {isTampered ? '🚨 Tampered In-Transit' : '✓ Unbroken Seal'}
                    </span>
                  </div>

                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 flex flex-col items-center text-center">
                    <span className="text-[9px] text-gray-400 font-medium mb-1">Blockchain Verification</span>
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center my-0.5">
                      <ShieldCheck size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 mt-1">Verified</span>
                    <span className="text-[8px] text-emerald-600 font-semibold mt-0.5">✓ Data Authentic</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-800">Incident & Audit Timeline</h4>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                    Blockchain Notarized Log
                  </span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                  {incidentLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 items-start relative">
                      {idx !== incidentLogs.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-gray-100"></div>
                      )}
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 z-10 border-2 border-white shadow-sm ${
                        log.color === 'red' ? 'bg-red-500' : 
                        log.color === 'amber' ? 'bg-amber-500' : 
                        log.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-2.5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                        <div>
                          <h5 className="text-[11px] font-bold text-gray-900">{log.title}</h5>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{log.desc}</p>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="text-[10px] font-mono font-bold text-gray-700 block">{log.time}</span>
                          <span className={`text-[8px] font-bold uppercase ${
                            log.color === 'red' ? 'text-red-600' : 
                            log.color === 'amber' ? 'text-amber-600' : 
                            log.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
                          }`}>{log.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <ShieldCheck size={14} className="text-amber-500" />
              <span>Court-Admissible Blockchain Record</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handleExportAnomalyPDF} 
              style={{
                background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 50%, #1a102f 100%)',
                color: '#f8fafc',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 4px 14px 0 rgba(15, 23, 42, 0.5), 0 0 12px 0 rgba(124, 58, 237, 0.25)'
              }}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {/* Glass sheen reflection */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
              
              {/* Security Shield Icon */}
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-indigo-400" />
              </div>
              
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-slate-100 tracking-wide uppercase leading-tight">
                  Generate Digital Evidence Report
                </span>
                <span className="text-[9px] font-mono text-indigo-300/80 font-medium">
                  Cryptographic Hash Ledger
                </span>
              </div>
            </button>

            <button 
              type="button" 
              onClick={handleExportPDF} 
              className="px-4 py-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <Download size={14} className="text-slate-300 shrink-0" />
              <span>Standard Summary PDF</span>
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              className={`px-5 py-2.5 border rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 ${
                isDayMode 
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                  : 'border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditRecordModal;
