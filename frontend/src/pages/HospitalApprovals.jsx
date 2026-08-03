import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, X, CheckCircle2, XCircle, Clock, 
  FileText, ShieldCheck, UserCheck, AlertCircle 
} from 'lucide-react';
import { listPendingHospitals, approveHospital, rejectHospital, reviewHospital } from '../services/hospitalApi';
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
      const data = await listPendingHospitals();
      // Filter out Active/Deactivated ones if we only want pending/review
      const pendingList = (data.hospitals || data).filter(h => 
        ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(h.status)
      );
      setHospitals(pendingList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    if (filter !== 'ALL') {
      if (filter === 'PENDING' && h.status !== 'PENDING_VERIFICATION') return false;
      if (filter === 'REVIEW' && h.status !== 'UNDER_REVIEW') return false;
      if (filter === 'APPROVED' && h.status !== 'APPROVED') return false;
    }
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING_VERIFICATION':
        return <div className={styles.statusBadge} style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Clock size={12}/> Pending</div>;
      case 'UNDER_REVIEW':
        return <div className={styles.statusBadge} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}><Search size={12}/> Review</div>;
      case 'APPROVED':
      case 'ACTIVE':
        return <div className={styles.statusBadge} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle2 size={12}/> Approved</div>;
      case 'REJECTED':
        return <div className={styles.statusBadge} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={12}/> Rejected</div>;
      default:
        return <div className={styles.statusBadge}>{status}</div>;
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve ${selectedHospital.name}?`)) return;
    try {
      setIsProcessing(true);
      setActionError('');
      await approveHospital(selectedHospital._id || selectedHospital.id);
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
      await rejectHospital(selectedHospital._id || selectedHospital.id, rejectReason);
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
      await reviewHospital(selectedHospital._id || selectedHospital.id);
      await fetchHospitals();
      setSelectedHospital(prev => ({ ...prev, status: 'UNDER_REVIEW' }));
    } catch (err) {
      setActionError(err.message || 'Failed to mark under review');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Hospital Approvals</h1>
          <p className={styles.subtitle}>Review and approve new hospital registrations</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => h.status === 'PENDING_VERIFICATION').length}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
            <Search size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => h.status === 'UNDER_REVIEW').length}</div>
            <div className={styles.statLabel}>Under Review</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{hospitals.filter(h => h.status === 'APPROVED').length}</div>
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
        <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Verification</option>
          <option value="REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
        </select>
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
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredHospitals.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No hospitals found</td></tr>
            ) : filteredHospitals.map(h => (
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
        </table>
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
                          <span className={styles.detailVal}>{selectedHospital.hospitalCode}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Type</span>
                          <span className={styles.detailVal}>{selectedHospital.hospitalType}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Contact Email</span>
                          <span className={styles.detailVal}>{selectedHospital.contact?.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Phone</span>
                          <span className={styles.detailVal}>{selectedHospital.contact?.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Address</div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailVal}>
                          {selectedHospital.address?.street}, {selectedHospital.address?.city}, {selectedHospital.address?.state} - {selectedHospital.address?.pincode}
                        </span>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Legal & Compliance</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Reg Number</span>
                          <span className={styles.detailVal}>{selectedHospital.legalDetails?.registrationNumber}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>NABH Accredited</span>
                          <span className={styles.detailVal}>{selectedHospital.accreditation?.isNabh ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>THOTA Registered</span>
                          <span className={styles.detailVal}>{selectedHospital.thota?.isRegistered ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {drawerTab === 'DOCUMENTS' && (
                  <div>
                    {selectedHospital.documents?.length > 0 ? (
                      selectedHospital.documents.map((doc, idx) => (
                        <div key={idx} className={styles.docItem}>
                          <div className={styles.docName}>
                            <FileText size={18} color="#3b82f6" /> {doc.documentType}
                          </div>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.docBtn}>View</a>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-tertiary)' }}>No documents uploaded.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'PERSONNEL' && (
                  <>
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Hospital Admin / Nodal Officer</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Display Name</span>
                          <span className={styles.detailVal}>{selectedHospital.displayName || 'N/A'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Login Email</span>
                          <span className={styles.detailVal}>{selectedHospital.loginEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>Key Personnel</div>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Head Name</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.headName || 'N/A'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Head Email</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.headEmail || 'N/A'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Coordinator</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.coordName || 'N/A'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Coord Email</span>
                          <span className={styles.detailVal}>{selectedHospital.keyPersonnel?.coordEmail || 'N/A'}</span>
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
