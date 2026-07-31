import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, HeartPulse, Building2, User, ShieldCheck, 
  Box, Lock, Sun, Moon, BrainCircuit, Target, Play
} from 'lucide-react';
import Button from '../components/Button';
import Heart3D from '../components/Heart3D';
import EcosystemSegment from '../components/EcosystemSegment';
import LifeSavedSegment from '../components/LifeSavedSegment';
import HomeFooter from '../components/HomeFooter';
import styles from './Home.module.css';

const Home = () => {
  const [progress, setProgress] = useState(0);
  const [isLoaderFading, setIsLoaderFading] = useState(false);
  const [isHeroActive, setIsHeroActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [heartScrollOpacity, setHeartScrollOpacity] = useState(1);
  const [heartScrollScale, setHeartScrollScale] = useState(1);
  const [heartScrollLeft, setHeartScrollLeft] = useState(75);
  const [heartScrollOffsetX, setHeartScrollOffsetX] = useState(0);
  const [heartScrollOffsetY, setHeartScrollOffsetY] = useState(0);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const isSnappingRef = useRef(false);

  const cinematicText = React.useMemo(() => (
    <div className={styles.cinematicTextContainer}>
      {[...Array(10)].map((_, i) => {
        const isFront = i === 0;
        const zOffset = -(i * 4); // tighter packing for solid block
        const blur = i > 7 ? (i - 7) * 0.5 : 0; // blur only the deepest back end

        return (
          <span 
            key={i} 
            className={styles.cinematicTextLayer}
            style={{
              transform: `translateZ(${zOffset}px)`,
              filter: `blur(${blur}px)`,
              color: isFront ? '#0d1526' : '#040914', // Solid dark charcoal front, pitch black extrusion
              textShadow: isFront 
                ? '-1px -1px 2px rgba(0, 210, 255, 0.3), 0px 10px 30px rgba(0, 0, 0, 0.8)' 
                : '-1px 1px 0px #040914, -2px 2px 0px #040914, -3px 3px 0px #040914', // Heavy shadow makes up for fewer layers
            }}
          >
            TRUST
          </span>
        );
      })}
    </div>
  ), []);

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

  // Scroll-driven heart transition: Hero -> Ecosystem (dock) -> Life Saved (fade out)
  useEffect(() => {
    if (!isHeroActive) return;
    const container = containerRef.current;
    if (!container) return;

    let scrollFrameId;
    const handleScroll = () => {
      if (scrollFrameId) return;
      scrollFrameId = requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const scrollY = container.scrollTop;
        
        const ecoSection = document.getElementById('ecosystem-segment');
        const ecoTop = ecoSection ? ecoSection.offsetTop : vh;
        
        const p1 = Math.min(1, Math.max(0, scrollY / ecoTop));
        const newLeft = 75 - (25 * p1);
        const newScale = 1 - (0.72 * p1);
        const newOffsetX = 15 * p1;
        
        let targetOffsetY = -67;
        const stageCenter = document.getElementById('network-stage-center');
        if (stageCenter && ecoSection) {
          const ecoRect = ecoSection.getBoundingClientRect();
          const stageRect = stageCenter.getBoundingClientRect();
          const centerRelToEco = (stageRect.top - ecoRect.top) + (stageRect.height / 2);
          targetOffsetY = centerRelToEco - (vh / 2);
        }
        
        const newOffsetY = p1 * (ecoTop - scrollY + targetOffsetY);
        const newOpacity = 1;

        setHeartScrollLeft(newLeft);
        setHeartScrollScale(newScale);
        setHeartScrollOffsetX(newOffsetX);
        setHeartScrollOffsetY(newOffsetY);
        setHeartScrollOpacity(newOpacity);
        scrollFrameId = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollFrameId) cancelAnimationFrame(scrollFrameId);
    };
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
      {/* ─── AMBIENT BACKGROUND WITH DYNAMIC GLOWING ORBS ─── */}
      <div className={styles.ambientBackground}>
        <div className={styles.orbPrimary} />
        <div className={styles.orbSecondary} />
        <div className={styles.orbTertiary} />
      </div>

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
        <>
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

          <div className={`${styles.heroUI} ${styles.sectionHero}`}>
            {/* Ambient EKG Lightning (Night Mode Only) */}
            {theme === 'dark' && <div className={styles.ambientEkgLightning} />}
            
            {/* Phase 1-3: Layout & Premium 3D Typography */}
            {cinematicText}

            {/* MAIN CONTENT (Left Side) */}
            <main className={styles.mainContent}>
            <div className={styles.textContent}>
              <h1 className={styles.headline}>
                Every donation <br />
                deserves <br />
                <span className={styles.highlightText}>absolute trust.</span>
              </h1>
              
              <div className={styles.heroEkgLine}>
                <svg viewBox="0 0 350 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="ekgFade" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00d2ff" stopOpacity="1" />
                      <stop offset="70%" stopColor="#00d2ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 12 L 80 12 L 90 4 L 105 20 L 120 0 L 135 22 L 145 12 L 350 12" 
                        fill="none" stroke="url(#ekgFade)" strokeWidth="1.5" />
                  <circle cx="330" cy="12" r="2.5" fill="#00d2ff" style={{ filter: 'drop-shadow(0px 0px 4px #00d2ff)' }} />
                </svg>
              </div>

              <p className={styles.paragraph}>
                NeoLife is a blockchain-powered organ transplant 
                ecosystem. We bring total transparency, impenetrable 
                security, and AI-driven matching to the gift of life.
              </p>

              <div className={styles.ctaGroup}>
                <Button variant="outline" size="lg" className={styles.btnRegisterHospital}>
                  <Building2 size={18} /> Register Hospital
                </Button>
                <Button variant="primary" size="lg" className={styles.btnBecomeDonor}>
                  <User size={18} /> Become a Donor
                </Button>
                <Button variant="outline" size="lg" className={styles.btnLearnMore}>
                  <Play size={18} /> Learn More
                </Button>
              </div>

              <div className={styles.featureGrid}>
                <div className={styles.featureItem}>
                  <ShieldCheck size={18} className={styles.featureIcon} />
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>Blockchain Secured</div>
                    <div className={styles.featureSub}>Immutable &<br/>verifiable</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <BrainCircuit size={18} className={styles.featureIcon} />
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>AI-Powered Matching</div>
                    <div className={styles.featureSub}>Smarter, faster<br/>better matches</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Building2 size={18} className={styles.featureIcon} />
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>Hospital Network</div>
                    <div className={styles.featureSub}>Trusted hospitals<br/>across India</div>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Target size={18} className={styles.featureIcon} />
                  <div className={styles.featureTextGroup}>
                    <div className={styles.featureTitle}>Live Organ Tracking</div>
                    <div className={styles.featureSub}>Real-time updates<br/>every step</div>
                  </div>
                </div>
              </div>
            </div>
            </main>
          </div>
        </>
      )}

      {/* ─── SINGLE CONTINUOUS 3D HEART INSTANCE ─── */}
      {/* Stays fixed during loader, transitions to hero-right, docks into Ecosystem on scroll, fades out for LifeSaved */}
      <div 
        className={`${styles.heartWrapper} ${(isHeroActive || isLoaderFading) ? styles.heartShiftRight : styles.heartLoading}`}
        style={isHeroActive ? {
          opacity: heartScrollOpacity,
          left: `calc(${heartScrollLeft}% + ${heartScrollOffsetX}px)`,
          top: `calc(50% + ${heartScrollOffsetY}px)`,
          transform: `translate(-50%, -50%) scale(${heartScrollScale})`,
          transition: heartScrollLeft < 75 ? 'none' : undefined, // Disable CSS lag when scrolling
          pointerEvents: 'none'
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

      {/* ─── SECTION DIVIDER: Hero → Ecosystem ─── */}
      {isHeroActive && <div className={styles.sectionDivider} />}

      {/* ─── NEXT SCROLL SEGMENT: BLOCKCHAIN ECOSYSTEM & TELEMETRY (Section 2) ─── */}
      {isHeroActive && (
        <EcosystemSegment id="ecosystem-segment" theme={theme} mousePos={mousePos} />
      )}

      {/* ─── SECTION DIVIDER: Ecosystem → Life Saved ─── */}
      {isHeroActive && <div className={styles.sectionDivider} />}

      {/* ─── LIFE SAVED SEGMENT (Section 3) ─── */}
      {isHeroActive && (
        <LifeSavedSegment theme={theme} />
      )}

      {/* ─── SECTION DIVIDER: Life Saved → Footer ─── */}
      {isHeroActive && <div className={styles.sectionDivider} />}

      {/* ─── FOOTER ─── */}
      {isHeroActive && (
        <HomeFooter theme={theme} />
      )}

    </div>
  );
};

export default Home;