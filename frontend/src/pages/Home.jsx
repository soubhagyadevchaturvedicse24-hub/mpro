import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, HeartPulse, Building2, User, ShieldCheck, 
  Box, Lock, Sun, Moon, ArrowRight, Heart
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
      const newLeft = 75 - (25 * p1); // 75% -> 50%
      const newScale = 1 - (0.72 * p1); // 1.0 -> 0.28
      
      // Dynamically find the exact horizontal and vertical center of the blockchain node ring
      let targetOffsetX = 0;
      let targetOffsetY = 0;
      const stageCenter = document.getElementById('network-stage-center');
      if (stageCenter && ecoSection) {
        const stageRect = stageCenter.getBoundingClientRect();
        const stageCenterX = stageRect.left + stageRect.width / 2;
        const stageCenterY = stageRect.top + stageRect.height / 2;
        
        const vwCenter = window.innerWidth / 2;
        const vhCenter = window.innerHeight / 2;
        
        targetOffsetX = stageCenterX - vwCenter;
        targetOffsetY = stageCenterY - vhCenter;
      }
      
      const newOffsetX = p1 * targetOffsetX;
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

    // Easing function: ease-in-out cubic
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
        if (progress < 1) requestAnimationFrame(step);
        else isSnappingRef.current = false;
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
      const ecoPoint = snapPoints[1] || 0; // Ecosystem / Blockchain segment offsetTop
      const lastSnapPoint = snapPoints[snapPoints.length - 1];
      const currentY = container.scrollTop;

      // 1. SCROLLING UP (e.deltaY < 0) from Ecosystem segment: 1 unit scroll automatically goes to top (Hero, y = 0)
      if (e.deltaY < 0 && currentY <= ecoPoint + 200) {
        e.preventDefault();
        smoothScrollTo(0, 800);
        return;
      }

      // 2. SCROLLING DOWN (e.deltaY > 0) past LifeSaved into footer: allow free scrolling
      if (currentY >= lastSnapPoint - 10 && e.deltaY > 0) {
        return;
      }

      // 3. Otherwise, snap to target section in direction of scroll
      e.preventDefault();

      wheelAccumulator += e.deltaY;

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        const currentY = container.scrollTop;
        const snapPoints = getSnapPoints();
        const direction = wheelAccumulator > 0 ? 1 : -1;
        wheelAccumulator = 0;

        let target = null;
        if (direction > 0) {
          target = snapPoints.find((p) => p > currentY + 50);
        } else {
          const reversed = [...snapPoints].reverse();
          target = reversed.find((p) => p < currentY - 50);
        }

        if (target !== undefined && target !== null) {
          smoothScrollTo(target, 800);
        }
      }, 25);
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
                  variant="primary" 
                  size="md"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  Log in as <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                </Button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link to="/login?role=donor" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                      <HeartPulse size={16} className={styles.dropdownIcon} /> Donor Login
                    </Link>
                    <Link to="/login?role=hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                      <Building2 size={16} className={styles.dropdownIcon} /> Hospital Login
                    </Link>
                    <Link to="/login?role=receiver" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                      <User size={16} className={styles.dropdownIcon} /> Receiver Login
                    </Link>
                    <Link to="/login?role=admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                      <ShieldCheck size={16} className={styles.dropdownIcon} /> Admin Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className={`${styles.heroUI} ${styles.sectionHero}`}>
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
                <Link to="/login?role=donor" className={`${styles.portalCard} ${styles.cardBlue}`} data-theme={theme}>
                  <div className={styles.portalLeft}>
                    <div className={styles.portalIconRing}>
                      <Heart size={20} strokeWidth={2} />
                    </div>
                    <div className={styles.portalTextGroup}>
                      <div className={styles.portalTitle}>Enter as Donor</div>
                      <div className={styles.portalSub}>Pledge & donor registry</div>
                    </div>
                  </div>
                  <div className={styles.portalArrowOuter}>
                    <div className={styles.portalArrowInner}>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>

                <Link to="/login?role=receiver" className={`${styles.portalCard} ${styles.cardPurple}`} data-theme={theme}>
                  <div className={styles.portalLeft}>
                    <div className={styles.portalIconRing}>
                      <User size={20} strokeWidth={2} />
                    </div>
                    <div className={styles.portalTextGroup}>
                      <div className={styles.portalTitle}>Enter as Receiver</div>
                      <div className={styles.portalSub}>Allocation & recipient queue</div>
                    </div>
                  </div>
                  <div className={styles.portalArrowOuter}>
                    <div className={styles.portalArrowInner}>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>

                <Link to="/login?role=hospital" className={`${styles.portalCard} ${styles.cardGreen}`} data-theme={theme}>
                  <div className={styles.portalLeft}>
                    <div className={styles.portalIconRing}>
                      <Building2 size={20} strokeWidth={2} />
                    </div>
                    <div className={styles.portalTextGroup}>
                      <div className={styles.portalTitle}>Enter as Hospital</div>
                      <div className={styles.portalSub}>Authorized medical center</div>
                    </div>
                  </div>
                  <div className={styles.portalArrowOuter}>
                    <div className={styles.portalArrowInner}>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>

                <Link to="/login?role=admin" className={`${styles.portalCard} ${styles.cardAmber}`} data-theme={theme}>
                  <div className={styles.portalLeft}>
                    <div className={styles.portalIconRing}>
                      <ShieldCheck size={20} strokeWidth={2} />
                    </div>
                    <div className={styles.portalTextGroup}>
                      <div className={styles.portalTitle}>Enter as Admin</div>
                      <div className={styles.portalSub}>System administration & governance</div>
                    </div>
                  </div>
                  <div className={styles.portalArrowOuter}>
                    <div className={styles.portalArrowInner}>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
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