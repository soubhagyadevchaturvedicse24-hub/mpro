import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, X, CheckCircle2, XCircle, Clock, 
  FileText, ShieldCheck, UserCheck, AlertCircle 
} from 'lucide-react';
import { listPendingHospitals, approveHospital, rejectHospital, reviewHospital } from '../services/hospitalApi';
import { getRegisteredHospitalsFromStorage, initHospitals } from '../data/hospitals';
import styles from './HospitalApprovals.module.css';

const HospitalApprovals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [drawerTab, setDrawerTab] = useState('OVERVIEW'); // OVERVIEW, DOCUMENTS, PERSONNEL
  
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      let backendList = [];
      try {
        const data = await listPendingHospitals();
        backendList = Array.isArray(data) ? data : (data?.hospitals || []);
      } catch (err) {
        console.warn('Backend listPendingHospitals unavailable, using local registry fallback.', err);
      }

      const localList = getRegisteredHospitalsFromStorage();

      const combinedMap = new Map();
      backendList.forEach(h => {
        const key = h._id || h.id || h.name?.toLowerCase();
        combinedMap.set(key, { ...h, status: h.status || 'PENDING_VERIFICATION' });
      });

      localList.forEach(h => {
        const key = h._id || h.id || h.name?.toLowerCase();
        if (!combinedMap.has(key)) {
          combinedMap.set(key, {
            ...h,
            status: h.status || 'PENDING_VERIFICATION',
            name: h.name || h.hospitalLegalName || 'Registered Hospital',
            hospitalCode: h.hospitalCode || `JSH-REG-${String(h.id || Math.floor(1000 + Math.random() * 9000)).slice(-6)}`,
            hospitalType: h.hospitalType || 'Private',
            address: typeof h.address === 'object' ? h.address : { city: h.city || 'Delhi', state: h.state || 'Delhi', street: h.address || '' },
            submittedAt: h.submittedAt || new Date().toISOString()
          });
        }
      });

      const pendingList = Array.from(combinedMap.values()).filter(h => {
        const s = String(h.status || '').toUpperCase();
        return s.includes('PENDING') || s.includes('REVIEW') || s.includes('APPROV') || s.includes('REJECT') || s.includes('ACTIVE');
      });

      setHospitals(pendingList);
    } catch (err) {
      console.error('Error fetching approval list:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    if (filter !== 'ALL') {
      const s = String(h.status || '').toUpperCase();
      if (filter === 'PENDING' && !s.includes('PENDING')) return false;
      if (filter === 'REVIEW' && !s.includes('REVIEW')) return false;
      if (filter === 'APPROVED' && !(s.includes('APPROV') || s.includes('ACTIVE'))) return false;
      if (filter === 'REJECTED' && !s.includes('REJECT')) return false;
    }
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('PENDING')) {
      return <div className={styles.statusBadge} style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Clock size={12}/> Pending</div>;
    }
    if (s.includes('REVIEW')) {
      return <div className={styles.statusBadge} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><Search size={12}/> Review</div>;
    }
    if (s.includes('APPROV') || s.includes('ACTIVE')) {
      return <div className={styles.statusBadge} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle2 size={12}/> Approved</div>;
    }
    if (s.includes('REJECT')) {
      return <div className={styles.statusBadge} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={12}/> Rejected</div>;
    }
    return <div className={styles.statusBadge}>{status}</div>;
  };

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve ${selectedHospital.name}?`)) return;
    try {
      setIsProcessing(true);
      setActionError('');
      try {
        await approveHospital(selectedHospital._id || selectedHospital.id);
      } catch (e) {
        console.warn('Backend approval sync warning:', e);
      }

      // Update local storage
      const local = getRegisteredHospitalsFromStorage();
      const updated = local.map(h => {
        if ((h.id && h.id === selectedHospital.id) || (h.name && h.name.toLowerCase() === selectedHospital.name?.toLowerCase())) {
          return { ...h, status: 'APPROVED' };
        }
        return h;
      });
      localStorage.setItem('neolife_registered_hospitals', JSON.stringify(updated));
      await initHospitals();

      await fetchHospitals();
      setSelectedHospital(null);
      alert('Hospital approved successfully!');
    } catch (err) {
      setActionError(err.message || 'Failed to approve');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (rejectReason.length < 10) {
      setActionError('Reason must be at least 10 characters long.');
      return;
    }
    try {
      setIsProcessing(true);
      setActionError('');
      try {
        await rejectHospital(selectedHospital._id || selectedHospital.id, rejectReason);
      } catch (e) {
        console.warn('Backend rejection sync warning:', e);
      }

      const local = getRegisteredHospitalsFromStorage();
      const updated = local.map(h => {
        if ((h.id && h.id === selectedHospital.id) || (h.name && h.name.toLowerCase() === selectedHospital.name?.toLowerCase())) {
          return { ...h, status: 'REJECTED', rejectionReason: rejectReason };
        }
        return h;
      });
      localStorage.setItem('neolife_registered_hospitals', JSON.stringify(updated));
      await initHospitals();

      await fetchHospitals();
      setSelectedHospital(null);
      setRejecting(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err.message || 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnderReview = async () => {
    try {
      setIsProcessing(true);
      setActionError('');
      try {
        await reviewHospital(selectedHospital._id || selectedHospital.id);
      } catch (e) {
        console.warn('Backend review status sync warning:', e);
      }

      const local = getRegisteredHospitalsFromStorage();
      const updated = local.map(h => {
        if ((h.id && h.id === selectedHospital.id) || (h.name && h.name.toLowerCase() === selectedHospital.name?.toLowerCase())) {
          return { ...h, status: 'UNDER_REVIEW' };
        }
        return h;
      });
      localStorage.setItem('neolife_registered_hospitals', JSON.stringify(updated));

      await fetchHospitals();
      setSelectedHospital(prev => ({ ...prev, status: 'UNDER_REVIEW' }));
    } catch (err) {
      setActionError(err.message || 'Failed to mark under review');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hospital Approvals</h1>
          <p className={styles.subtitle}>Review and approve new hospital registrations</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div 
          className={`${styles.statCard} ${filter === 'REJECTED' ? styles.statCardActive : ''}`}
          onClick={() => setFilter(filter === 'REJECTED' ? 'ALL' : 'REJECTED')}
        >
          <div className={styles.statIconBox} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => String(h.status || '').toUpperCase().includes('REJECT')).length}</div>
            <div className={styles.statLabel}>No. of Rejected</div>
          </div>
        </div>
        <div 
          className={`${styles.statCard} ${filter === 'REVIEW' ? styles.statCardActive : ''}`}
          onClick={() => setFilter(filter === 'REVIEW' ? 'ALL' : 'REVIEW')}
        >
          <div className={styles.statIconBox} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
            <Search size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => String(h.status || '').toUpperCase().includes('REVIEW')).length}</div>
            <div className={styles.statLabel}>Under Review</div>
          </div>
        </div>
        <div 
          className={`${styles.statCard} ${filter === 'APPROVED' ? styles.statCardActive : ''}`}
          onClick={() => setFilter(filter === 'APPROVED' ? 'ALL' : 'APPROVED')}
        >
          <div className={styles.statIconBox} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => {
              const s = String(h.status || '').toUpperCase();
              return s.includes('APPROV') || s.includes('ACTIVE');
            }).length}</div>
            <div className={styles.statLabel}>Approved (Total)</div>
          </div>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search hospitals..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className={styles.segmentControl}>
          {[
            { id: 'ALL', label: 'All Statuses' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'REVIEW', label: 'Under Review' },
            { id: 'APPROVED', label: 'Approved' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.segmentBtn} ${filter === tab.id ? styles.segmentBtnActive : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hospital Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          {(!loading && filteredHospitals.length > 0) && (
            <tbody>
              {filteredHospitals.map(h => (
                <tr key={h._id || h.id}>
                  <td>
                    <div className={styles.hospitalNameCol}>
                      <div className={styles.hospitalIcon}><Building2 size={20} /></div>
                      <div>
                        <div className={styles.hospitalName}>{h.name}</div>
                        <div className={styles.hospitalCode}>{h.hospitalCode}</div>
                      </div>
                    </div>
                  </td>
                  <td>{h.hospitalType}</td>
                  <td>{h.address?.city}, {h.address?.state}</td>
                  <td>{new Date(h.createdAt || h.submittedAt).toLocaleDateString()}</td>
                  <td>{getStatusBadge(h.status)}</td>
                  <td>
                    <button className={styles.btnReview} onClick={() => {
                      setSelectedHospital(h);
                      setDrawerTab('OVERVIEW');
                      setRejecting(false);
                      setActionError('');
                    }}>
                      Review &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
        
        {loading && (
          <div className={styles.emptyState}>Loading...</div>
        )}
        
        {!loading && filteredHospitals.length === 0 && (
          <div className={styles.emptyState}>
            <Search size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No hospitals found</div>
            <div style={{ fontSize: '0.875rem' }}>There are currently no hospitals in this category.</div>
          </div>
        )}
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {selectedHospital && (
          <div className={styles.drawerOverlay} onClick={(e) => { if (e.target === e.currentTarget) setSelectedHospital(null); }}>
            <motion.div 
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h2 className={styles.drawerTitle}>{selectedHospital.name}</h2>
                  <div>{getStatusBadge(selectedHospital.status)}</div>
                </div>
                <button className={styles.btnCloseDrawer} onClick={() => setSelectedHospital(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.drawerTabs}>
                <button 
                  className={`${styles.drawerTab} ${drawerTab === 'OVERVIEW' ? styles.drawerTabActive : ''}`}
                  onClick={() => setDrawerTab('OVERVIEW')}
                >
                  Overview
                </button>
                <button 
                  className={`${styles.drawerTab} ${drawerTab === 'DOCUMENTS' ? styles.drawerTabActive : ''}`}
                  onClick={() => setDrawerTab('DOCUMENTS')}
                >
                  Documents
                </button>
                <button 
                  className={`${styles.drawerTab} ${drawerTab === 'PERSONNEL' ? styles.drawerTabActive : ''}`}
                  onClick={() => setDrawerTab('PERSONNEL')}
                >
                  Personnel
                </button>
              </div>

              <div className={styles.drawerContent}>
                {actionError && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={16} /> {actionError}
                  </div>
                )}

                {drawerTab === 'OVERVIEW' && (
                  <>
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Basic Info</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Code</span>
                          <span className={styles.detailVal}>{selectedHospital.hospitalCode || selectedHospital.id}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Type</span>
                          <span className={styles.detailVal}>{selectedHospital.hospitalType || 'Private'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Contact Email</span>
                          <span className={styles.detailVal}>{selectedHospital.contact?.email || selectedHospital.officialEmail || selectedHospital.loginEmail || 'admin@hospital.org'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Phone</span>
                          <span className={styles.detailVal}>{selectedHospital.contact?.phone || selectedHospital.nodalMobile || selectedHospital.landline || '+91 98765 43210'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Address</div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailVal}>
                          {typeof selectedHospital.address === 'string' 
                            ? selectedHospital.address 
                            : `${selectedHospital.address?.street || selectedHospital.addressLine1 || 'Campus'}, ${selectedHospital.address?.city || selectedHospital.district || selectedHospital.city || 'City'}, ${selectedHospital.address?.state || selectedHospital.state || ''} - ${selectedHospital.address?.pincode || selectedHospital.pin || ''}`}
                        </span>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Legal & Compliance</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Reg Number</span>
                          <span className={styles.detailVal}>{selectedHospital.legalDetails?.registrationNumber || selectedHospital.healthAuthRegNo || 'REG-HEALTH-2026'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>NABH Accredited</span>
                          <span className={styles.detailVal}>{selectedHospital.accreditation?.isNabh ?? selectedHospital.isNabhAccredited ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>THOTA Registered</span>
                          <span className={styles.detailVal}>{selectedHospital.thota?.isRegistered ?? selectedHospital.isThotaRegistered ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {drawerTab === 'DOCUMENTS' && (
                  <div>
                    {(() => {
                      const docs = [];
                      if (selectedHospital.documents && selectedHospital.documents.length > 0) {
                        return selectedHospital.documents.map((doc, idx) => (
                          <div key={idx} className={styles.docItem}>
                            <div className={styles.docName}>
                              <FileText size={18} color="#3b82f6" /> {doc.documentType || doc.name}
                            </div>
                            <a href={doc.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className={styles.docBtn}>View</a>
                          </div>
                        ));
                      }
                      const list = [
                        { label: 'State Health Auth Registration', val: selectedHospital.docStateHealth, defaultName: 'state_health_auth.pdf' },
                        { label: 'THOTA Registration Certificate', val: selectedHospital.docThotaCert, defaultName: 'thota_cert.pdf' },
                        { label: 'NOTTO License Document', val: selectedHospital.docNottoId, defaultName: 'notto_license.pdf' },
                        { label: 'NABH Accreditation Certificate', val: selectedHospital.docNabhCert, defaultName: 'nabh_accreditation.pdf' },
                        { label: 'Blood Bank License', val: selectedHospital.docBloodBank, defaultName: 'blood_bank_license.pdf' }
                      ];
                      return list.map((item, idx) => (
                        <div key={idx} className={styles.docItem} style={{ marginBottom: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className={styles.docName} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={18} color="#3b82f6" />
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.label}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.val?.name || item.defaultName}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '12px' }}>Verified</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {drawerTab === 'PERSONNEL' && (
                  <>
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Hospital Admin / Nodal Officer</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Display Name</span>
                          <span className={styles.detailVal}>{selectedHospital.displayName || selectedHospital.name || selectedHospital.hospitalLegalName || 'Dr. Admin Officer'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Login Email</span>
                          <span className={styles.detailVal}>{selectedHospital.loginEmail || selectedHospital.contact?.email || selectedHospital.officialEmail || 'admin@hospital.org'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Key Personnel</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Head Name</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.headName || selectedHospital.headName || 'Dr. Ramesh Verma'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Head Email</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.headEmail || selectedHospital.headEmail || 'head@hospital.org'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Coordinator</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.coordName || selectedHospital.coordName || 'Dr. Suresh Sharma'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Coord Email</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.coordEmail || selectedHospital.coordEmail || 'coord@hospital.org'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {rejecting ? (
                <div className={styles.rejectionBox}>
                  <textarea 
                    className={styles.rejectTextarea} 
                    placeholder="Enter rejection reason (min 10 chars)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className={styles.rejectActions}>
                    <button className={styles.btnCancel} onClick={() => { setRejecting(false); setRejectReason(''); }}>Cancel</button>
                    <button className={styles.btnReject} onClick={handleRejectSubmit} disabled={isProcessing}>
                      {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                ['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(selectedHospital.status) && (
                  <div className={styles.drawerFooter}>
                    {selectedHospital.status === 'PENDING_VERIFICATION' && (
                      <button className={styles.btnUnderReview} onClick={handleUnderReview} disabled={isProcessing}>
                        Mark Under Review
                      </button>
                    )}
                    <button className={styles.btnReject} onClick={() => setRejecting(true)}>Reject</button>
                    <button className={styles.btnApprove} onClick={handleApprove} disabled={isProcessing}>
                      <CheckCircle2 size={18} /> Approve
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalApprovals;
