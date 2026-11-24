import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, Ambulance, ScanLine, AlertCircle, HeartPulse, ShieldCheck, MapPin, User, Dna, Clock, RefreshCw, Lock } from 'lucide-react';
import { useSimulatorContext } from '../../../context/SimulatorContext';
import { useTheme } from '../../../context/ThemeContext';
import { getHospitalByName } from '../../../data/hospitals';
import { useHospitals } from '../../../data/useHospitals';

const NewTransportModal = ({ isOpen, onClose, onTransportCreated, activeHospital, scheduledItems = [] }) => {
  const sim = useSimulatorContext();
  const { isDayMode } = useTheme();
  const { hospitals: backendHospitals, loading: hospitalsLoading, refetch: refetchHospitals } = useHospitals();

  const scheduledCount = (scheduledItems || []).length;
  const assignedCards = (scheduledItems || []).map(t => Number(t.rfidCard || 1));
  const isMaxScheduledReached = scheduledCount >= 3;

  const allHospitals = backendHospitals.filter(h => {
    const status = (h.status || 'APPROVED').toUpperCase();
    return status === 'APPROVED' || status === 'ACTIVE' || status === 'REGISTERED';
  });

  const [formData, setFormData] = useState(() => {
    const first  = allHospitals[0];
    const second = allHospitals[1] || allHospitals[0];
    return {
      patientName: '',
      patientId: 'P-' + Math.floor(10000 + Math.random() * 90000),
      patientRole: 'Recipient (Organ Receiver)',
      ageGender: '32 Years / Female',
      bloodGroup: 'A+',
      contact: '+91 98123 45678',
      organType: 'Kidney',
      transportType: 'Organ Transport',
      hlaMatch: '5 / 6 Match',
      ischemicLimit: '4.0 Hours',
      origin: first?.name || '',
      originAddress: typeof first?.address === 'string' ? first.address : (first?.address?.street || ''),
      destination: second?.name || '',
      destinationAddress: typeof second?.address === 'string' ? second.address : (second?.address?.street || ''),
      priority: 'High',
      distance: '18.2 km',
      duration: '35 mins',
      iotBoxId: 'IOT-' + Math.floor(70000 + Math.random() * 9000),
      rfidCard: 1,  // Default: RFID Card 1
    };
  });

  // Re-initialize when modal opens — auto-select unassigned RFID card slot
  useEffect(() => {
    if (isOpen) {
      refetchHospitals();
      const firstAvailableCard = [1, 2, 3].find(c => !assignedCards.includes(c)) || 1;
      setFormData(prev => ({ ...prev, rfidCard: firstAvailableCard }));
    }
  }, [isOpen]);

  // Sync origin and destination when hospital list arrives or updates
  useEffect(() => {
    if (isOpen && allHospitals.length > 0) {
      setFormData(prev => {
        const first = allHospitals[0];
        const second = allHospitals.find(h => h.name !== first.name) || first;
        const isOriginValid = allHospitals.some(h => h.name === prev.origin);
        const isDestValid   = allHospitals.some(h => h.name === prev.destination);

        const newOrigin = isOriginValid ? prev.origin : first.name;
        const originHosp = allHospitals.find(h => h.name === newOrigin) || first;
        const newOriginAddress = typeof originHosp.address === 'string' ? originHosp.address : (originHosp.address?.street || '');

        const newDest = isDestValid ? prev.destination : second.name;
        const destHosp = allHospitals.find(h => h.name === newDest) || second;
        const newDestAddress = typeof destHosp.address === 'string' ? destHosp.address : (destHosp.address?.street || '');

        return {
          ...prev,
          origin: newOrigin,
          originAddress: newOriginAddress,
          destination: newDest,
          destinationAddress: newDestAddress,
        };
      });
    }
  }, [isOpen, allHospitals]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'origin') {
      const hosp = getHospitalByName(value);
      setFormData(prev => ({ ...prev, origin: value, originAddress: hosp.address }));
    } else if (name === 'destination') {
      const hosp = getHospitalByName(value);
      setFormData(prev => ({ ...prev, destination: value, destinationAddress: hosp.address }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid = 
    formData.patientId && 
    formData.organType &&
    formData.origin && 
    formData.destination && 
    formData.priority && 
    formData.iotBoxId &&
    formData.rfidCard;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || isMaxScheduledReached) return;

    const newId = `TRN-${Math.floor(8900 + Math.random() * 1000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newTransportPayload = {
      ...formData,
      id: newId,
      rfidCard: Number(formData.rfidCard || 1),
      requestedPickup: `${dateStr}, ${timeStr}`,
      date: dateStr,
      time: timeStr,
      vehicle: 'AMB-105',
      vehicleType: 'Ambulance',
      iotStatus: 'Awaiting IoT Box Pairing',
      hash: 'a3f1b6c2d7e4f9a8b1c3d5e7f9a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8',
      txId: '0x7f3a2b1c...d9e8f7a6b5c4',
      verifiedOn: `${dateStr}, ${timeStr}`,
      network: 'Jeevan Setu Trust Network',
      pairingHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
    };

    if (onTransportCreated) {
      onTransportCreated(newTransportPayload);
    }
    onClose();
  };

  const handleAutofill = () => {
    const fresh = allHospitals;
    const first  = fresh[0];
    const second = fresh.find(h => h.name !== first?.name) || fresh[0];
    const getAddr = (h) => typeof h?.address === 'string' ? h.address : (h?.address?.street || '');

    setFormData({
      patientName: 'CONFIDENTIAL',
      patientId: 'P-' + Math.floor(10000 + Math.random() * 90000),
      patientRole: 'Recipient (Organ Receiver)',
      ageGender: '28 Years / Female',
      bloodGroup: 'O+',
      contact: 'CONFIDENTIAL',
      organType: 'Heart',
      transportType: 'Organ Transport',
      hlaMatch: '6 / 6 Match',
      ischemicLimit: '4.0 Hours',
      origin: first?.name || '',
      originAddress: getAddr(first),
      destination: second?.name || '',
      destinationAddress: getAddr(second),
      priority: 'Critical',
      distance: '18.2 km',
      duration: '35 mins',
      iotBoxId: 'IOT-' + Math.floor(70000 + Math.random() * 9000),
      rfidCard: 1,
    });
  };


  const RequiredStar = () => <span className="text-red-500 ml-1">*</span>;

  const inputStyle = `w-full h-9 border rounded-xl px-3.5 text-xs outline-none transition-all font-medium ${
    isDayMode 
      ? 'bg-white border-slate-200/90 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400' 
      : 'bg-[#182640]/90 border-slate-600/70 text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder-slate-400/80 shadow-inner shadow-black/20'
  }`;

  const selectStyle = `w-full h-9 border rounded-xl px-3 text-xs outline-none cursor-pointer transition-all font-semibold ${
    isDayMode 
      ? 'bg-white border-slate-200/90 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
      : 'bg-[#182640]/90 border-slate-600/70 text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-inner shadow-black/20'
  }`;

  const cardStyle = `p-4 rounded-2xl border shadow-md space-y-3 transition-all ${
    isDayMode 
      ? 'bg-white border-slate-200/80 shadow-slate-200/50' 
      : 'bg-[#111A2D] border-slate-700/80 shadow-black/50 hover:border-slate-600/80'
  }`;

  const labelStyle = `block text-[11px] font-bold tracking-tight mb-1 ${
    isDayMode ? 'text-[#0B1B3D]' : 'text-slate-200'
  }`;

  return (
    <div className="fixed inset-0 bg-gray-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-5 font-sans animate-in fade-in duration-200">
      <div className={`rounded-2xl shadow-2xl backdrop-blur-xl w-full max-w-[840px] flex flex-col max-h-[92vh] overflow-hidden border transition-all ${
        isDayMode 
          ? 'bg-white border-slate-200/80 shadow-slate-300/40' 
          : 'bg-[#0A101D] border-slate-800 shadow-black/90'
      }`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          isDayMode ? 'bg-white border-slate-100' : 'bg-[#0E1626] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border shadow-xs ${
              isDayMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-900/40 text-blue-400 border-blue-700/60'
            }`}>
              <Ambulance size={20} />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold tracking-tight ${isDayMode ? 'text-[#0B1B3D]' : 'text-slate-100'}`}>Create Transportation Request</h2>
              <p className={`text-xs mt-0.5 font-medium ${isDayMode ? 'text-gray-500' : 'text-slate-400'}`}>Input organ transport details, patient specifications, and IoT box pairing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh hospitals button */}
            <button
              type="button"
              onClick={refetchHospitals}
              title="Refresh hospital list from database"
              className={`p-2 rounded-xl transition-all border ${
                isDayMode ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 border-slate-700/50'
              } ${hospitalsLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-xl transition-all ${
                isDayMode ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-slate-700/50'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body - Clean Multi-Section Form */}
        <div className={`p-5 overflow-y-auto flex-1 custom-scrollbar ${
          isDayMode ? 'bg-[#F8FAFC]' : 'bg-[#060B14]'
        }`}>
          <form id="transport-creation-form" onSubmit={handleSubmit} className="space-y-3.5 pb-12">
            
            {/* 1. Patient & Recipient Specs */}
            <div className={cardStyle}>
              <div className={`flex items-center gap-2.5 border-b pb-3 ${isDayMode ? 'border-slate-100' : 'border-slate-700/60'}`}>
                <span className={`p-1.5 rounded-lg border shadow-xs ${
                  isDayMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-900/40 text-blue-400 border-blue-700/50'
                }`}>
                  <User size={15} />
                </span>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${isDayMode ? 'text-blue-700' : 'text-blue-400'}`}>
                  1. Patient & Recipient Identification
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className={labelStyle}>Patient Identity</label>
                  <div className={`w-full h-9 border rounded-xl px-3.5 flex items-center text-xs font-bold ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#182640]/50 border-slate-700 text-slate-500'
                  }`}>
                    <Lock size={12} className="mr-2" /> CONFIDENTIAL
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Patient Role<RequiredStar/></label>
                  <select 
                    name="patientRole" 
                    value={formData.patientRole} 
                    onChange={handleChange} 
                    className={selectStyle}
                  >
                    <option value="Recipient (Organ Receiver)">Recipient (Organ Receiver)</option>
                    <option value="Donor (Organ Donor)">Donor (Organ Donor)</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>Patient ID<RequiredStar/></label>
                  <input 
                    type="text" 
                    name="patientId" 
                    required 
                    value={formData.patientId} 
                    onChange={handleChange} 
                    className={`${inputStyle} font-mono`} 
                    placeholder="e.g. P-10046" 
                  />
                </div>

                <div>
                  <label className={labelStyle}>Age & Gender</label>
                  <input 
                    type="text" 
                    name="ageGender" 
                    value={formData.ageGender} 
                    onChange={handleChange} 
                    className={inputStyle} 
                    placeholder="e.g. 32 Years / Female" 
                  />
                </div>

                <div>
                  <label className={labelStyle}>Blood Group</label>
                  <select 
                    name="bloodGroup" 
                    value={formData.bloodGroup} 
                    onChange={handleChange} 
                    className={`${selectStyle} font-bold text-red-500`}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>Contact Number</label>
                  <div className={`w-full h-9 border rounded-xl px-3.5 flex items-center text-xs font-bold ${
                    isDayMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#182640]/50 border-slate-700 text-slate-500'
                  }`}>
                    <Lock size={12} className="mr-2" /> HIDDEN
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Organ Viability Specs */}
            <div className={cardStyle}>
              <div className={`flex items-center gap-2.5 border-b pb-3 ${isDayMode ? 'border-slate-100' : 'border-slate-700/60'}`}>
                <span className={`p-1.5 rounded-lg border shadow-xs ${
                  isDayMode ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50'
                }`}>
                  <HeartPulse size={15} />
                </span>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${isDayMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  2. Organ & Viability Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div>
                  <label className={labelStyle}>Organ Type<RequiredStar/></label>
                  <select 
                    name="organType" 
                    required 
                    value={formData.organType} 
                    onChange={handleChange} 
                    className={`${selectStyle} font-bold`}
                  >
                    <option value="Kidney">Kidney</option>
                    <option value="Heart">Heart</option>
                    <option value="Liver">Liver</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                    <option value="Cornea">Cornea</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>Transport Category</label>
                  <select 
                    name="transportType" 
                    value={formData.transportType} 
                    onChange={handleChange} 
                    className={selectStyle}
                  >
                    <option value="Organ Transport">Organ Transport</option>
                    <option value="Tissue Transport">Tissue Transport</option>
                    <option value="Corneal Graft">Corneal Graft</option>
                    <option value="Blood/Plasma">Blood/Plasma</option>
                  </select>
                </div>

                <div>
                  <label className={labelStyle}>HLA Match Score</label>
                  <input 
                    type="text" 
                    name="hlaMatch" 
                    value={formData.hlaMatch} 
                    onChange={handleChange} 
                    className={`${inputStyle} text-purple-400 font-semibold`} 
                    placeholder="e.g. 5 / 6 Match" 
                  />
                </div>

                <div>
                  <label className={labelStyle}>Ischemia Time Limit</label>
                  <input 
                    type="text" 
                    name="ischemicLimit" 
                    value={formData.ischemicLimit} 
                    onChange={handleChange} 
                    className={inputStyle} 
                    placeholder="e.g. 4.0 Hours" 
                  />
                </div>
              </div>
            </div>

            {/* 3. Route & Urgency */}
            <div className={cardStyle}>
              <div className={`flex items-center gap-2.5 border-b pb-3 ${isDayMode ? 'border-slate-100' : 'border-slate-700/60'}`}>
                <span className={`p-1.5 rounded-lg border shadow-xs ${
                  isDayMode ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-900/40 text-amber-400 border-amber-700/50'
                }`}>
                  <MapPin size={15} />
                </span>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${isDayMode ? 'text-amber-700' : 'text-amber-400'}`}>
                  3. Route & Logistics Urgency
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelStyle}>
                    Origin Hospital <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  {
                    allHospitals.length === 0 ? (
                      <div className={`${inputStyle} flex items-center text-gray-400 italic`}>
                        No registered hospitals available
                      </div>
                    ) : (
                      <select
                        name="origin"
                        required
                        value={formData.origin}
                        onChange={handleChange}
                        className={`${selectStyle} font-semibold text-blue-600 dark:text-blue-400`}
                      >
                        {allHospitals
                          .filter(h => h.name !== formData.destination)
                          .map(h => (
                            <option key={h.id || h.name} value={h.name}>{h.name}</option>
                          ))}
                      </select>
                    )
                  }
                </div>

                <div>
                  <label className={labelStyle}>Destination Hospital <span className="text-red-500 ml-0.5">*</span></label>
                  {
                    allHospitals.length <= 1 ? (
                      <div className={`${inputStyle} flex items-center text-gray-400 italic`}>
                        {allHospitals.length === 0 ? 'No registered hospitals available' : 'No other hospitals registered yet'}
                      </div>
                    ) : (
                      <select
                        name="destination"
                        required
                        value={formData.destination}
                        onChange={handleChange}
                        className={`${selectStyle} font-medium`}
                      >
                        {allHospitals
                          .filter(h => h.name !== formData.origin)
                          .map(h => (
                            <option key={h.id || h.name} value={h.name}>{h.name}</option>
                          ))}
                      </select>
                    )
                  }
                </div>

                <div>
                  <label className={labelStyle}>Origin Address</label>
                  <input 
                    type="text" 
                    name="originAddress" 
                    value={formData.originAddress} 
                    onChange={handleChange} 
                    className={inputStyle} 
                    placeholder="e.g. 45, MG Road, Civil Lines, New Delhi" 
                  />
                </div>

                <div>
                  <label className={labelStyle}>Destination Address</label>
                  <input 
                    type="text" 
                    name="destinationAddress" 
                    value={formData.destinationAddress} 
                    onChange={handleChange} 
                    className={inputStyle} 
                    placeholder="e.g. Sector 44, Golf Course Road, Gurugram" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelStyle}>Priority Level<RequiredStar/></label>
                  <select 
                    name="priority" 
                    required 
                    value={formData.priority} 
                    onChange={handleChange} 
                    className={`${selectStyle} font-bold text-amber-500`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Hardware Binding */}
            <div className={cardStyle}>
              <div className={`flex items-center gap-2.5 border-b pb-3 ${isDayMode ? 'border-slate-100' : 'border-slate-700/60'}`}>
                <span className={`p-1.5 rounded-lg border shadow-xs ${
                  isDayMode ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-purple-900/40 text-purple-400 border-purple-700/50'
                }`}>
                  <ShieldCheck size={15} />
                </span>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${isDayMode ? 'text-purple-700' : 'text-purple-400'}`}>
                  4. IoT Container Hardware Pairing
                </h3>
              </div>

              <div>
                <label className={labelStyle}>IoT Box Pairing ID<RequiredStar/></label>
                <div className="flex gap-2.5">
                  <input 
                    type="text" 
                    name="iotBoxId" 
                    required 
                    value={formData.iotBoxId} 
                    onChange={handleChange} 
                    className={`${inputStyle} font-mono font-semibold`} 
                    placeholder="e.g. IOT-78231" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, iotBoxId: 'IOT-' + Math.floor(70000 + Math.random() * 9000) }))}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md shrink-0 border active:scale-[0.98] ${
                      isDayMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 border-transparent' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 border-white/20'
                    }`}
                  >
                    <ScanLine size={14} />
                    Scan Hardware
                  </button>
                </div>

                {/* RFID Card Assignment */}
              <div className="mt-3">
                <label className={labelStyle}>Assign RFID Card<RequiredStar/></label>
                <select
                  name="rfidCard"
                  required
                  value={formData.rfidCard}
                  onChange={handleChange}
                  className={`${selectStyle} font-bold`}
                >
                  <option value={1} disabled={assignedCards.includes(1)}>
                    🔑 RFID Card 1 (UID: 3913DDB7) {assignedCards.includes(1) ? '— ⛔ Currently Assigned' : '— ✅ Available'}
                  </option>
                  <option value={2} disabled={assignedCards.includes(2)}>
                    🔑 RFID Card 2 (UID: 19DB5AB7) {assignedCards.includes(2) ? '— ⛔ Currently Assigned' : '— ✅ Available'}
                  </option>
                  <option value={3} disabled={assignedCards.includes(3)}>
                    🔑 RFID Card 3 (UID: 29EE69B7) {assignedCards.includes(3) ? '— ⛔ Currently Assigned' : '— ✅ Available'}
                  </option>
                </select>
                <p className={`mt-1.5 text-[10px] ${isDayMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  Each physical RFID card corresponds to 1 hardware container. Only unassigned cards can be selected.
                </p>
              </div>

              {(!sim || !sim.running) && (
                  <div className={`mt-3 flex items-center gap-2.5 text-[11px] px-3.5 py-2.5 rounded-xl border shadow-xs ${
                    isDayMode 
                      ? 'text-amber-800 bg-amber-50/90 border-amber-200/80' 
                      : 'text-amber-300 bg-amber-950/60 border-amber-800/60'
                  }`}>
                    <AlertCircle size={14} className="shrink-0 text-amber-500" />
                    <span>Smart contract pre-dispatch handshake initialized. Cold-chain logging will bind upon start.</span>
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between items-center shrink-0 pr-24 sm:pr-32 ${
          isDayMode ? 'bg-white border-gray-100' : 'bg-[#0F172A] border-slate-800/80'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-5 py-2 border rounded-xl text-xs font-semibold transition-all ${
                isDayMode 
                  ? 'border-gray-300/80 text-gray-700 hover:bg-gray-100/80' 
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleAutofill} 
              className={`px-5 py-2 border rounded-xl text-xs font-semibold transition-all ${
                isDayMode 
                  ? 'border-indigo-300/80 text-indigo-700 hover:bg-indigo-50/80' 
                  : 'border-indigo-700 text-indigo-300 hover:bg-indigo-900/40 hover:text-white'
              }`}
            >
              Autofill
            </button>
          </div>
          <button 
            type="submit" 
            form="transport-creation-form"
            className={`px-6 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all shadow-md border flex items-center gap-2 ${
              isDayMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 border-transparent' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 border-emerald-400/20'
            }`}
          >
            <CalendarCheck size={15} />
            <span>Create Request</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewTransportModal;
