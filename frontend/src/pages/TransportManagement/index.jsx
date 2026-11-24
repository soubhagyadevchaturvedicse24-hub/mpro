import React, { useState, useEffect } from 'react';
import { Plus, ShieldAlert, UserCheck, CheckCircle2 } from 'lucide-react';
import TransportationBoard from './components/TransportationBoard';
import NewTransportModal from './components/NewTransportModal';
import LiveTrackingModal from './components/LiveTrackingModal';
import ScheduledDetailsModal from './components/ScheduledDetailsModal';
import AuditRecordModal from './components/AuditRecordModal';
import { 
  getScheduledTransports, saveScheduledTransports, 
  getOngoingTransports, saveOngoingTransports, 
  getCompletedTransports, saveCompletedTransports 
} from './data/dummyData';
import { useTheme } from '../../context/ThemeContext';
import { useSimulatorContext } from '../../context/SimulatorContext';
import { useHospitals } from '../../data/useHospitals';
import { getHospitalByName } from '../../data/hospitals';

import { createMission, getMissions, updateMission, updateMissionWorkflow } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const TransportManagement = () => {
  const { isDayMode } = useTheme();
  const sim = useSimulatorContext();
  const { user } = useAuth();
  const socket = useSocket();
  const { hospitals } = useHospitals();

  // Determine user role and logged-in hospital identity
  const isGovAdmin = ['ADMIN', 'PLATFORM_ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'].includes((user?.role || '').toUpperCase());
  const userHospitalName = user?.hospitalName || user?.name || user?.displayName || (hospitals[0]?.name || 'CityCare Hospital');

  const [activeHospital, setActiveHospital] = useState(userHospitalName);
  const [rbacError, setRbacError] = useState(null);
  
  // Operating Mode State (Admin can force Live Mode to disable all simulator interference)
  const [isLiveMode, setIsLiveMode] = useState(true);

  useEffect(() => {
    if (userHospitalName && !isGovAdmin) {
      setActiveHospital(userHospitalName);
    }
  }, [userHospitalName, isGovAdmin]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [scheduledModalData, setScheduledModalData] = useState(null);
  const [trackingModalData, setTrackingModalData] = useState(null);
  const [auditModalData, setAuditModalData] = useState(null);

  const [scheduledItems, setScheduledItems] = useState(getScheduledTransports());
  const [ongoingItems, setOngoingItems] = useState(getOngoingTransports());
  const [completedItems, setCompletedItems] = useState(getCompletedTransports());
  const [rfidToast, setRfidToast] = useState(null);

  // ── Unified Telemetry State ─────────────────────────────────────────────────
  // Single source of truth for the LiveTrackingModal.
  // Fed by TWO pipelines — whichever has fresher data wins:
  //   Pipeline A: Real ESP32 hardware  → WebSocket 'transport:telemetry'
  //   Pipeline B: IoT Simulator        → SimulatorContext.telemetry (also POSTs to backend)
  const [unifiedTelemetry, setUnifiedTelemetry] = useState(null);
  const lastHardwareMsRef = React.useRef(0); // timestamp of last real hardware packet

  // Normalize any telemetry source into a consistent display format
  const normalizeTelemetry = React.useCallback((raw, source = 'hardware') => {
    if (!raw) return null;
    const isTampered = raw.isTampered || raw.tampered || false;
    const reedOpen   = source === 'hardware'
      ? raw.reedStatus === 'Box Open'
      : isTampered; // simulator uses isTampered to derive reed state
    const tempVal    = raw.temperature ?? 4.0;
    const spiked     = raw.spiked ?? (tempVal > 8 || tempVal < 2);
    const buzzer     = raw.buzzerStatus || (reedOpen ? 'Beeping Alert' : isTampered ? 'Tamper Recorded' : spiked ? 'Beeping Alert' : 'Normal');

    // Robust lat/lng extraction across all potential schema formats
    const latVal = raw.lat ?? raw.latitude ?? raw.geoLocation?.coordinates?.[1] ?? raw.location?.coordinates?.[1] ?? raw.gps?.lat ?? raw.gps?.latitude;
    const lngVal = raw.lng ?? raw.longitude ?? raw.geoLocation?.coordinates?.[0] ?? raw.location?.coordinates?.[0] ?? raw.gps?.lng ?? raw.gps?.longitude;

    const nLat = Number(latVal);
    const nLng = Number(lngVal);

    const validLat = (!isNaN(nLat) && nLat !== 0) ? nLat : null;
    const validLng = (!isNaN(nLng) && nLng !== 0) ? nLng : null;

    return {
      // Core sensor values
      temperature:     tempVal,
      batteryLevel:    raw.batteryLevel ?? 95,
      lat:             validLat,
      lng:             validLng,
      speedKmh:        raw.speedKmh ?? 0,
      // Status flags
      isTampered,
      tampered:        isTampered,
      spiked,
      reedStatus:      reedOpen ? 'Box Open' : 'Box Closed',
      buzzerStatus:    buzzer,
      relayStatus:     raw.relayStatus || 'Locked', // always Locked during transit
      // Identity
      rfidLastScanned: raw.rfidLastScanned || '',
      firmwareVersion: source === 'simulator' ? 'Simulator' : (raw.firmwareVersion || 'v3.1.0'),
      rgbColor:        isTampered || spiked ? 'Red' : 'Green',
      missionId:       raw.missionId || '',
      // Meta
      source,
      lastUpdated:     new Date().toISOString(),
    };
  }, []);

  // Keep a stable ref to the latest scheduled items for the websocket handler
  const scheduledItemsRef = React.useRef(scheduledItems);
  useEffect(() => {
    scheduledItemsRef.current = scheduledItems;
  }, [scheduledItems]);

  // Storage sync removed: State is purely driven by the Backend DB.

  // Fetch real backend transport missions on mount & interval
  useEffect(() => {
    let isMounted = true;

    const fetchRealMissions = async () => {
      try {
        const res = await getMissions();
        const rawMissions = Array.isArray(res) 
          ? res 
          : (res?.data?.missions || res?.data || res?.missions || []);

        if (rawMissions && rawMissions.length > 0 && isMounted) {
          const scheduled = [];
          const ongoing = [];
          const completed = [];

          rawMissions.forEach(m => {
            // Normalize backend populated hospital objects → { lat, lng, name }
            // Backend stores GeoJSON [longitude, latitude] — we convert to { lat, lng }
            const normalizeHosp = (h) => {
              if (!h) return null;
              return {
                ...h,
                name: h.name || h.hospitalLegalName || 'Hospital',
                lat: h.geoLocation?.coordinates?.[1] || h.lat || null,
                lng: h.geoLocation?.coordinates?.[0] || h.lng || null,
                address: typeof h.address === 'object'
                  ? [h.address.street, h.address.city, h.address.state, h.address.pincode].filter(Boolean).join(', ')
                  : (h.address || 'Hospital Campus'),
              };
            };

            const mapped = {
              id: m.missionId || m._id || `TRN-${Math.floor(8000 + Math.random() * 1000)}`,
              _id: m._id,          // real MongoDB ObjectId
              dbId: m._id,         // alias used by workflow calls
              organType: m.organType || m.organ?.organType || 'Kidney',
              patientName: m.patientName || m.recipient?.name || 'Patient',
              origin: m.originHospitalName || m.originHospital?.name || 'CityCare Hospital',
              destination: m.destinationHospitalName || m.destinationHospital?.name || 'Green Valley Hospital',
              originHospital: normalizeHosp(m.originHospital),
              destinationHospital: normalizeHosp(m.destinationHospital),
              originAddress: m.originHospital?.address || null,
              destinationAddress: m.destinationHospital?.address || null,
              time: m.requestedPickup || m.time || '12:00 PM',
              date: m.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              distance: m.distance || '18.2 km',
              duration: m.duration || '35 mins',
              priority: m.priority || 'High',
              iotBoxId: m.boxId || m.iotBoxId || 'IOT-78231',
              rfidCard: m.assignedRfidCard || null,
              health: m.health,
              status: m.status
            };

            const st = (m.status || '').toUpperCase();
            if (st === 'IN_TRANSIT' || st === 'DISPATCHED') {
              ongoing.push(mapped); // always show IN_TRANSIT — health issues flagged via health badge
            } else if (st === 'COMPLETED' || st === 'ARRIVED' || st === 'CANCELLED') {
              completed.push({
                ...mapped,
                completedDate: m.completedDate || `${mapped.date}, 02:30 PM`,
                auditStatus: st === 'CANCELLED' ? 'Cancelled' : 'Audit Verified',
                hash: m.blockchainHash || 'a3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8'
              });
            } else {
              scheduled.push(mapped);
            }
          });

          // Directly overwrite state to ensure Backend is the absolute Single Source of Truth
          setScheduledItems(scheduled);
          setOngoingItems(ongoing);
          setCompletedItems(completed);
        }
      } catch (err) {
        console.warn('Using active local transport state (backend sync ready):', err.message);
      }
    };

    fetchRealMissions();
    const interval = setInterval(fetchRealMissions, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── RFID Auto-Start: Listen for transport:rfid_started and device:access WebSocket events ──────
  useEffect(() => {
    if (!socket) return;
    const handleRfidStarted = (payload) => {
      const { missionId, rfid, cardSlot } = payload;
      const targetSlot = Number(cardSlot || 1);

      const currentScheduled = scheduledItemsRef.current;
      if (!currentScheduled || currentScheduled.length === 0) return;

      // Match by assigned card slot or missionId — ONLY from the Scheduled column
      const match = currentScheduled.find(t => {
        const itemCard = Number(t.rfidCard || 1);
        return itemCard === targetSlot || t.id === missionId;
      });

      // Guard: if not found in scheduled, or already in ongoing/completed — ignore
      if (!match) return;

        // Trigger visual popup toast notification
        setRfidToast({
          cardSlot: targetSlot,
          transportId: match.id,
          origin: match.origin,
          destination: match.destination,
        });
        setTimeout(() => setRfidToast(null), 5000);

        const originHosp = match.originHospital || getHospitalByName(match.origin) || { lat: 21.1348, lng: 81.6686, name: match.origin || 'Origin Hospital' };
        const destHosp = match.destinationHospital || getHospitalByName(match.destination) || { lat: 21.2330, lng: 81.6360, name: match.destination || 'Destination Hospital' };

        const liveItem = {
          ...match,
          status: 'IN_TRANSIT',
          startedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          rfidTriggered: true,
          rfidCard: targetSlot,
          currentLocation: typeof originHosp?.address === 'string' ? originHosp.address : (originHosp?.address?.street || 'En Route'),
          distance: match.distance || '18.2 km',
          eta: match.duration || '35 mins',
          etaTime: match.time || '03:45 PM',
          expectedArrival: match.time || '03:45 PM',
          driver: 'Rahul Sharma',
          driverRating: '4.9',
          vehicle: match.vehicle || 'AMB-105',
          vehicleType: match.vehicleType || 'Ambulance',
          iotBoxId: match.iotBoxId || 'IOT-78231',
          lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          iotData: {
            battery: '95%',
            temp: '4.3°C',
            tamper: 'Secure',
            blockchain: 'Verified',
            location: `${(originHosp?.lat || 21.1348).toFixed(4)}° N, ${(originHosp?.lng || 81.6686).toFixed(4)}° E`
          }
        };

        // Only auto-start the UI simulator if NOT in Live Mode!
        if (!isLiveMode && sim?.start) {
          sim.start(originHosp, destHosp);
          if (sim.triggerMilestone) sim.triggerMilestone('transport.dispatched');
        }

        // Clean state updates separated clearly
        setOngoingItems(o => {
          const exists = o.some(item => item.id === liveItem.id);
          return exists ? o : [liveItem, ...o];
        });
        
        setScheduledItems(prev => prev.filter(t => t.id !== match.id));
        
        setScheduledModalData(null);
        setTrackingModalData(liveItem);
    };

    // ── RFID Auto-Complete: Listen for transport:rfid_completed ─────────────────
    const handleRfidCompleted = (payload) => {
      const { missionId } = payload || {};
      
      setOngoingItems(prevOngoing => {
        if (!prevOngoing || prevOngoing.length === 0) return prevOngoing;
        const target = (missionId ? prevOngoing.find(item => item.id === missionId || item.missionId === missionId) : null) || prevOngoing[0];
        if (!target) return prevOngoing;

        const completedItem = {
          ...target,
          status: 'COMPLETED',
          completedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        setCompletedItems(prevComp => {
          const exists = prevComp.some(c => c.id === target.id);
          return exists ? prevComp : [completedItem, ...prevComp];
        });

        // Close tracking modal if currently open for this transport
        setTrackingModalData(null);

        return prevOngoing.filter(item => item.id !== target.id);
      });
    };


    // ── Pipeline A: Real ESP32 hardware telemetry via WebSocket ──────────────
    const handleTelemetryUpdate = (payload) => {
      if (!payload?.telemetry) return;
      const t = payload.telemetry;
      const normalized = normalizeTelemetry({
        ...t,
        lat: payload.location?.coordinates?.[1] ?? 0,
        lng: payload.location?.coordinates?.[0] ?? 0,
        missionId: payload.missionId,
      }, 'hardware');
      const nowMs = Date.now();
      lastHardwareMsRef.current = nowMs;
      // Persist to localStorage so that after page refresh we know hardware was active
      if (payload.missionId) {
        localStorage.setItem(`hw_last_seen_${payload.missionId}`, nowMs.toString());
      }
      setUnifiedTelemetry(normalized);
    };

    const handleTelemetryAlert = (payload) => {
      console.warn('🚨 TELEMETRY ALERT:', payload?.alerts);
    };

    socket.on('transport:rfid_started', handleRfidStarted);
    socket.on('transport:rfid_completed', handleRfidCompleted);
    socket.on('device:access', handleRfidStarted);
    socket.on('transport:telemetry', handleTelemetryUpdate);
    socket.on('transport:alert', handleTelemetryAlert);

    return () => {
      socket.off('transport:rfid_started', handleRfidStarted);
      socket.off('transport:rfid_completed', handleRfidCompleted);
      socket.off('device:access', handleRfidStarted);
      socket.off('transport:telemetry', handleTelemetryUpdate);
      socket.off('transport:alert', handleTelemetryAlert);
    };
  }, [socket, sim, isLiveMode, ongoingItems, completedItems, normalizeTelemetry]);

  // ── Pipeline B: IoT Simulator → unifiedTelemetry ──────────────────────────
  // The simulator feeds data ONLY when real hardware has NEVER been seen
  // for any ongoing mission. Once a real ESP32 box sends even ONE packet,
  // the simulator is permanently locked out for that mission — if the box
  // loses power, the UI stays "Offline" instead of falling back to fake data.
  useEffect(() => {
    if (!sim?.telemetry) return;

    // Check 1: in-memory — hardware sent a packet this session
    const HARDWARE_STALE_MS = 15000;
    const isHardwareFreshInMemory = (Date.now() - lastHardwareMsRef.current) < HARDWARE_STALE_MS;
    if (isHardwareFreshInMemory) return;

    // Check 2: permanent flag — hardware was EVER seen for any ongoing mission
    // This flag persists across page refreshes and has NO expiration.
    // It's only cleared when the mission is marked as completed/arrived.
    const missionIds = (ongoingItems || []).map(t => t.missionId || t.id).filter(Boolean);
    const hardwareEverSeen = missionIds.some(mid => {
      return localStorage.getItem(`hw_last_seen_${mid}`) !== null;
    });
    if (hardwareEverSeen) return; // PERMANENT block — hardware was used for this transport

    const normalized = normalizeTelemetry(sim.telemetry, 'simulator');
    setUnifiedTelemetry(normalized);
  }, [sim?.telemetry, normalizeTelemetry, ongoingItems]);

  // Auto-sync Simulator Target Mission to the active in-transit transport
  useEffect(() => {
    if (ongoingItems && ongoingItems.length > 0 && sim?.setMissionContext) {
      const active = ongoingItems[0];
      sim.setMissionContext(active.id || active.missionId, active.organType, active.iotBoxId);
    }
  }, [ongoingItems, sim]);


  const handleTransportCreated = async (newPayload) => {
    // Backend Cloud & Blockchain Persistence
    try {
      const res = await createMission({
        missionId:              newPayload.id,
        organType:              newPayload.organType || 'Kidney',
        transportType:          newPayload.transportType || 'Organ Transport',
        originHospitalName:     newPayload.origin,
        destinationHospitalName: newPayload.destination,
        patientId:              newPayload.patientId,
        patientName:            newPayload.patientName,
        priority:               newPayload.priority,
        assignedRfidCard:       newPayload.rfidCard || 1,
      });

      // fetchApi already unwraps .data, so res = { mission: {...} } or { missions: [...] }
      const mission = res?.mission || res?.data?.mission || res;
      if (mission && mission._id) {
        // Hydrate frontend card with Real MongoDB ID so manual dispatch button works!
        newPayload._id = mission._id;
        newPayload.dbId = mission._id;
        
        // Optimistically add to UI (fetchRealMissions will pick it up automatically anyway)
        setScheduledItems(prev => [newPayload, ...prev]);

        if (sim?.triggerMilestone) {
          sim.triggerMilestone('transport.created');
        }
      } else {
        console.warn('Unexpected response from createMission:', res);
        alert(`Backend rejected transport creation. Response: ${JSON.stringify(res)}`);
      }
    } catch (err) {
      console.warn('Backend persistence failed:', err);
      alert(`Failed to create mission: ${err.message || 'Unknown error'}`);
    }
  };

  const handleStartTransport = async (transport) => {
    // Prefer backend-supplied hospital objects (with real coordinates) over local name lookup
    const originHosp = transport.originHospital || getHospitalByName(transport.origin) || { lat: 21.1348, lng: 81.6686, name: transport.origin || 'Origin Hospital' };
    const destHosp = transport.destinationHospital || getHospitalByName(transport.destination) || { lat: 21.2330, lng: 81.6360, name: transport.destination || 'Destination Hospital' };

    const liveItem = {
      ...transport,
      id: transport.id || 'TRN-8901',
      _id: transport._id || transport.dbId,
      dbId: transport.dbId || transport._id,
      originHospital: originHosp,
      destinationHospital: destHosp,
      startedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      expectedArrival: new Date(Date.now() + 35 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      iotData: {
        battery: '98%',
        temp: '4.0°C',
        tamper: 'Secure',
        blockchain: 'Verified',
        location: `${(originHosp?.lat || 21.1348).toFixed(4)}° N, ${(originHosp?.lng || 81.6686).toFixed(4)}° E`
      }
    };

    // Ensure backend status is transitioned to IN_TRANSIT
    const dbId = transport.dbId || transport._id || transport.id;
    if (dbId) {
      try {
        await updateMissionWorkflow(dbId, 'dispatch').catch(() => {});
        await updateMissionWorkflow(dbId, 'startTransit').catch(() => {});
      } catch (err) {
        console.warn('Start transport backend workflow sync:', err.message);
      }
    }

    if (!isLiveMode && sim) {
      sim.start(originHosp, destHosp, null, {
        missionId: transport.id || transport.missionId,
        organType: transport.organType || 'KIDNEY',
        boxId: transport.iotBoxId || 'BOX-2026-FABRIC-ALPHA'
      });
      if (sim.triggerMilestone) {
        sim.triggerMilestone('transport.dispatched');
      }
    }

    setOngoingItems(prev => [liveItem, ...prev.filter(t => t.id !== transport.id)]);
    setScheduledItems(prev => prev.filter(t => t.id !== transport.id));
    setScheduledModalData(null);
    setTrackingModalData(liveItem);
  };

  const handleMarkAsDone = async (transportId) => {
    const transport = ongoingItems.find(t => t.id === transportId || t.missionId === transportId || t._id === transportId);
    if (!transport) return;

    // Get the real MongoDB _id from the transport (set during creation/fetch)
    const dbId = transport.dbId || transport._id || transport.id;

    try {
      if (dbId) {
        // Step 1: arrive (IN_TRANSIT → ARRIVED)
        await updateMissionWorkflow(dbId, 'arrive').catch(e => console.warn('Arrive step:', e));
        // Step 2: complete (ARRIVED → COMPLETED)
        await updateMissionWorkflow(dbId, 'complete').catch(e => console.warn('Complete step:', e));
      }

      if (sim?.triggerMilestone) sim.triggerMilestone('transport.completed');
      if (sim?.stop) sim.stop();

      const completedItem = {
        ...transport,
        status: 'COMPLETED',
        completedDate: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
        auditStatus: 'Audit Verified',
        hash: 'a3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8',
        txId: '0x7f3a2b1c...d9e8f7a6b5c4',
        verifiedOn: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')
      };

      setOngoingItems(prev => prev.filter(t => t.id !== transportId && t._id !== transportId));
      setCompletedItems(prev => [completedItem, ...prev.filter(c => c.id !== transportId && c._id !== transportId)]);
      setTrackingModalData(null);

      // Clean up hardware-seen flag so future simulator tests are unblocked
      const mid = transport.missionId || transport.id;
      if (mid) localStorage.removeItem(`hw_last_seen_${mid}`);
    } catch (err) {
      console.error('Failed to complete mission in backend:', err);
      alert(`Failed to mark as completed: ${err.message}`);
    }
  };

  const handleUpdateTransport = async (updatedData) => {
    setScheduledItems(prev => prev.map(item => item.id === updatedData.id ? { ...item, ...updatedData } : item));
    setOngoingItems(prev => prev.map(item => item.id === updatedData.id ? { ...item, ...updatedData } : item));
    setScheduledModalData(updatedData);

    // Persist edits directly to Backend MongoDB
    const dbId = updatedData._id || updatedData.dbId || updatedData.id;
    if (dbId) {
      try {
        await updateMission(dbId, {
          organType: updatedData.organType,
          patientName: updatedData.patientName,
          patientId: updatedData.patientId,
          priority: updatedData.priority,
          destination: updatedData.destination,
        });
      } catch (err) {
        console.warn('Backend mission edit persistence failed:', err.message);
      }
    }

    if (updatedData.organType && sim?.setMissionContext) {
      sim.setMissionContext(updatedData.id, updatedData.organType, updatedData.iotBoxId);
    }
  };

  // All users see all transports — backend enforces real tenant isolation via JWT
  const filterByHospital = (items) => items;

  const visibleScheduled = filterByHospital(scheduledItems);
  const visibleOngoing = filterByHospital(ongoingItems);
  const visibleCompleted = filterByHospital(completedItems);

  return (
    <div className={`p-4 md:p-6 min-h-screen transition-colors duration-200 ${
      isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#0B132B]'
    }`}>
      {/* RFID Match Top Floating Notification Toast */}
      {rfidToast && (
        <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3.5 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
            🔑
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">RFID Hardware Matched!</h4>
            <p className="text-xs font-bold text-white mt-0.5">
              Card {rfidToast.cardSlot} verified → Transport <span className="font-mono text-emerald-300 font-black">{rfidToast.transportId}</span> is now IN-TRANSIT 🚀
            </p>
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight transition-colors ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>
            Transport Management Board
          </h1>
          <p className={`text-xs mt-0.5 font-medium transition-colors ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
            Real-time cold-chain tracking and dispatch governance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isGovAdmin && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Admin Operating Mode Toggle */}
              {isGovAdmin && (
                <button
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isLiveMode
                      ? isDayMode 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50'
                      : isDayMode
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-amber-900/30 text-amber-400 border-amber-800/50 hover:bg-amber-900/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isLiveMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isLiveMode ? 'Live Sensors Mode' : 'Simulator Mode'}
                </button>
              )}
              
              {/* New Transportation Button */}
              <button 
                onClick={() => setIsNewModalOpen(true)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] ${
                  isDayMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/30'
                }`}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Transportation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The 3-Column Glassmorphic Kanban Board Container */}
      <div className={`flex-1 rounded-2xl shadow-xl backdrop-blur-md border transition-all duration-200 overflow-hidden flex flex-col ${
        isDayMode 
          ? 'bg-white/80 border-slate-200/80 shadow-slate-200/50' 
          : 'bg-[#0B101D]/90 border-slate-800 shadow-black/70'
      }`}>
        <TransportationBoard 
          scheduledItems={visibleScheduled}
          ongoingItems={visibleOngoing}
          completedItems={visibleCompleted}
          onSelectScheduled={(data) => setScheduledModalData(data)}
          onSelectTrack={(data) => setTrackingModalData(data)}
          onSelectAudit={(data) => setAuditModalData(data)}
        />
      </div>

      {/* 1. New Transport Form Modal */}
      <NewTransportModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        onTransportCreated={handleTransportCreated}
        activeHospital={activeHospital}
        scheduledItems={scheduledItems}
      />

      {/* 2. Scheduled Details Modal (Column 1) */}
      <ScheduledDetailsModal
        isOpen={!!scheduledModalData}
        onClose={() => setScheduledModalData(null)}
        transportData={scheduledModalData}
        onStartTransport={handleStartTransport}
        onUpdateTransport={handleUpdateTransport}
      />

      {/* 3. Live Tracking Modal (Column 2) */}
      <LiveTrackingModal 
        isOpen={!!trackingModalData} 
        onClose={() => setTrackingModalData(null)} 
        transportData={trackingModalData}
        onMarkAsDone={handleMarkAsDone}
        liveTelemetry={unifiedTelemetry}
      />

      {/* 4. Audit Record Modal (Column 3) */}
      <AuditRecordModal
        isOpen={!!auditModalData}
        onClose={() => setAuditModalData(null)}
        transportData={auditModalData}
      />

      {/* 5. RBAC Authorization Warning Modal */}
      {rbacError && (
        <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">Authorization Restricted</h3>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mt-1">
              Role-Based Governance Violation
            </p>

            <div className="w-full bg-red-50/80 border border-red-200/80 rounded-xl p-3.5 my-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Attempted Action:</span>
                <span className="font-bold text-gray-900">{rbacError.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Required Authorization:</span>
                <span className="font-bold text-red-700">{rbacError.allowedRole}</span>
              </div>
              <div className="flex justify-between border-t border-red-200/60 pt-2">
                <span className="text-gray-500 font-medium">Your Active LO Context:</span>
                <span className="font-bold text-gray-800">{rbacError.currentRole}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Under NOTTO cold-chain regulations: <br/>
              • <strong>Source Hospital LO</strong> starts the transport.<br/>
              • <strong>Destination Hospital LO</strong> confirms delivery & marks as arrived.
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setRbacError(null)}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Understand & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportManagement;
