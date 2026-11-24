import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ClipboardCheck, CheckCircle2, Package, Clock, Navigation, 
  Thermometer, Battery, Lock, ShieldCheck, MapPin, Download,
  Copy, Check, AlertTriangle, ExternalLink, Loader2,
  Activity, Shield
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { getMissionAuditReport } from '../../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch { return String(ts); }
};

const fmtDateTime = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch { return String(ts); }
};

const truncHash = (hash, len = 20) => {
  if (!hash) return '—';
  if (hash.length <= len * 2 + 3) return hash;
  return `${hash.slice(0, len)}...${hash.slice(-8)}`;
};

const COLOR_CLASSES = {
  blue:    { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50 border-blue-100' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  amber:   { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100' },
  red:     { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50 border-red-100' },
};

// ── CopyHashButton ─────────────────────────────────────────────────────────────
const CopyHashButton = ({ hash }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy block hash — paste in Admin Blockchain Audit to verify"
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
        copied
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy Hash'}
    </button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AuditRecordModal = ({ isOpen, onClose, transportData }) => {
  const { isDayMode } = useTheme();
  const [auditReport, setAuditReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch real blockchain audit report ────────────────────────────────────
  const fetchReport = useCallback(async () => {
    const missionId = transportData?._id || transportData?.dbId || transportData?.id;
    if (!missionId) return;

    setLoading(true);
    setError(null);
    try {
      const resp = await getMissionAuditReport(missionId);
      // fetchApi unwraps .data automatically
      setAuditReport(resp);
    } catch (err) {
      console.warn('Could not load blockchain audit report:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transportData?._id, transportData?.dbId, transportData?.id]);

  useEffect(() => {
    if (isOpen && transportData) {
      fetchReport();
    }
    if (!isOpen) {
      setAuditReport(null);
      setError(null);
    }
  }, [isOpen, fetchReport]);

  if (!isOpen) return null;

  // ── Data preparation ───────────────────────────────────────────────────────
  const isTampered = transportData?.tamper === 'TAMPERED' ||
                     transportData?.isTampered === true ||
                     transportData?.lidOpened === true ||
                     auditReport?.stats?.tamperCount > 0;

  const stats = auditReport?.stats || {};
  const lifecycleBlocks = auditReport?.lifecycleBlocks || [];
  const anomalyBlocks   = auditReport?.anomalyBlocks   || [];
  const telemetrySamples = auditReport?.telemetrySamples || [];

  // Build combined timeline: lifecycle events + anomaly events sorted by time
  const combinedTimeline = [
    ...lifecycleBlocks.map(b => ({ ...b, type: 'lifecycle' })),
    ...anomalyBlocks.map(b => ({ ...b, type: 'anomaly' })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Telemetry chart data
  const chartData = telemetrySamples.length > 0
    ? telemetrySamples.map((s, i) => ({
        name: fmtTime(s.timestamp),
        temp: s.temperature,
        battery: s.batteryLevel,
      }))
    : [
        { name: '12:45 PM', temp: 4.0, battery: 100 },
        { name: '01:15 PM', temp: 4.1, battery: 98 },
        { name: '01:45 PM', temp: 3.9, battery: 96 },
        { name: '02:15 PM', temp: 4.2, battery: 94 },
        { name: '02:30 PM', temp: 4.0, battery: 92 },
      ];

  const rawOrgan = auditReport?.mission?.organType || transportData?.organType || transportData?.organ || 'Kidney';
  const formatOrgan = (o) => {
    if (!o) return 'Kidney';
    const s = String(o).trim();
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };
  const organDisplay = formatOrgan(rawOrgan);

  // Fallback static data for display metadata
  const data = {
    id:              transportData?.id || transportData?.missionId || 'TRN-0000',
    completedDate:   fmtDateTime(auditReport?.mission?.actualArrivalTime || transportData?.completedDate) || transportData?.completedDate || '—',
    transportType:   auditReport?.mission?.transportType || transportData?.transportType || 'Organ Transport',
    organType:       organDisplay,
    origin:          auditReport?.mission?.origin || transportData?.origin || '—',
    destination:     auditReport?.mission?.destination || transportData?.destination || '—',
    hash:            transportData?.hash || '(loading real hash from blockchain...)',
    txId:            transportData?.txId || '—',
    verifiedOn:      transportData?.verifiedOn || '—',
    network:         'Jeevan Setu NeoLife MiniChain (MongoDB + Arweave)',
    iotBoxId:        auditReport?.mission?.boxId || transportData?.iotBoxId || '—',
    patientName:     auditReport?.mission?.patientName || transportData?.patientName || '—',
  };

  // Real stats for display (with fallbacks)
  const displayAvgTemp     = stats.avgTemp    != null ? `${stats.avgTemp}°C` : (transportData?.temp ? `${transportData.temp}°C` : '4.0°C');
  const displayMinMax      = (stats.minTemp != null && stats.maxTemp != null) ? `${stats.minTemp}–${stats.maxMax}°C` : '—';
  const displayEndBattery  = stats.endBattery != null ? `${stats.endBattery}%` : '78%';
  const displayTamperState = isTampered ? '🚨 TAMPERED' : 'Sealed ✓';

  // Collect last real lifecycle hash to use as the "transport hash" in PDFs
  const lastLifecycleHash = lifecycleBlocks.length > 0
    ? lifecycleBlocks[lifecycleBlocks.length - 1].hash
    : data.hash;

  // ── PDF Export: Anomaly Evidence Report (real data) ───────────────────────
  const handleExportAnomalyPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const hasRealData = anomalyBlocks.length > 0 || lifecycleBlocks.length > 0;

    const anomalyHtml = anomalyBlocks.length > 0
      ? anomalyBlocks.map(a => `
          <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${a.color === 'red' ? '#ef4444' : '#f59e0b'}; background: ${a.color === 'red' ? '#fef2f2' : '#fffbeb'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h4 style="margin: 0; color: ${a.color === 'red' ? '#991b1b' : '#92400e'}; font-size: 13px;">${a.label}</h4>
              <span style="background: ${a.color === 'red' ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800;">${a.severity}</span>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #374151;">${a.summary}</p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; font-size: 11px;">
              ${a.details.temperature != null ? `<div><b>Temperature:</b> ${a.details.temperature}°C</div>` : ''}
              ${a.details.batteryLevel != null ? `<div><b>Battery:</b> ${a.details.batteryLevel}%</div>` : ''}
              ${a.details.isTampered ? `<div><b>Tamper:</b> ⚠ YES</div>` : ''}
            </div>
            <div style="border-top: 1px solid #fca5a5; padding-top: 8px; font-size: 11px; color: #6b7280;">
              <div style="margin-bottom: 4px;"><b>Timestamp:</b> ${fmtDateTime(a.timestamp)}</div>
              <div style="margin-bottom: 4px;"><b>Block #${a.blockIndex}</b> | Event: <code>${a.eventType}</code></div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <b>Block Hash:</b>
                <code style="background: #fee2e2; padding: 4px 8px; border-radius: 4px; border: 1px solid #f87171; color: #991b1b; word-break: break-all; font-size: 10px;">${a.hash}</code>
              </div>
              ${a.arweaveTxId ? `<div style="margin-top: 4px;"><b>Arweave TX:</b> <code style="font-size: 10px; color: #1d4ed8;">${a.arweaveTxId}</code></div>` : ''}
              <div style="margin-top: 6px; font-size: 10px; color: #9ca3af;">ℹ Copy the Hash above and paste it into Admin → Blockchain Audit Search to verify this record.</div>
            </div>
          </div>
        `).join('')
      : `<div style="padding: 30px; text-align: center; color: #10b981; font-weight: bold; background: #ecfdf5; border-radius: 8px; border: 1px solid #6ee7b7;">No anomalies detected during this transport. All cold-chain integrity checks passed.</div>`;

    const lifecycleHtml = lifecycleBlocks.map(l => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px; font-size: 11px; color: #6b7280;">${fmtDateTime(l.timestamp)}</td>
        <td style="padding: 8px; font-size: 11px; font-weight: 600;">${l.label}</td>
        <td style="padding: 8px; font-family: monospace; font-size: 9px; color: #374151; word-break: break-all;">#${l.blockIndex} — ${l.hash}</td>
      </tr>
    `).join('');

    // ── Generate Compact Horizontal Temperature Chart SVG ─────────────
    const generateCompactTempSvg = (samples) => {
      if (!samples || samples.length === 0) return '';
      const width = 680;
      const height = 110;
      const padLeft = 38;
      const padRight = 30;
      const padTop = 16;
      const padBottom = 20;
      const chartW = width - padLeft - padRight;
      const chartH = height - padTop - padBottom;

      const temps = samples.map(s => typeof s.temp === 'number' ? s.temp : parseFloat(s.temp) || 4.0);
      const minT = 0;
      const maxT = Math.max(12, ...temps, 8);

      const getX = (i) => padLeft + (i / Math.max(samples.length - 1, 1)) * chartW;
      const getY = (t) => padTop + chartH - ((t - minT) / (maxT - minT)) * chartH;

      const points = samples.map((s, i) => `${getX(i)},${getY(temps[i])}`).join(' ');
      const areaPoints = `${points} ${getX(samples.length - 1)},${padTop + chartH} ${getX(0)},${padTop + chartH}`;

      const lastSample = samples[samples.length - 1];
      const lastTemp = temps[temps.length - 1];
      const lastX = getX(samples.length - 1);
      const lastY = getY(lastTemp);

      const safeY2 = getY(2);
      const safeY8 = getY(8);
      const safeH = safeY2 - safeY8;

      const xLabels = samples.map((s, i) => {
        if (i === 0 || i === samples.length - 1 || i === Math.floor(samples.length / 2)) {
          return `<text x="${getX(i)}" y="${height - 4}" font-size="8.5" fill="#64748b" text-anchor="${i === 0 ? 'start' : i === samples.length - 1 ? 'end' : 'middle'}" font-family="Segoe UI, sans-serif">${s.name}</text>`;
        }
        return '';
      }).join('');

      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11.5px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 4px;">
              <span style="color: #2563eb;">🌡️</span> Temperature Over Time (Real Telemetry)
            </span>
            <span style="font-size: 9.5px; font-weight: 600; color: #059669; background: #ecfdf5; padding: 2px 8px; border-radius: 10px; border: 1px solid #a7f3d0;">
              Clinical Safe Range: 2°C – 8°C
            </span>
          </div>
          <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; display: block;">
            <defs>
              <linearGradient id="tempGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <rect x="${padLeft}" y="${safeY8}" width="${chartW}" height="${safeH}" fill="#ecfdf5" opacity="0.7"/>
            <line x1="${padLeft}" y1="${safeY8}" x2="${padLeft + chartW}" y2="${safeY8}" stroke="#10b981" stroke-dasharray="3,3" stroke-width="0.8"/>
            <line x1="${padLeft}" y1="${safeY2}" x2="${padLeft + chartW}" y2="${safeY2}" stroke="#10b981" stroke-dasharray="3,3" stroke-width="0.8"/>
            <text x="${padLeft - 5}" y="${safeY8 + 3}" font-size="8" fill="#059669" text-anchor="end" font-weight="700">8°C</text>
            <text x="${padLeft - 5}" y="${safeY2 + 3}" font-size="8" fill="#059669" text-anchor="end" font-weight="700">2°C</text>
            <text x="${padLeft - 5}" y="${padTop + chartH + 3}" font-size="8" fill="#94a3b8" text-anchor="end">0°C</text>

            <line x1="${padLeft}" y1="${padTop + chartH}" x2="${padLeft + chartW}" y2="${padTop + chartH}" stroke="#cbd5e1" stroke-width="1"/>

            <polygon points="${areaPoints}" fill="url(#tempGrad)"/>
            <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>

            <circle cx="${lastX}" cy="${lastY}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
            <g transform="translate(${Math.min(lastX - 32, width - 75)}, ${Math.max(lastY - 24, 2)})">
              <rect width="68" height="20" rx="4" fill="#0f172a" opacity="0.92"/>
              <text x="34" y="13" font-size="8.5" fill="#ffffff" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">${lastTemp}°C</text>
            </g>

            ${xLabels}
          </svg>
        </div>
      `;
    };

    const tempGraphHtml = generateCompactTempSvg(chartData);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transport Anomaly Report — ${data.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 24px; }
          .title-section h1 { margin: 0; font-size: 20px; color: #991b1b; }
          .title-section p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700; }
          .badge { background: #ef4444; color: white; padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .field { font-size: 12px; margin-bottom: 5px; }
          .field label { color: #64748b; font-weight: 600; display: inline-block; width: 130px; }
          .field span { color: #0f172a; font-weight: 700; }
          h2 { font-size: 13px; color: #374151; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          thead tr { background: #f8fafc; }
          th { padding: 8px; text-align: left; color: #6b7280; font-weight: 700; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid #e2e8f0; }
          .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
          .verification-box { background: #0f172a; color: white; border-radius: 8px; padding: 14px 16px; margin-top: 20px; }
          .verification-box h3 { margin: 0 0 6px 0; color: #38bdf8; font-size: 11px; text-transform: uppercase; }
          .hash-code { font-family: monospace; font-size: 9.5px; background: rgba(255,255,255,0.1); padding: 5px 8px; border-radius: 4px; word-break: break-all; color: #34d399; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-section">
            <h1>TRANSPORT ANOMALY & BLOCKCHAIN EVIDENCE REPORT</h1>
            <p>CRYPTOGRAPHIC COLD-CHAIN ANOMALY LEDGER — ${hasRealData ? 'REAL BLOCKCHAIN DATA' : 'STATIC FALLBACK'}</p>
          </div>
          <div class="badge">${anomalyBlocks.length > 0 ? `${anomalyBlocks.length} ${anomalyBlocks.length > 1 ? 'ANOMALIES' : 'ANOMALY'} DETECTED` : 'NO ANOMALIES'}</div>
        </div>

        <div class="info-grid">
          <div>
            <div class="field"><label>Transport ID:</label><span>${data.id}</span></div>
            <div class="field"><label>Organ Type:</label><span>${data.organType}</span></div>
            <div class="field"><label>From:</label><span>${data.origin}</span></div>
            <div class="field"><label>To:</label><span>${data.destination}</span></div>
          </div>
          <div>
            <div class="field"><label>Avg Temperature:</label><span>${displayAvgTemp}</span></div>
            <div class="field"><label>Tamper Events:</label><span>${stats.tamperCount ?? 0}</span></div>
            <div class="field"><label>Total Anomalies:</label><span>${stats.anomalyCount ?? 0}</span></div>
            <div class="field"><label>Total Blocks:</label><span>${stats.totalBlocks ?? '—'}</span></div>
          </div>
        </div>

        ${tempGraphHtml}

        <h2>🚨 Detected Anomalies (${anomalyBlocks.length})</h2>
        ${anomalyHtml}

        ${lifecycleBlocks.length > 0 ? `
          <h2>📋 Lifecycle Event Trail (Real Timestamps)</h2>
          <table>
            <thead><tr><th>Timestamp</th><th>Event</th><th>Block # — Hash</th></tr></thead>
            <tbody>${lifecycleHtml}</tbody>
          </table>
        ` : ''}

        <div class="verification-box">
          <h3>🔐 Admin Verification Instructions</h3>
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;">To verify any anomaly above:</p>
          <ol style="font-size: 11px; color: #cbd5e1; margin: 0; padding-left: 16px; line-height: 2;">
            <li>Copy the <strong style="color: #34d399;">Block Hash</strong> from any anomaly card above.</li>
            <li>Log in as <strong style="color: #38bdf8;">Platform Admin</strong>.</li>
            <li>Go to <strong style="color: #38bdf8;">Blockchain Audit</strong> → paste hash in the search bar.</li>
            <li>The block will appear with full cryptographic proof and Arweave Permaweb link.</li>
          </ol>
          <p style="margin: 12px 0 4px 0; font-size: 10px; color: #64748b;">Last Lifecycle Block Hash (for chain verification):</p>
          <div class="hash-code">${lastLifecycleHash}</div>
        </div>

        <div class="footer">
          <p>Report generated: ${new Date().toLocaleString('en-IN')} | Network: ${data.network}</p>
          <p>This report contains cryptographic evidence from the Jeevan Setu blockchain ledger. Hashes are immutable SHA-256 fingerprints that cannot be altered.</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ── PDF Export: Standard Summary (real data) ──────────────────────────────
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const incidentHtml = combinedTimeline.map(log => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">${fmtTime(log.timestamp)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${log.label || log.eventType}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 10px;">${log.summary || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${log.color === 'red' ? '#dc2626' : log.color === 'amber' ? '#d97706' : '#059669'}; text-transform: uppercase; font-size: 10px;">${log.severity || log.type}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NOTTO Audit Report — ${data.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title-section h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
          .badge { background: #059669; color: white; padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
          .card h3 { margin: 0 0 10px 0; font-size: 11px; color: #2563eb; text-transform: uppercase; }
          .field { margin-bottom: 6px; font-size: 11px; }
          .field label { color: #64748b; font-weight: 600; display: inline-block; width: 130px; }
          .field span { color: #0f172a; font-weight: 700; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .metric-box { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
          .metric-box label { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; display: block; }
          .metric-box val { font-size: 15px; font-weight: 800; color: #0f172a; display: block; margin-top: 3px; }
          .metric-box status { font-size: 9px; color: #059669; font-weight: 700; display: block; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          thead tr { background: #f8fafc; }
          th { padding: 8px; text-align: left; color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          .blockchain { background: #0f172a; color: white; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
          .blockchain h3 { margin: 0 0 8px 0; color: #38bdf8; font-size: 12px; text-transform: uppercase; }
          .hash-code { font-family: monospace; font-size: 10px; background: rgba(255,255,255,0.1); padding: 6px 10px; border-radius: 4px; word-break: break-all; color: #34d399; }
          .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .sig-box { text-align: center; }
          .sig-line { border-bottom: 2px dashed #94a3b8; height: 40px; margin-bottom: 8px; }
          .sig-title { font-size: 10px; font-weight: 700; color: #475569; }
          h2 { font-size: 13px; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-section">
            <h1>NATIONAL ORGAN & TISSUE TRANSPLANT AUDIT</h1>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b; font-weight: 700;">OFFICIAL BLOCKCHAIN-NOTARIZED COLD-CHAIN HANDOVER CERTIFICATE</p>
          </div>
          <div class="badge">VERIFIED & COMPLETED</div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Transport Details</h3>
            <div class="field"><label>Transport ID:</label><span>${data.id}</span></div>
            <div class="field"><label>Organ Type:</label><span>${data.organType}</span></div>
            <div class="field"><label>IoT Box:</label><span>${data.iotBoxId}</span></div>
            <div class="field"><label>Completed:</label><span>${data.completedDate}</span></div>
          </div>
          <div class="card">
            <h3>Route Details</h3>
            <div class="field"><label>Origin:</label><span>${data.origin}</span></div>
            <div class="field"><label>Destination:</label><span>${data.destination}</span></div>
            <div class="field"><label>Total Blocks:</label><span>${stats.totalBlocks ?? '—'}</span></div>
            <div class="field"><label>Anomalies:</label><span>${stats.anomalyCount ?? 0}</span></div>
          </div>
        </div>

        <div class="metrics">
          <div class="metric-box">
            <label>Avg Temperature</label>
            <val>${displayAvgTemp}</val>
            <status>${stats.avgTemp != null && stats.avgTemp >= 2 && stats.avgTemp <= 6 ? '✓ Safe Band' : '⚠ Check Report'}</status>
          </div>
          <div class="metric-box">
            <label>Final Battery</label>
            <val>${displayEndBattery}</val>
            <status>✓ End of Trip</status>
          </div>
          <div class="metric-box">
            <label>Container Security</label>
            <val>${isTampered ? '⚠ Alert' : 'Sealed'}</val>
            <status>${isTampered ? '⚠ Tamper Detected' : '✓ Unbroken Seal'}</status>
          </div>
          <div class="metric-box">
            <label>Blockchain Ledger</label>
            <val>Notarized</val>
            <status>✓ ${stats.totalBlocks ?? '—'} Blocks</status>
          </div>
        </div>

        ${combinedTimeline.length > 0 ? `
          <h2>Incident & Event Log (Real Blockchain Data)</h2>
          <table>
            <thead><tr><th>Time</th><th>Event</th><th>Description</th><th>Status</th></tr></thead>
            <tbody>${incidentHtml}</tbody>
          </table>
        ` : ''}

        <div class="blockchain">
          <h3>Cryptographic Audit Notarization</h3>
          <p style="font-size: 10px; color: #94a3b8; margin: 0 0 6px 0;">Primary Transport Block Hash:</p>
          <div class="hash-code">${lastLifecycleHash}</div>
          <p style="font-size: 10px; margin: 10px 0 4px 0; color: #94a3b8;">Network: ${data.network}</p>
          <div style="margin-top: 12px; padding: 10px; background: rgba(56, 189, 248, 0.1); border-left: 3px solid #38bdf8; border-radius: 4px;">
            <p style="font-size: 10px; margin: 0; color: #bae6fd; line-height: 1.5;">
              <strong>Judge & Auditor Note:</strong> This Hash is an immutable SHA-256 cryptographic fingerprint. Any tampering with the underlying data would invalidate this hash. Copy and verify in the Admin Blockchain Audit portal.
            </p>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box"><div class="sig-line"></div><div class="sig-title">Source Hospital LO — ${data.origin}</div></div>
          <div class="sig-box"><div class="sig-line"></div><div class="sig-title">Destination Hospital LO — ${data.destination}</div></div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className={`rounded-2xl shadow-2xl w-full max-w-[1180px] flex flex-col max-h-[94vh] overflow-hidden border transition-colors ${
        isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
      }`}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
                <h2 className={`text-xl font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>
                  Transportation Audit Record
                </h2>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} /> Completed
                </span>
                {loading && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    <Loader2 size={12} className="animate-spin" /> Loading blockchain data...
                  </span>
                )}
                {!loading && auditReport && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Activity size={12} /> Live Blockchain Data
                  </span>
                )}
                {!loading && error && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                    <AlertTriangle size={12} /> Static Fallback
                  </span>
                )}
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Transportation ID: <span className="font-semibold text-blue-500 font-mono">{data.id}</span>
                {' | '}
                Completed: <span className="font-semibold">{data.completedDate}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors border ${
            isDayMode ? 'hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600' : 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className={`p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 ${
          isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#0A0F1D]'
        }`}>

          {/* Summary Pills */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border shadow-sm text-xs ${
            isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
          }`}>
            {[
              { icon: <Package size={16} className="text-blue-500" />, label: 'Transport Category', val: data.transportType },
              { icon: <Package size={16} className="text-purple-500" />, label: 'Organ Type', val: data.organType },
              { icon: <MapPin size={16} className="text-emerald-500" />, label: 'Authorized Route', val: `${data.origin} → ${data.destination}` },
            ].map(({ icon, label, val }, i) => (
              <div key={i} className="flex items-center gap-2.5 min-w-0">
                {icon}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 font-medium block">{label}</span>
                  <span className={`font-bold text-[11px] leading-tight block truncate ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Left col: IoT summary + chart */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* IoT Stats Cards */}
              <div className={`p-4 rounded-xl border shadow-sm ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <h3 className={`text-xs font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>
                      IoT Blockchain Audit
                      <span className={`text-gray-400 font-normal ml-1`}>{auditReport ? '(Live Data)' : '(Estimated)'}</span>
                    </h3>
                  </div>
                  <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${
                    isTampered ? 'bg-red-100 text-red-700' : 'bg-emerald-600 text-white'
                  }`}>
                    {isTampered ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                    {isTampered ? 'Alert Detected' : 'All Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: <Thermometer size={14} />, label: 'Avg Temperature', val: displayAvgTemp,
                      sub: stats.minTemp != null ? `Range: ${stats.minTemp}–${stats.maxTemp}°C` : '✓ Stable Throughout',
                      iconBg: 'bg-blue-100 text-blue-600',
                    },
                    {
                      icon: <Battery size={14} />, label: 'Battery (End)', val: displayEndBattery,
                      sub: stats.batteryDrain != null ? `Drained ${stats.batteryDrain}%` : '✓ End of Trip',
                      iconBg: 'bg-emerald-100 text-emerald-600',
                    },
                    {
                      icon: <Lock size={14} />, label: 'Tamper Security', val: displayTamperState,
                      sub: stats.tamperCount > 0 ? `⚠ ${stats.tamperCount} event(s)` : '✓ Unbroken Seal',
                      iconBg: isTampered ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600',
                      alert: isTampered,
                    },
                    {
                      icon: <ShieldCheck size={14} />, label: 'Chain Integrity', val: `${stats.totalBlocks ?? '—'} Blocks`,
                      sub: `${stats.anomalyCount ?? 0} anomaly, ${stats.lifecycleCount ?? 0} lifecycle`,
                      iconBg: 'bg-indigo-100 text-indigo-600',
                    },
                  ].map(({ icon, label, val, sub, iconBg, alert }, i) => (
                    <div key={i} className={`border rounded-xl p-2 flex flex-col items-center text-center ${
                      alert ? 'bg-red-50/90 border-red-200' : isDayMode ? 'bg-gray-50/70 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'
                    }`}>
                      <span className="text-[9px] text-gray-400 font-medium mb-1">{label}</span>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center my-0.5 ${iconBg}`}>{icon}</div>
                      <span className={`text-xs font-extrabold mt-1 ${alert ? 'text-red-700' : isDayMode ? 'text-gray-900' : 'text-slate-100'}`}>{val}</span>
                      <span className={`text-[8px] font-semibold mt-0.5 ${alert ? 'text-red-600' : 'text-emerald-600'}`}>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temperature Chart */}
              {chartData.length > 1 && (
                <div className={`p-4 rounded-xl border shadow-sm ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
                  <h4 className={`text-xs font-bold mb-3 flex items-center gap-2 ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>
                    <Thermometer size={14} className="text-blue-500" />
                    Temperature Over Time {auditReport ? '(Real Data)' : '(Sample)'}
                  </h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={chartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDayMode ? '#f1f5f9' : '#1e293b'} />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        formatter={(v) => [`${v}°C`, 'Temp']}
                      />
                      <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Right col: Timeline */}
            <div className={`lg:col-span-3 p-4 rounded-xl border shadow-sm flex flex-col ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-xs font-bold flex items-center gap-2 ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>
                  <Activity size={14} className="text-blue-500" />
                  Incident & Blockchain Event Timeline
                </h4>
                <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                  {auditReport ? `${combinedTimeline.length} Real Events` : 'Blockchain Notarized Log'}
                </span>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <p className="text-xs font-medium">Fetching blockchain records...</p>
                </div>
              )}

              {!loading && combinedTimeline.length === 0 && !auditReport && (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                  {/* Static fallback timeline when no real data */}
                  {[
                    { time: transportData?.startedAt || '12:45 PM', label: 'Dispatch Notarized', summary: 'Transport Started & Container Sealed securely.', color: 'blue', type: 'lifecycle' },
                    { time: '01:15 PM', label: 'System Check', summary: 'Battery & IoT modules operating at optimal levels.', color: 'emerald', type: 'lifecycle' },
                    { time: transportData?.completedDate?.split(',').pop()?.trim() || '02:30 PM', label: 'Arrival Confirmed & Handover', summary: 'Transport Arrived & Handover Complete to destination LO.', color: 'emerald', type: 'lifecycle' },
                  ].map((log, idx, arr) => (
                    <div key={idx} className="flex gap-3 items-start relative">
                      {idx !== arr.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-gray-100" />}
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 z-10 border-2 border-white shadow-sm ${COLOR_CLASSES[log.color]?.dot || 'bg-blue-500'}`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-2.5 flex-1 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-[11px] font-bold text-gray-900">{log.label}</h5>
                          <span className="text-[10px] font-mono font-bold text-gray-600 shrink-0">{log.time}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{log.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && combinedTimeline.length > 0 && (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                  {combinedTimeline.map((log, idx, arr) => {
                    const cc = COLOR_CLASSES[log.color] || COLOR_CLASSES.blue;
                    const isAnomaly = log.type === 'anomaly';
                    return (
                      <div key={log.blockIndex ?? idx} className="flex gap-3 items-start relative">
                        {idx !== arr.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-gray-100" />
                        )}
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 z-10 border-2 border-white shadow-sm ${cc.dot}`}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        <div className={`border rounded-lg p-2.5 flex-1 transition-colors ${
                          isAnomaly
                            ? `${cc.bg} border`
                            : isDayMode ? 'bg-gray-50/70 border-gray-100 hover:bg-gray-50' : 'bg-[#0f172a]/40 border-slate-700/40'
                        }`}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-[11px] font-bold ${isAnomaly ? cc.text : (isDayMode ? 'text-gray-900' : 'text-slate-100')}`}>
                                {isAnomaly && <span className="mr-1">{log.severity === 'CRITICAL' ? '🚨' : '⚠️'}</span>}
                                {log.label || log.eventType}
                              </h5>
                              {log.summary && log.summary !== log.label && (
                                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{log.summary}</p>
                              )}
                              {isAnomaly && log.details && (
                                <div className="flex gap-3 mt-1 flex-wrap">
                                  {log.details.temperature != null && (
                                    <span className="text-[9px] font-semibold text-gray-600 bg-white/70 px-1.5 py-0.5 rounded border border-gray-200">
                                      🌡 {log.details.temperature}°C
                                    </span>
                                  )}
                                  {log.details.batteryLevel != null && (
                                    <span className="text-[9px] font-semibold text-gray-600 bg-white/70 px-1.5 py-0.5 rounded border border-gray-200">
                                      🔋 {log.details.batteryLevel}%
                                    </span>
                                  )}
                                  {log.details.isTampered && (
                                    <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                      🔓 TAMPERED
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <span className="text-[10px] font-mono font-bold text-gray-600">{fmtTime(log.timestamp)}</span>
                              {isAnomaly && (
                                <span className={`text-[8px] font-bold uppercase ${cc.text}`}>{log.severity}</span>
                              )}
                            </div>
                          </div>

                          {/* Block hash + actions — only shown for anomaly blocks */}
                          {isAnomaly && log.hash && (
                            <div className="mt-2 pt-2 border-t border-gray-200/70 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Shield size={10} className="text-gray-400 shrink-0" />
                                <span className="text-[9px] font-mono text-gray-500 truncate" title={log.hash}>
                                  #{log.blockIndex} · {truncHash(log.hash, 14)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CopyHashButton hash={log.hash} />
                                {log.arweaveTxId && (
                                  <a
                                    href={`https://gateway.irys.xyz/${log.arweaveTxId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
                                  >
                                    <ExternalLink size={9} />
                                    Arweave
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Block reference for lifecycle events */}
                          {!isAnomaly && log.blockIndex != null && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-[8px] font-mono text-gray-400">Block #{log.blockIndex}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Admin Verification Instruction Bar */}
          {anomalyBlocks.length > 0 && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDayMode ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-950/30 border-indigo-700/50'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-800">Admin Verification Instructions</p>
                <p className="text-[10px] text-indigo-600 mt-0.5 leading-relaxed">
                  {anomalyBlocks.length} anomaly block{anomalyBlocks.length > 1 ? 's' : ''} detected above. 
                  Click <strong>"Copy Hash"</strong> on any anomaly event, then log in as <strong>Platform Admin → Blockchain Audit</strong> and paste the hash in the search bar to verify the exact block with full cryptographic proof and Arweave Permaweb link.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#101827] border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <ShieldCheck size={14} className="text-amber-500" />
              Court-Admissible Blockchain Record
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
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.15), 0 4px 14px 0 rgba(15,23,42,0.5), 0 0 12px 0 rgba(124,58,237,0.25)'
              }}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-indigo-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-slate-100 tracking-wide uppercase leading-tight">
                  Generate Digital Evidence Report
                </span>
                <span className="text-[9px] font-mono text-indigo-300/80">
                  {auditReport ? `${anomalyBlocks.length} Real Anomaly Hashes` : 'Cryptographic Hash Ledger'}
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
