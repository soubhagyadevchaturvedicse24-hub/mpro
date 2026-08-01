import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Plus, 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  Building2, 
  ChevronDown, 
  Network,
  Loader2,
  CheckCircle2,
  FileText,
  Boxes,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@neolife.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
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
            <ShieldCheck size={18} className={styles.dropdownIconGreen} />
            <span>Admin Login</span>
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
              System Governance.<br />
              Platform Security.<br />
              <span className={styles.highlightText}>Complete Control.</span>
            </h1>
            <div className={styles.leftSubtitle}>Authorized System Administration.</div>
            <div className={styles.greenAccentBar} />
          </div>

          {/* Center 3D Security Parallax Graphic */}
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
              src="/Real Admin.png" 
              alt="Admin Security Parallax Illustration" 
              className={styles.adminImg}
            />
          </div>

          {/* Bottom Left Trust Banner Card */}
          <div className={styles.leftTrustCard}>
            <div className={styles.trustLeft}>
              <div className={styles.trustCheckIcon}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className={styles.trustTitle}>Node Security</div>
                <div className={styles.trustSubtitle}>24/7 Encryption & Blockchain Verification</div>
              </div>
            </div>

            <div className={styles.trustDivider} />

            <div className={styles.trustRight}>
              <div className={styles.trustStatLabel}>System Nodes</div>
              <div className={styles.trustStatNumber}>50+</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Admin Login</h2>
                <div className={styles.formSubtitle}>Sign in to access platform control console.</div>
                <div className={styles.greenAccentBar} />
              </div>

              {error && <div className={styles.errorAlert}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Input: Official Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Official Admin Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      type="email"
                      className={styles.inputField}
                      placeholder="admin@neolife.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input: Password */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Security Passkey</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className={styles.inputField}
                      placeholder="Enter security passkey"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className={styles.eyeToggleBtn}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.forgotRow}>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className={styles.forgotLink}>
                    Forgot Password?
                  </a>
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
                      <ShieldCheck size={16} />
                      <span>Access Console</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Mint Trust Footer */}
            <div className={styles.formMintFooter}>
              <div className={styles.mintFooterItem}>
                <ShieldCheck size={15} className={styles.mintFooterIcon} />
                <span>256-bit AES</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <FileText size={15} className={styles.mintFooterIcon} />
                <span>Audit Logged</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <Boxes size={15} className={styles.mintFooterIcon} />
                <span>Blockchain Node</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminLogin;
