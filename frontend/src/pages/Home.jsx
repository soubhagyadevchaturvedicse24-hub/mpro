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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heartScrollOpacity, setHeartScrollOpacity] = useState(1);
  const [heartScrollScale, setHeartScrollScale] = useState(1);
  const [heartScrollLeft, setHeartScrollLeft] = useState(75);
  const [heartScrollOffsetX, setHeartScrollOffsetX] = useState(0);
  const [heartScrollOffsetY, setHeartScrollOffsetY] = useState(0);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const isSnappingRef = useRef(false);

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
      
      // Phase 1: Scroll from 0 to Ecosystem Segment
      // Dynamically calculate the section offset so the heart docks exactly when the section is perfectly framed.
      const ecoSection = document.getElementById('ecosystem-segment');
      const ecoTop = ecoSection ? ecoSection.offsetTop : vh;
      
      const p1 = Math.min(1, Math.max(0, scrollY / ecoTop));
      const newLeft = 75 - (25 * p1); // 75 -> 50
      const newScale = 1 - (0.72 * p1); // 1.0 -> 0.28
      const newOffsetX = 15 * p1; // 0px -> 15px
      
      // Dynamically find the exact vertical center of the node ring
      let targetOffsetY = -67; // Fallback
      const stageCenter = document.getElementById('network-stage-center');
      if (stageCenter && ecoSection) {
        const ecoRect = ecoSection.getBoundingClientRect();
        const stageRect = stageCenter.getBoundingClientRect();
        // Calculate the center of the nodes relative to the top of the Ecosystem section
        const centerRelToEco = (stageRect.top - ecoRect.top) + (stageRect.height / 2);
        // The Y offset needed from 50vh to hit this exact center
        targetOffsetY = centerRelToEco - (vh / 2);
      }
      
      // Interpolate the vertical offset.
      // At scrollY = 0, newOffsetY = 0 (centered in Hero).
      // At scrollY >= ecoTop, p1 = 1, and newOffsetY perfectly locks the heart to the node center 
      // even if the user scrolls past it (ecoTop - scrollY = -excessScroll).
      const newOffsetY = p1 * (ecoTop - scrollY + targetOffsetY);
      
      // No abrupt fade out; it stays stable in the segment.
      const newOpacity = 1;

      setHeartScrollLeft(newLeft);
      setHeartScrollScale(newScale);
      setHeartScrollOffsetX(newOffsetX);
      setHeartScrollOffsetY(newOffsetY);
      setHeartScrollOpacity(newOpacity);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isHeroActive]);

  // ── JS-based smooth scroll snapping (controlled speed) ──────────────────
  useEffect(() => {
    if (!isHeroActive) return;
    const container = containerRef.current;
    if (!container) return;

    // Easing function: ease-in-out cubic for a cinematic, highly controlled smooth scroll
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const smoothScrollTo = (targetY, duration = 900) => {
      const startY = container.scrollTop;
      const distance = targetY - startY;
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        container.scrollTop = startY + distance * easeInOutCubic(progress);
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Add a tiny buffer after scroll finishes before unlocking trackpad
          setTimeout(() => {
            isSnappingRef.current = false;
          }, 50);
        }
      };

      isSnappingRef.current = true;
      requestAnimationFrame(step);
    };

    const getSnapPoints = () => {
      const points = [];
      // Section 1: Hero (always starts at 0)
      points.push(0);
      // Section 2: Ecosystem
      const eco = document.getElementById('ecosystem-segment');
      if (eco) points.push(eco.offsetTop);
      // Section 3: LifeSaved — sits after dividers
      const lifeSaved = document.getElementById('life-saved-segment');
      if (lifeSaved) points.push(lifeSaved.offsetTop);
      return points;
    };

    let wheelAccumulator = 0;
    let wheelTimeout = null;

    const handleWheel = (e) => {
      if (isSnappingRef.current) {
        e.preventDefault();
        return;
      }

      const snapPoints = getSnapPoints();
      if (snapPoints.length === 0) return;
      const lastSnapPoint = snapPoints[snapPoints.length - 1];
      const currentY = container.scrollTop;

      // Allow native bounce/overscroll at the very top and bottom bounds
      if (currentY <= 10 && e.deltaY < 0) return;
      if (currentY >= lastSnapPoint - 10 && e.deltaY > 0) return;

      // Lock scroll and accumulate wheel deltas
      e.preventDefault();
      wheelAccumulator += e.deltaY;

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        const direction = wheelAccumulator > 0 ? 1 : -1;
        wheelAccumulator = 0;

        let target = null;
        if (direction > 0) {
          target = snapPoints.find((p) => p > currentY + 10);
        } else {
          const reversed = [...snapPoints].reverse();
          target = reversed.find((p) => p < currentY - 10);
        }

        if (target !== undefined && target !== null) {
          smoothScrollTo(target);
        }
      }, 35);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
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
            
            {/* Phase 1-3: Layout & Premium 3D Typography (Restored for Performance & Aesthetic) */}
            <div className={styles.cinematicTextContainer}>
              {[...Array(15)].map((_, i) => {
                // Front layer gets a subtle outline, back layers get darker/blurred
                const isFront = i === 0;
                const zOffset = -(i * 8); // Push back 8px per layer
                const opacity = 1 - (i * 0.05); // Fade slightly as it goes back
                // Performance fix: Limit blur to only the very last few elements to save GPU overhead
                const blur = i > 10 ? (i - 10) * 0.5 : 0; 

                return (
                  <span 
                    key={i} 
                    className={styles.cinematicTextLayer}
                    style={{
                      transform: `translateZ(${zOffset}px)`,
                      opacity: opacity,
                      filter: blur > 0 ? `blur(${blur}px)` : 'none',
                      WebkitTextStroke: isFront ? '1px rgba(255, 255, 255, 0.1)' : 'none',
                      color: isFront 
                        ? 'transparent' // Front face is hollow/glassy
                        : `rgba(15, 23, 42, ${1 - i * 0.02})`, // Deep navy extrusion body
                      textShadow: isFront 
                        ? '0 0 20px rgba(0, 191, 255, 0.1)' 
                        : '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    TRUST
                  </span>
                );
              })}
            </div>

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