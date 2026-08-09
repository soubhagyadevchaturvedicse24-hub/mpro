import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, ShieldCheck, Plus,
  Building2, ChevronDown, Network, Loader2,
  CheckCircle2, FileText, Boxes, HeartPulse, Activity, Zap,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './HospitalLogin.module.css';

/* ─── Floating Hospital Illustration ─── */
const FloatingIcon = () => (
  <div className={styles.floatingWrap}>
    <div className={styles.floatingGlow} />
    <img 
      src="/aDMIN LOGIN.png" 
      alt="Hospital Graphic" 
      className={styles.floatingImg} 
    />
  </div>
);

/* ─── Subtle ECG particle layer ─── */
const EcgLayer = () => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ECG template
    const ecgTemplate = [
      [0,0],[0.06,0],[0.09,0.05],[0.11,-0.12],[0.13,0.55],
      [0.15,-0.2],[0.2,0],[0.3,0.08],[0.42,0.08],[0.5,0],[0.65,0],[1,0]
    ];

    const getY = (xn) => {
      const pts = ecgTemplate;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0,y0] = pts[i], [x1,y1] = pts[i+1];
        if (xn >= x0 && xn <= x1) {
          const t = (xn - x0)/(x1-x0);
          return y0 + t*(y1-y0);
        }
      }
      return 0;
    };

    let offset = 0;
    let frame = 0;

    // Floating particles
    const particles = Array.from({length: 20}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random()-0.5)*0.25,
      vy: (Math.random()-0.5)*0.25,
      r: Math.random()*1.2+0.5,
      pulse: Math.random()*Math.PI*2,
    }));

    const draw = () => {
      frame++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0,0,W,H);

      // Subtle green particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.025;
        if (p.x<0||p.x>W) p.vx*=-1;
        if (p.y<0||p.y>H) p.vy*=-1;
        const a = 0.2+0.15*Math.sin(p.pulse);
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(16,185,129,${a})`;
        ctx.fill();
      });

      // ECG line at bottom
      offset += 2;
      const EW = W*0.7, EX = W*0.15, EY = H*0.88, EAMP = 36;
      ctx.beginPath();
      ctx.lineWidth = 1.8;
      for (let px = 0; px < EW; px++) {
        const xn = ((px + offset) % EW) / EW;
        const yn = getY(xn < 0 ? xn+1 : xn);
        const sx = EX + px;
        const sy = EY - yn * EAMP;
        px === 0 ? ctx.moveTo(sx,sy) : ctx.lineTo(sx,sy);
      }
      const gr = ctx.createLinearGradient(EX,0,EX+EW,0);
      gr.addColorStop(0,'rgba(16,185,129,0)');
      gr.addColorStop(0.3,'rgba(16,185,129,0.5)');
      gr.addColorStop(0.8,'rgba(52,211,153,0.6)');
      gr.addColorStop(1,'rgba(16,185,129,0)');
      ctx.strokeStyle = gr;
      ctx.stroke();

      // Pulse dot
      const headXn = ((EW - (offset % EW)) / EW);
      const headY = getY(headXn % 1);
      const headSX = EX + (EW - (offset % EW));
      const headSY = EY - headY * EAMP;
      ctx.beginPath();
      ctx.arc(headSX, headSY, 4, 0, Math.PI*2);
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.ecgCanvas} />;
};

/* ─── Main Component ─── */
const HospitalLogin = () => {
  const { login } = useAuth();
  const { isDayMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [hospitalId, setHospitalId] = useState('NOTTO-HOSP-1082');
  const [email, setEmail]           = useState('contact@aiims.edu');
  const [password, setPassword]     = useState('aiims123aiims');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 900));
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageRoot} data-theme={isDayMode ? 'day' : 'night'}>

      {/* ── NAVBAR ── */}
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>
          <div style={{
            width: 54, height: 54, borderRadius: 12,
            overflow: 'hidden', flexShrink: 0,
            border: '2px solid rgba(20,184,166,0.45)',
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(20,184,166,0.25)'
          }}>
            <img
              src="/White and Blue Modern Health Care Presentation.png"
              alt="Jeevan Setu Logo"
              style={{ width: 50, height: 50, objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className={styles.navLogoTitle} style={{ fontSize: '1.15rem', fontWeight: 900, color: isDayMode ? '#0f172a' : '#ffffff', letterSpacing: '0.01em', lineHeight: 1.1 }}>
              Jeevan <span style={{ color: '#0d9488' }}>Setu</span>
            </div>
            <div className={styles.navLogoSub} style={{ fontSize: '0.65rem', color: isDayMode ? '#64748b' : '#94a3b8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
              Hospital Portal
            </div>
          </div>
        </Link>

        <div className={styles.navRight} ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className={styles.themeToggleBtn} 
            onClick={toggleTheme}
            title={isDayMode ? "Switch to Night Mode" : "Switch to Day Mode"}
          >
            {isDayMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button type="button" className={styles.switchBtn} onClick={() => setIsDropdownOpen(v => !v)}>
            Switch Portal <ChevronDown size={13} />
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link to="/login?role=network"  className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}><Network size={14}/> Network Portal</Link>
              <Link to="/login?role=hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}><Building2 size={14}/> Hospital Portal</Link>
              <Link to="/login?role=admin"    className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}><ShieldCheck size={14}/> Admin Portal</Link>
              <Link to="/register-hospital"   className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}><Plus size={14}/> Register Hospital</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── SPLIT LAYOUT ── */}
      <div className={styles.splitLayout}>

        {/* LEFT — Photo */}
        <div className={styles.leftPanel}>
          <img src="/hospital_login_photo.jpg" alt="Hospital Environment" className={styles.bgPhoto} />
          <div className={styles.photoOverlay} />
          <EcgLayer />

          <div className={styles.leftContent}>
            <div className={styles.leftBadge}>
              <Activity size={12} /> NOTTO Certified Network
            </div>

            <div className={styles.leftTextGlassCard}>
              <h1 className={styles.leftHeading}>
                Every Organ.<br />
                Every Mile.<br />
                <span className={styles.leftAccent}>Every Life.</span>
              </h1>
              <p className={styles.leftSub}>
                Real-time cold-chain tracking and organ transport coordination for registered hospitals across India.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>

            <FloatingIcon />

            <h2 className={styles.formTitle}>Hospital Sign In</h2>
            <p className={styles.formSub}>Access your hospital's organ transport dashboard.</p>

            {error && (
              <div className={styles.errorBanner}>
                <Zap size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Hospital ID (NOTTO ID)</label>
                <div className={styles.fieldRow}>
                  <User size={16} className={styles.fieldIcon} />
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. NOTTO-HOSP-1082"
                    value={hospitalId}
                    onChange={e => setHospitalId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Official Email</label>
                <div className={styles.fieldRow}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    type="email"
                    className={styles.fieldInput}
                    placeholder="contact@hospital.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <div className={styles.fieldRow}>
                  <Lock size={16} className={styles.fieldIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.fieldInput}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.forgotRow}>
                <a href="#forgot" onClick={e => e.preventDefault()} className={styles.forgotLink}>Forgot password?</a>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <><Loader2 size={17} className={styles.spinner} /> Signing in…</>
                  : <><Lock size={16} /> Sign In to Dashboard</>
                }
              </button>

              <div className={styles.orRow}><span>or</span></div>

              <Link to="/register-hospital" className={styles.registerBtn}>
                <Plus size={16} /> Register Your Hospital
              </Link>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default HospitalLogin;
