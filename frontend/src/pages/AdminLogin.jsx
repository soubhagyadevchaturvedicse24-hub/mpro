import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Plus, Lock, Eye, EyeOff, Mail,
  Building2, ChevronDown, Network, Loader2,
  HeartPulse, Database, Globe, Cpu, Server, Zap,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './AdminLogin.module.css';

/* ─── Floating Admin Illustration ─── */
const FloatingAdminIcon = () => (
  <div className={styles.floatingAdminWrap}>
    <div className={styles.floatingAdminGlow} />
    <img 
      src="/Real Admin.png" 
      alt="Admin" 
      className={styles.floatingAdminImg} 
    />
  </div>
);

/* ─── Subtle Particle Layer (not overwhelming) ─── */
const SubtleParticles = () => {
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

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const draw = () => {
      frame++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const alpha = 0.3 + 0.2 * Math.sin(p.pulse);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        ctx.fill();
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - d / 100) * 0.12})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
};

/* ─── Main Component ──────────────────────────── */
const AdminLogin = () => {
  const { login } = useAuth();
  const { isDayMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('admin@platform.com');
  const [password, setPassword] = useState('admin123admin');
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
      setError(err.message || 'Authentication failed. Verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageRoot} data-theme={isDayMode ? 'day' : 'night'}>

      {/* ── NAVBAR ───────────────────────────── */}
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
              Platform Admin
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

      {/* ── SPLIT LAYOUT ─────────────────────── */}
      <div className={styles.splitLayout}>

        {/* LEFT — Photo Panel */}
        <div className={styles.leftPanel}>
          {/* Server room background photo */}
          <img src="/admin_login_photo.jpg" alt="Platform Infrastructure" className={styles.bgPhoto} />

          {/* Dark overlay */}
          <div className={styles.photoOverlay} />

          {/* Subtle particle canvas */}
          <SubtleParticles />

          {/* Branding text */}
          <div className={styles.leftContent}>
            <div className={styles.leftBadge}>
              <Cpu size={12} /> Blockchain Governance
            </div>

            <div className={styles.leftTextGlassCard}>
              <h1 className={styles.leftHeading}>
                JeevanSetu<br />
                <span className={styles.leftAccent}>Administration</span>
              </h1>
              <p className={styles.leftSub}>
                Restricted to authorized platform administrators. All sessions are monitored, logged, and cryptographically verified.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Clean Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>

            {/* Floating Admin Illustration */}
            <FloatingAdminIcon />

            <h2 className={styles.formTitle}>Admin Sign In</h2>
            <p className={styles.formSub}>Enter your credentials to access the governance platform.</p>

            {error && (
              <div className={styles.errorBanner}>
                <Zap size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email Address</label>
                <div className={styles.fieldRow}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    type="email"
                    className={styles.fieldInput}
                    placeholder="admin@platform.com"
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
                  ? <><Loader2 size={17} className={styles.spinner} /> Authenticating…</>
                  : <><ShieldCheck size={16} /> Access Console</>
                }
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
