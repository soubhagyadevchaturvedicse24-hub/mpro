import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Plus, 
  Heart, 
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
import styles from './HospitalLogin.module.css';

const HospitalLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [hospitalId, setHospitalId] = useState('NOTTO-HOSP-1082');
  const [email, setEmail] = useState('contact@aiims.edu');
  const [password, setPassword] = useState('aiims123aiims');
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
          <Link to="/" className={`${styles.navLink} ${styles.navLinkActive}`}>
            Home
            <div className={styles.activeIndicator} />
          </Link>
          <a href="#" className={styles.navLink}>About</a>
          <a href="#" className={styles.navLink}>Contact</a>
        </div>

        <div className={styles.navRight} ref={dropdownRef}>
          <button 
            type="button" 
            className={styles.portalDropdownBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Building2 size={18} className={styles.dropdownIconGreen} />
            <span>Hospital Login</span>
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
              Every Organ.<br />
              Every Mile.<br />
              <span className={styles.highlightText}>Every Life Matters.</span>
            </h1>
            <div className={styles.leftSubtitle}>Real-time. Secure. Transparent.</div>
            <div className={styles.greenAccentBar} />
          </div>

          {/* Center Hospital Security Interactive 3D Parallax Image */}
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
              src="/aDMIN LOGIN.png" 
              alt="Hospital Security Parallax Illustration" 
              className={styles.hospitalImg}
            />
          </div>

          {/* Bottom Left Trust Banner Card */}
          <div className={styles.leftTrustCard}>
            <div className={styles.trustLeft}>
              <div className={styles.trustCheckIcon}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className={styles.trustTitle}>In Safe Hands</div>
                <div className={styles.trustSubtitle}>End-to-end protection for every journey</div>
              </div>
            </div>

            <div className={styles.trustDivider} />

            <div className={styles.trustRight}>
              <div className={styles.trustStatLabel}>Trusted by Hospitals</div>
              <div className={styles.trustStatNumber}>500+</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Welcome Back!</h2>
                <div className={styles.formSubtitle}>Sign in to continue your mission.</div>
                <div className={styles.greenAccentBar} />
              </div>

              {error && <div className={styles.errorAlert}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Input 1: Hospital ID */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Hospital ID (NOTTO ID)</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input 
                      type="text"
                      className={styles.inputField}
                      placeholder="Enter Hospital ID"
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input 2: Official Email */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Official Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      type="email"
                      className={styles.inputField}
                      placeholder="Enter your official email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input 3: Password */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className={styles.inputField}
                      placeholder="Enter your password"
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
                      <Lock size={16} />
                      <span>Log In</span>
                    </>
                  )}
                </button>

                <div className={styles.orDivider}>
                  <span className={styles.orText}>or</span>
                </div>

                {/* Secondary Register Button */}
                <Link to="/register-hospital" className={styles.registerBtn}>
                  <Building2 size={18} />
                  <span>New Hospital Registration</span>
                </Link>
              </form>
            </div>

            {/* Bottom Mint Trust Footer */}
            <div className={styles.formMintFooter}>
              <div className={styles.mintFooterItem}>
                <ShieldCheck size={15} className={styles.mintFooterIcon} />
                <span>Secure & Encrypted</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <FileText size={15} className={styles.mintFooterIcon} />
                <span>THOTA Compliant</span>
              </div>

              <div className={styles.mintFooterDivider} />

              <div className={styles.mintFooterItem}>
                <Boxes size={15} className={styles.mintFooterIcon} />
                <span>Blockchain Verified</span>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default HospitalLogin;
