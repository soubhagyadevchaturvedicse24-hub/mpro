import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, HeartPulse, Building2, Calendar, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import styles from './ApplicationStatus.module.css';
import { getBaseUrl } from '../services/api';

const ApplicationStatus = () => {
  const [code, setCode] = useState('');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    setError(null);
    setStatusData(null);
    
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/hospitals/status/${code}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Hospital not found');
      }
      
      setStatusData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 1;
      case 'UNDER_REVIEW': return 2;
      case 'APPROVED': return 3;
      case 'REJECTED': return 3;
      default: return 1;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>
          <div className={styles.logoIconWrapper}>
            <HeartPulse size={22} strokeWidth={2.5} />
          </div>
          <div className={styles.logoTextGroup}>
            <span className={styles.brandName}>JeevanSetu</span>
            <span className={styles.brandTagline}>Secure. Connect. Save Lives.</span>
          </div>
        </Link>
      </nav>

      <main className={styles.mainContent}>
        <div className={styles.trackerCard}>
          <h1 className={styles.title}>Track Your Hospital Application</h1>
          
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.inputWrapper}>
              <Building2 className={styles.inputIcon} size={20} />
              <input 
                type="text" 
                placeholder="Enter your Hospital Code (e.g. JSH-DELHI-00123)"
                className={styles.codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button type="submit" className={styles.searchBtn} disabled={loading || !code}>
              {loading ? <span className={styles.spinner}></span> : <Search size={20} />}
              <span>Check Status</span>
            </button>
          </form>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {statusData && (
            <div className={styles.resultCard}>
              <div className={styles.hospitalHeader}>
                <h2 className={styles.hospitalName}>{statusData.name}</h2>
                <span className={`${styles.statusBadge} ${styles[statusData.status.toLowerCase()]}`}>
                  {statusData.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className={styles.metaInfo}>
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>Submitted: {new Date(statusData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.metaItem}>
                  <FileText size={16} />
                  <span>Code: {statusData.hospitalCode}</span>
                </div>
              </div>

              <div className={styles.timeline}>
                <div className={styles.timelineTrack}>
                  <div 
                    className={styles.timelineProgress} 
                    style={{ width: `${((getStatusStep(statusData.status) - 1) / 2) * 100}%` }}
                  ></div>
                </div>
                
                <div className={styles.timelineSteps}>
                  <div className={`${styles.step} ${getStatusStep(statusData.status) >= 1 ? styles.active : ''}`}>
                    <div className={styles.stepDot}>1</div>
                    <span className={styles.stepLabel}>Submitted</span>
                  </div>
                  <div className={`${styles.step} ${getStatusStep(statusData.status) >= 2 ? styles.active : ''}`}>
                    <div className={styles.stepDot}>2</div>
                    <span className={styles.stepLabel}>Under Review</span>
                  </div>
                  <div className={`${styles.step} ${getStatusStep(statusData.status) >= 3 ? styles.active : ''} ${statusData.status === 'REJECTED' ? styles.rejected : ''}`}>
                    <div className={styles.stepDot}>
                      {statusData.status === 'APPROVED' ? <CheckCircle2 size={16} /> : 
                       statusData.status === 'REJECTED' ? <XCircle size={16} /> : 3}
                    </div>
                    <span className={styles.stepLabel}>Decision</span>
                  </div>
                </div>
              </div>

              {statusData.status === 'REJECTED' && statusData.rejectionReason && (
                <div className={styles.rejectionBox}>
                  <strong>Rejection Reason:</strong>
                  <p>{statusData.rejectionReason}</p>
                </div>
              )}

              {statusData.status === 'APPROVED' && (
                <div className={styles.successBox}>
                  <strong>Application Approved!</strong>
                  <p>Your hospital is now registered on JeevanSetu. You can log in to your dashboard to access your ECC Identity Key.</p>
                  <Link to="/login?role=hospital" className={styles.loginLink}>Go to Login</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ApplicationStatus;
