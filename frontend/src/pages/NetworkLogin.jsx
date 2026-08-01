import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Globe2, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronDown,
  Network,
  Plus,
  Loader2,
  CheckCircle2,
  FileText,
  Boxes,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './NetworkLogin.module.css';

const NetworkLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('notto@gov.in');
  const [password, setPassword] = useState('network123');
  const [organization, setOrganization] = useState('NOTTO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -8,
      y: (x / (rect.width / 2)) * 8
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await new Promise(res => setTimeout(res, 1000));
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>

      {/* ── TOP NAV HEADER ── */}
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

        <div className={styles.navLinks}>
          <Link to="/" className={styles.navLink}>Home</Link>
          <a href="#" className={styles.navLink}>About</a>
          <a href="#" className={styles.navLink}>Contact</a>
        </div>

        <div className={styles.navRight} ref={dropdownRef}>
          <button 
            type="button" 
            className={styles.portalDropdownBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Network size={18} className={styles.dropdownIconGreen} />
            <span>Network Login</span>
            <ChevronDown size={14} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link to="/login?role=network" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Network size={16} className={styles.dropdownIconGreen} /> Network Portal
              </Link>
              <Link to="/login?role=hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Building2 size={16} className={styles.dropdownIconGreen} /> Hospital Portal
              </Link>
              <Link to="/login?role=admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <ShieldCheck size={16} className={styles.dropdownIconGreen} /> Admin Portal
              </Link>
              <Link to="/register-hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Plus size={16} className={styles.dropdownIconGreen} /> Register Hospital
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN CENTERED SPLIT CARD ── */}
      <main className={styles.mainCard}>

        {/* ── LEFT SHOWCASE PANEL ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftHeadlineGroup}>
            <h1 className={styles.mainHeadline}>
              National Network.<br />
              Seamless Allocation.<br />
              <span className={styles.highlightText}>Saving Lives.</span>
            </h1>
            <div className={styles.leftSubtitle}>Unified Governance Portal for NOTTO, ROTTO, SOTTO.</div>
            <div className={styles.greenAccentBar} />
          </div>

          {/* Center Network India Globe Parallax Image */}
          <div 
            className={styles.illustrationStage}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: tilt.x === 0 ? 'transform 0.5s ease' : 'none'
            }}
          >
            <div className={styles.ambientGlow3D} />
            <img 
              src="/network.png" 
              alt="Network India Globe Illustration" 
              className={styles.networkImg}
            />
          </div>

          {/* Bottom Left Trust Banner Card */}
          <div className={styles.leftTrustCard}>
            <div className={styles.trustLeft}>
              <div className={styles.trustCheckIcon}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className={styles.trustTitle}>GovNet Secure</div>
                <div className={styles.trustSubtitle}>Real-time allocation across 36 States/UTs</div>
              </div>
            </div>

            <div className={styles.trustDivider} />

            <div className={styles.trustRight}>
              <div className={styles.trustStatLabel}>Connected Regions</div>
              <div className={styles.trustStatNumber}>100%</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Network Portal</h2>
                <div className={styles.formSubtitle}>Authenticate as NOTTO, ROTTO, or SOTTO.</div>
                <div className={styles.greenAccentBar} />
              </div>

              {error && <div className={styles.errorAlert}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Governing Body Selection */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Governing Body</label>
                  <div className={styles.inputWrapper}>
                    <Network size={18} className={styles.inputIcon} />
                    <select 
                      className={styles.inputField}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="NOTTO">NOTTO (National Level)</option>
                      <option value="ROTTO">ROTTO (Regional Level)</option>
                      <option value="SOTTO">SOTTO (State Level)</option>
                    </select>
                  </div>
                </div>

                {/* Official Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Official Nodal Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      type="email"
                      className={styles.inputField}
                      placeholder="notto@gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Passkey */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Security Passkey</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input 
                      type="password"
                      className={styles.inputField}
                      placeholder="Enter security passkey"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Primary Green Submit Button */}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Globe2 size={16} />
                      <span>Access Network</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Mint Trust Footer */}
            <div className={styles.formMintFooter}>
              <div className={styles.mintFooterItem}>
                <ShieldCheck size={15} className={styles.mintFooterIcon} />
                <span>GovNet Encrypted</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <FileText size={15} className={styles.mintFooterIcon} />
                <span>NOTTO Certified</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <Boxes size={15} className={styles.mintFooterIcon} />
                <span>Real-Time Sync</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default NetworkLogin;
