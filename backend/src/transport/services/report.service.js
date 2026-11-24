import PDFDocument from 'pdfkit-table';
import moment from 'moment';
import TransportMission from '../../models/TransportMission.js';
import TelemetryLog from '../../models/TelemetryLog.js';
import LedgerBlock from '../../models/LedgerBlock.js';

export const generateEvidenceReport = async (missionId, res) => {
  try {
    const mission = await TransportMission.findOne({
      $or: [{ missionId: missionId }, { _id: missionId }]
    }).populate('originHospital').populate('destinationHospital');

    if (!mission) {
      throw new Error('Mission not found');
    }

    const telemetryLogs = await TelemetryLog.find({ missionId: mission._id }).sort({ timestamp: 1 });
    const blocks = await LedgerBlock.find({ entityId: mission._id.toString() }).sort({ timestamp: 1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Digital_Evidence_Report_${mission.missionId}.pdf`);
    
    doc.pipe(res);

    // ── HEADER ──────────────────────────────────────────
    doc.fontSize(20).text('DIGITAL EVIDENCE & CHAIN OF CUSTODY REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('This document contains cryptographic proof of transit integrity verified on the Blockchain and Arweave Permaweb.', { align: 'center', color: 'grey' });
    doc.moveDown(2);

    // ── MISSION SUMMARY ─────────────────────────────────
    doc.fillColor('black').fontSize(14).text('Mission Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Mission ID: ${mission.missionId}`);
    doc.text(`Status: ${mission.status}`);
    doc.text(`Origin Hospital: ${mission.originHospital?.name || 'N/A'}`);
    doc.text(`Destination Hospital: ${mission.destinationHospital?.name || 'N/A'}`);
    doc.text(`Report Generated On: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    doc.moveDown(2);

    // ── TELEMETRY LOGS (IoT & Arweave) ──────────────────
    doc.fontSize(14).text('IoT Telemetry & Permaweb Records', { underline: true });
    doc.moveDown(0.5);
    
    if (telemetryLogs.length === 0) {
      doc.fontSize(10).text('No telemetry data recorded for this mission.');
    } else {
      const tableArray = {
        headers: ["Time", "Temp (°C)", "Battery", "Tamper", "Arweave TX ID"],
        rows: telemetryLogs.map(log => [
          moment(log.timestamp).format('HH:mm:ss'),
          `${log.telemetry.temperature}°C`,
          `${log.telemetry.batteryLevel}%`,
          log.telemetry.isTampered ? 'YES (ALERT)' : 'NO',
          log.arweaveTxId ? log.arweaveTxId.substring(0, 16) + '...' : 'N/A'
        ])
      };
      await doc.table(tableArray, { width: 500 });
    }
    doc.moveDown(2);

    // ── BLOCKCHAIN AUDIT TRAIL ──────────────────────────
    doc.fontSize(14).text('Blockchain Immutable Ledger Trail', { underline: true });
    doc.moveDown(0.5);
    
    if (blocks.length === 0) {
      doc.fontSize(10).text('No blockchain blocks recorded for this mission.');
    } else {
      const blockTable = {
        headers: ["Block", "Event Type", "Timestamp", "Block Hash"],
        rows: blocks.map(block => [
          `#${block.blockIndex}`,
          block.eventType,
          moment(block.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          block.hash.substring(0, 24) + '...'
        ])
      };
      await doc.table(blockTable, { width: 500 });
    }
    
    doc.moveDown(2);
    
    // ── LEGAL ATTESTATION ───────────────────────────────
    doc.fontSize(10).fillColor('grey').text('ATTESTATION:', { underline: true });
    doc.text('The data contained in this report is cryptographically signed by the IoT hardware edge device and notarized on an immutable blockchain ledger. The Arweave TX IDs represent permanent decentralized storage links which can be verified independently.');

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate evidence report', error: error.message });
    }
  }
};
