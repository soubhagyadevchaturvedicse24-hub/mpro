import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, User, MapPin, Clock, Navigation, Flag, 
  Box, Battery, Thermometer, Lock, ShieldCheck, Info, Edit3, Play, Copy, HeartPulse, Dna, CheckCircle2,
  CreditCard, Wifi, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { getALLHospitals, getHospitalByName } from '../../../data/hospitals';
import { useSocket } from '../../../context/SocketContext';

const formatAddressString = (addr) => {
  if (!addr) return 'Hospital Campus Address';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    if (addr.address && typeof addr.address === 'string') return addr.address;
    const street = addr.street || addr.addressLine1 || '';
    const city = addr.city || addr.district || '';
    const state = addr.state || '';
    const pin = addr.pincode || addr.pin || '';
    const parts = [street, city, state, pin].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Hospital Campus Address';
  }
  return String(addr);
};

const ScheduledDetailsModal = ({ isOpen, onClose, transportData, onStartTransport, onUpdateTransport }) => {
  const { isDayMode } = useTheme();
  const socket = useSocket();
  const [copiedId, setCopiedId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualStarting, setManualStarting] = useState(false);
  const [rfidMatched, setRfidMatched] = useState(false);

  useEffect(() => {
    if (!socket || !isOpen || !transportData) return;
    const handleRfidStarted = (payload) => {
      const cardSlot = Number(payload.cardSlot);
      const assignedSlot = Number(transportData.rfidCard || 1);
      if (cardSlot === assignedSlot || payload.missionId === transportData.id) {
        setRfidMatched(true);
      }
    };
    socket.on('transport:rfid_started', handleRfidStarted);
    return () => socket.off('transport:rfid_started', handleRfidStarted);
  }, [socket, isOpen, transportData]);

  const [editFields, setEditFields] = useState({
    patientName: '',
    organType: '',
    priority: '',
    contact: '',
    destination: '',
    requestedPickup: ''
  });

  useEffect(() => {
    if (transportData) {
      setEditFields({
        patientName: transportData.patientName || 'Alice Johnson',
        organType: transportData.organType || 'Kidney',
        priority: transportData.priority || 'High',
        contact: transportData.contact || '+91 98123 45678',
        destination: transportData.destination || 'Sunrise Hospital',
        requestedPickup: transportData.requestedPickup || `${transportData.date || '05 Aug 2026'}, ${transportData.time || '02:30 PM'}`
      });
    }
  }, [transportData, isOpen]);

  if (!isOpen) return null;

  const destHosp = getHospitalByName(editFields.destination || transportData?.destination || 'Sunrise Hospital');
  const originHosp = getHospitalByName(transportData?.origin || 'CityCare Hospital');

  const data = {
    id: transportData?.id || 'TRN-8903',
    patientName: editFields.patientName || transportData?.patientName || 'Alice Johnson',
    patientId: transportData?.patientId || 'P-10046',
    ageGender: transportData?.ageGender || '32 Years / Female',
    bloodGroup: transportData?.bloodGroup || 'A+',
    contact: editFields.contact || transportData?.contact || '+91 98123 45678',
    organType: editFields.organType || transportData?.organType || 'Kidney',
    hlaMatch: transportData?.hlaMatch || '5 / 6 Match',
    ischemicLimit: transportData?.ischemicLimit || '4.0 Hours',
    origin: transportData?.origin || 'CityCare Hospital',
    originAddress: formatAddressString(transportData?.originAddress || originHosp?.address),
    destination: editFields.destination || transportData?.destination || 'Sunrise Hospital',
    destinationAddress: formatAddressString(transportData?.destinationAddress || destHosp?.address),
    requestedPickup: editFields.requestedPickup || transportData?.requestedPickup || `${transportData?.date || '05 Aug 2026'}, ${transportData?.time || '02:30 PM'}`,
    distance: transportData?.distance || '18.2 km',
    duration: transportData?.duration || '35 mins',
    priority: editFields.priority || transportData?.priority || 'High',
    pairingHash: transportData?.pairingHash || '0x8f3a9b1c4e7d2f0a...c9e2'
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(data.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStart = () => {
    if (onStartTransport) onStartTransport(data);
    onClose();
  };

  const handleManualStart = async () => {
    setManualStarting(true);
    try {
      // Call the backend workflow API to officially start transit
      const token = localStorage.getItem('neolife_token');
      const missionDbId = transportData?._id || transportData?.dbId;
      if (missionDbId) {
        await fetch(`/api/v1/transport/missions/${missionDbId}/workflow/startTransit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({})
        });
      }
    } catch (e) { /* Handled by parent refresh */ }
    setManualStarting(false);
    if (onStartTransport) onStartTransport(data);
    onClose();
  };

  const handleSaveEdit = () => {
    const updated = {
      ...transportData,
      ...editFields,
      destinationAddress: data.destinationAddress
    };
    if (onUpdateTransport) {
      onUpdateTransport(updated);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className={`rounded-2xl shadow-2xl w-full max-w-[1080px] flex flex-col max-h-[94vh] overflow-hidden border transition-colors ${
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
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>
                  {isEditing ? 'Edit Scheduled Transportation' : 'Scheduled Transportation Details'}
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isDayMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                }`}>
                  <Clock size={12} /> {isEditing ? 'Editing Mode' : 'Scheduled'}
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 flex items-center gap-1.5 ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Transportation ID: <span className="font-semibold text-blue-500 font-mono">{data.id}</span>
                <button 
                  onClick={handleCopyId}
                  className={`text-[10px] font-sans ml-1 flex items-center gap-0.5 ${
                    isDayMode ? 'text-gray-400 hover:text-blue-600' : 'text-slate-400 hover:text-blue-400'
                  }`}
                  title="Copy ID"
                >
                  <Copy size={11} />
                  {copiedId ? <span className="text-emerald-500 font-bold">Copied!</span> : null}
                </button>
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
          
          {/* Top Row: Patient & Organ Specs & Route Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Patient & Organ Details Card */}
            <div className={`lg:col-span-5 p-4 rounded-xl border shadow-sm flex flex-col justify-between ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <h3 className={`text-xs font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Patient & Organ Specs</h3>
                </div>
                {isEditing ? (
                  <select 
                    value={editFields.organType}
                    onChange={(e) => setEditFields(p => ({ ...p, organType: e.target.value }))}
                    className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 outline-none"
                  >
                    <option value="Kidney">Kidney</option>
                    <option value="Heart">Heart</option>
                    <option value="Liver">Liver</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                    <option value="Cornea">Cornea</option>
                  </select>
                ) : (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <HeartPulse size={11} /> {data.organType}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <User size={28} />
                </div>
                <div className="space-y-1.5 text-xs w-full">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Patient Identity</span>
                    <span className="inline-block bg-slate-100 text-slate-500 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200 mt-0.5 flex items-center w-max gap-1">
                      <Lock size={10} /> CONFIDENTIAL
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Patient Role</span>
                    <span className="inline-block bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2 py-0.5 rounded border border-blue-200 mt-0.5">
                      Recipient (Organ Receiver)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-gray-100 mt-1">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Patient ID</span>
                      <span className={`font-semibold font-mono ${isDayMode ? 'text-gray-700' : 'text-slate-300'}`}>{data.patientId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Blood Group</span>
                      <span className="font-bold text-red-600">{data.bloodGroup}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Age / Gender</span>
                      <span className={`font-medium ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.ageGender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Contact</span>
                      <span className="inline-block bg-slate-100 text-slate-500 font-bold text-[10px] px-1.5 py-0.5 rounded border border-slate-200 flex items-center w-max gap-1">
                        <Lock size={10} /> HIDDEN
                      </span>
                    </div>
                  </div>

                  {/* THOTA Regulatory Specs */}
                  <div className="pt-2 border-t border-gray-100 mt-1.5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      <Dna size={11} /> {data.hlaMatch}
                    </div>
                    <div className="text-gray-500 font-medium">
                      Ischemic Max: <strong className="text-gray-800">{data.ischemicLimit}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Details Card */}
            <div className={`lg:col-span-7 p-4 rounded-xl border shadow-sm flex flex-col justify-between ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-blue-600" />
                <h3 className={`text-xs font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Route Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Visual Timeline Route */}
                <div className="md:col-span-7 space-y-3 relative pl-6 border-l-2 border-dashed border-gray-200 ml-2">
                  {/* Origin Dot */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">From (Origin Hospital)</span>
                    <h4 className={`text-xs font-bold ${isDayMode ? 'text-gray-900' : 'text-slate-100'}`}>{data.origin}</h4>
                    <p className="text-[11px] text-gray-500 leading-tight">{data.originAddress}</p>
                  </div>

                  {/* Destination Dot */}
                  <div className="relative pt-2">
                    <span className="absolute -left-[31px] top-3 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">To (Destination Hospital)</span>
                    {isEditing ? (
                      <select 
                        value={editFields.destination}
                        onChange={(e) => setEditFields(p => ({ ...p, destination: e.target.value }))}
                        className="w-full mt-1 p-1 text-xs border border-blue-300 font-bold rounded-md outline-none bg-white text-gray-900"
                      >
                        {getALLHospitals()
                          .filter(h => {
                            const status = (h.status || 'APPROVED').toUpperCase();
                            return (status === 'APPROVED' || status === 'ACTIVE') && h.name !== data.origin;
                          })
                          .map(h => (
                            <option key={h.id} value={h.name}>{h.name}</option>
                          ))}
                      </select>
                    ) : (
                      <>
                        <h4 className={`text-xs font-bold ${isDayMode ? 'text-gray-900' : 'text-slate-100'}`}>{data.destination}</h4>
                        <p className="text-[11px] text-gray-500 leading-tight">{data.destinationAddress}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Meta Column */}
                <div className="md:col-span-5 space-y-2 text-xs border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 font-medium block">Requested Pickup</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editFields.requestedPickup} 
                          onChange={(e) => setEditFields(p => ({ ...p, requestedPickup: e.target.value }))}
                          className="w-full text-xs font-semibold px-1.5 py-0.5 border rounded outline-none"
                        />
                      ) : (
                        <span className={`font-semibold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.requestedPickup}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 font-medium block">Est. Distance</span>
                      <span className={`font-semibold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.distance}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 font-medium block">Est. Duration</span>
                      <span className={`font-semibold ${isDayMode ? 'text-gray-800' : 'text-slate-200'}`}>{data.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Flag size={14} className="text-purple-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 font-medium block">Priority Level</span>
                      {isEditing ? (
                        <select 
                          value={editFields.priority}
                          onChange={(e) => setEditFields(p => ({ ...p, priority: e.target.value }))}
                          className="text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 outline-none mt-0.5"
                        >
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Urgent">Urgent Priority</option>
                        </select>
                      ) : (
                        <span className="inline-block bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200 mt-0.5">
                          ● {data.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom: IoT Box Setup */}
          <div className={`p-4 rounded-xl border shadow-sm space-y-3 ${isDayMode ? 'bg-white border-gray-100' : 'bg-[#131b2f] border-slate-700/60'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-blue-600" />
                <h3 className={`text-xs font-bold ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>IoT Box Setup & Hardware Pairing</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className={`md:col-span-3 flex justify-center p-2 rounded-xl border ${isDayMode ? 'bg-gray-50 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'}`}>
                <img src="/assets/iot_box.jpg" alt="IoT Organ Transport Cooler" className="max-h-28 object-contain rounded-lg shadow-sm" />
              </div>

              <div className="md:col-span-9 grid grid-cols-5 gap-2">
                <div className={`border rounded-xl p-2.5 flex flex-col items-center text-center ${isDayMode ? 'bg-gray-50 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'}`}>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
                    <Battery size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800 mb-1">Battery Status</span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                    <Clock size={8} /> Awaiting Start
                  </span>
                </div>

                <div className={`border rounded-xl p-2.5 flex flex-col items-center text-center ${isDayMode ? 'bg-gray-50 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'}`}>
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5">
                    <Thermometer size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800 mb-1">Temperature</span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                    <Clock size={8} /> Awaiting Start
                  </span>
                </div>

                <div className={`border rounded-xl p-2.5 flex flex-col items-center text-center ${isDayMode ? 'bg-gray-50 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'}`}>
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5">
                    <Lock size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800 mb-1">Tamper Security</span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                    <Clock size={8} /> Awaiting Start
                  </span>
                </div>

                <div className={`border rounded-xl p-2.5 flex flex-col items-center text-center ${isDayMode ? 'bg-gray-50 border-gray-100' : 'bg-[#0f172a] border-slate-700/60'}`}>
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5">
                    <ShieldCheck size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800 mb-1">Blockchain Verification</span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                    <Clock size={8} /> Awaiting Start
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-1.5">
                    <MapPin size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-800 mb-1">Location Tracking</span>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                    <Clock size={8} /> Awaiting Start
                  </span>
                </div>
              </div>
            </div>

            {/* RFID Card Assignment Status */}
            {transportData?.rfidCard && (
              <div className={`mt-3 rounded-xl border p-3 flex items-center gap-3 ${
                isDayMode 
                  ? 'bg-violet-50 border-violet-200' 
                  : 'bg-violet-950/40 border-violet-700/60'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isDayMode ? 'bg-violet-100 text-violet-600' : 'bg-violet-900/60 text-violet-300'
                }`}>
                  <CreditCard size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-extrabold uppercase tracking-wide ${
                    isDayMode ? 'text-violet-700' : 'text-violet-300'
                  }`}>Assigned RFID Card</p>
                  <p className={`text-xs font-bold mt-0.5 ${
                    isDayMode ? 'text-gray-800' : 'text-slate-100'
                  }`}>
                    🔑 Card {transportData.rfidCard} &nbsp;
                    <span className="font-mono text-[10px] text-gray-400">
                      ({transportData.rfidCard === 1 ? '3913DDB7' : transportData.rfidCard === 2 ? '19DB5AB7' : '29EE69B7'})
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
                  <span className={`text-[10px] font-semibold ${
                    isDayMode ? 'text-amber-700' : 'text-amber-300'
                  }`}>Waiting for scan</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50/60 border border-blue-100 text-blue-700 rounded-lg p-2.5 text-[11px] flex items-center gap-2">
              <Info size={14} className="shrink-0 text-blue-500" />
              <span>Smart Contract pre-bound. Telemetry & cold-chain logging will begin automatically upon starting transport.</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3 bg-white shrink-0">
          {isEditing ? (
            <>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveEdit} 
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Edit3 size={15} />
                Edit Details
              </button>

              {/* Primary: RFID Scan waiting / matched indicator */}
              <div className="flex items-center gap-2">
                {rfidMatched ? (
                  <div className="flex items-center gap-2 px-5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>✅ RFID Card {transportData?.rfidCard || 1} Matched & Verified!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold">
                    <Wifi size={14} className="animate-pulse text-violet-600" />
                    <span>Waiting for RFID Card {transportData?.rfidCard || 1} scan...</span>
                  </div>
                )}

                {/* Admin & Manual Start Button */}
                <button 
                  type="button" 
                  onClick={handleManualStart}
                  disabled={manualStarting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap shrink-0"
                  title="Admin Override: Dispatch transport immediately without waiting for hardware RFID scan"
                >
                  {manualStarting ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Starting Transit...</>
                  ) : (
                    <><Play size={15} className="fill-white shrink-0" /> Start Transport (Admin Override)</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScheduledDetailsModal;
