import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, HeartPulse, Building2, User, ShieldCheck, 
  Box, Lock, Sun, Moon
} from 'lucide-react';
import Button from '../components/Button';
import Heart3D from '../components/Heart3D';
import EcosystemSegment from '../components/EcosystemSegment';
import LifeSavedSegment from '../components/LifeSavedSegment';
import styles from './Home.module.css';

const Home = () => {
  const [progress, setProgress] = useState(0);
  const [isLoaderFading, setIsLoaderFading] = useState(false);
  const [isHeroActive, setIsHeroActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heartScrollOpacity, setHeartScrollOpacity] = useState(1);
  const [heartScrollScale, setHeartScrollScale] = useState(1);
  const [heartScrollLeft, setHeartScrollLeft] = useState(75);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Scroll-driven heart transition: Hero -> Ecosystem (dock) -> Life Saved (fade out)
  useEffect(() => {
    if (!isHeroActive) return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const vh = window.innerHeight;
      const scrollY = container.scrollTop;
      
      // Phase 1: Scroll from 0 to 100vh (Hero to Ecosystem Segment)
      // Heart moves from left: 75%, scale: 1 -> left: 50%, scale: 0.45
      const p1 = Math.min(1, Math.max(0, scrollY / vh));
      const newLeft = 75 - (25 * p1); // 75 -> 50
      const newScale = 1 - (0.55 * p1); // 1.0 -> 0.45
      
      // Phase 2: Scroll from 100vh to 150vh (Ecosystem to Life Saved Segment)
      // Heart fades out
      const p2 = Math.min(1, Math.max(0, (scrollY - vh) / (vh * 0.5)));
      const newOpacity = 1 - p2; // 1 -> 0

      setHeartScrollLeft(newLeft);
      setHeartScrollScale(newScale);
      setHeartScrollOpacity(newOpacity);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isHeroActive]);

  useEffect(() => {
    let mounted = true;
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      const increment = Math.max(1, Math.floor(Math.random() * 4));
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          if (mounted) {
            setIsLoaderFading(true);
            setTimeout(() => {
              if (mounted) setIsHeroActive(true);
            }, 800); 
          }
        }, 500);
      }
      if (mounted) setProgress(currentProgress);
    }, 40);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.container} data-theme={theme} ref={containerRef}>
      {/* ─── AMBIENT BACKGROUND ─── */}
      <div className={styles.ambientBackground} />

      {/* ─── PURE APPLE HEALTHCARE LOADER UI ─── */}
      {!isHeroActive && (
        <div className={`${styles.loaderUI} ${isLoaderFading ? styles.fadeOut : ''}`}>
          
          {/* Top Medical Status Badge */}
          <div className={styles.medicalStatusBadge}>
            <div className={styles.pulseDot} />
            <span>ORGAN TRANSPORTS NETWORK &bull; LIVE LOGISTICS TELEMETRY</span>
          </div>

          {/* Central Soft Breathing Halo Ring */}
          <div className={styles.medicalHalo} />

          {/* Bottom Typography & Progress Group */}
          <div className={styles.loaderBottomGroup}>
            <div className={styles.brandContainer}>
              <span className={styles.brandText}>Ne</span>
              <div className={styles.brandLogo}>
                <div className={styles.brandLogoInner} />
              </div>
              <span className={styles.brandText}>Life</span>
            </div>
            <div className={styles.loaderSubtitle}>THE FUTURE OF ORGAN TRANSPLANTATION</div>
            
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{progress}%</div>
            <div className={styles.loadingText}>INITIALIZING TRANSPORTS NETWORK...</div>
          </div>

        </div>
      )}

      {/* ─── HERO UI (Section 1) ─── */}
      {isHeroActive && (
        <div className={styles.heroUI}>
          
          {/* NAVIGATION BAR */}
          <nav className={styles.navbar}>
            <div className={styles.navLogoSection}>
              <div className={styles.navLogoIcon}>
                <HeartPulse size={24} className={styles.accentIcon} strokeWidth={2} />
              </div>
              <div className={styles.navLogoTextGroup}>
                <div className={styles.navBrandText}>
                  Neo<span className={styles.accentText}>Life</span>
                </div>
                <div className={styles.navSubtitle}>OrganChain Network</div>
              </div>
            </div>

            <div className={styles.navCenterLinks}>
              <a href="#home" className={`${styles.navLink} ${styles.navLinkActive}`}>Home</a>
              <a href="#about" className={styles.navLink}>About</a>
              <a href="#contact" className={styles.navLink}>Contact</a>
            </div>

            <div className={styles.navRight}>
              <button 
                className={styles.themeToggleBtn}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div 
                className={styles.loginDropdownContainer} 
                ref={dropdownRef}
              >
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  Login <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                </Button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link to="/login" className={styles.dropdownItem}>
                      <HeartPulse size={16} className={styles.dropdownIcon} /> Donor
                    </Link>
                    <Link to="/login" className={styles.dropdownItem}>
                      <Building2 size={16} className={styles.dropdownIcon} /> Hospital
                    </Link>
                    <Link to="/login" className={styles.dropdownItem}>
                      <User size={16} className={styles.dropdownIcon} /> Receiver
                    </Link>
                    <Link to="/login" className={styles.dropdownItem}>
                      <ShieldCheck size={16} className={styles.dropdownIcon} /> Admin
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* MAIN CONTENT (Left Side) */}
          <main className={styles.mainContent}>
            <div className={styles.textContent}>
              <h1 className={styles.headline}>
                Every donation deserves <br />
                <span className={styles.highlightText}>absolute trust.</span>
              </h1>
              <p className={styles.paragraph}>
                NeoLife is a blockchain-powered organ transplant ecosystem. 
                We bring total transparency, impenetrable security, and AI-driven 
                matching to the gift of life.
              </p>

              <div className={styles.featureGrid}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIconBox}><ShieldCheck size={20} className={styles.featureIcon} /></div>
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>SECURE</div>
                    <div className={styles.featureSub}>Blockchain Secured</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIconBox}><Box size={20} className={styles.featureIcon} /></div>
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>SMART</div>
                    <div className={styles.featureSub}>AI Powered Matching</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIconBox}><HeartPulse size={20} className={styles.featureIcon} /></div>
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>LIFE</div>
                    <div className={styles.featureSub}>Connecting Life</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIconBox}><Lock size={20} className={styles.featureIcon} /></div>
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>TRUST</div>
                    <div className={styles.featureSub}>Tamper Proof</div>
                  </div>
                </div>
              </div>

              <div className={styles.ctaGroup}>
                <Button variant="primary" size="lg" className={styles.btnExplore}>
                  Explore the Network
                </Button>
                <Button variant="outline" size="lg" className={styles.btnWhitepaper}>
                  Read Whitepaper
                </Button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ─── SINGLE CONTINUOUS 3D HEART INSTANCE ─── */}
      {/* Stays fixed during loader, transitions to hero-right, docks into Ecosystem on scroll, fades out for LifeSaved */}
      <div 
        className={`${styles.heartWrapper} ${(isHeroActive || isLoaderFading) ? styles.heartShiftRight : styles.heartLoading}`}
        style={isHeroActive ? {
          opacity: heartScrollOpacity,
          left: `${heartScrollLeft}%`,
          transform: `translate(-50%, -50%) scale(${heartScrollScale})`,
          transition: heartScrollLeft < 75 ? 'none' : undefined, // Disable CSS lag when scrolling
          pointerEvents: heartScrollOpacity < 0.1 ? 'none' : 'auto'
        } : {}}
      >
        <div className={styles.ringOuter} />
        <div className={styles.ringMiddle} />
        <div className={styles.ringInner} />
        <div className={styles.glowBloom} />

        <Heart3D 
          mousePos={mousePos} 
          modelUrl={theme === 'light' ? "/heart3d.glb" : "/heart3d_night.glb"} 
          className={theme === 'light' ? styles.heart3DBeatingDay : styles.heart3DBeating}
        />
      </div>

      {/* ─── NEXT SCROLL SEGMENT: BLOCKCHAIN ECOSYSTEM & TELEMETRY (Section 2) ─── */}
      {isHeroActive && (
        <EcosystemSegment theme={theme} mousePos={mousePos} />
      )}

      {/* ─── HEART TRANSITION DIVIDER ─── */}
      {isHeroActive && (
        <div className={styles.heartTransitionDivider}>
          <div className={styles.heartTransitionLine} />
          <div className={styles.heartTransitionIcon}>
            <HeartPulse size={28} strokeWidth={1.5} />
          </div>
          <div className={styles.heartTransitionLine} />
        </div>
      )}

      {/* ─── LIFE SAVED SEGMENT (Section 3) ─── */}
      {isHeroActive && (
        <LifeSavedSegment theme={theme} />
      )}

    </div>
  );
};

export default Home;