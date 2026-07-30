import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, MapPin, ShieldCheck, Bell, BatteryCharging, 
  Box, ArrowRight, Building2, Landmark, Heart, 
  Wifi, Lock, Network, UserCheck, HeartPulse
} from 'lucide-react';
import Heart3D from './Heart3D';
import styles from './EcosystemSegment.module.css';

const EcosystemSegment = ({ id, theme = 'dark', mousePos }) => {
  return (
    <section id={id} className={styles.segmentContainer} data-theme={theme}>

      {/* ── TOP BADGE (absorbed from divider) ── */}
      <div className={styles.internalTopBadge}>
        <div className={styles.internalBadgeLine} />
        <div className={styles.internalBadgeChip}>
          <ShieldCheck size={14} />
          <span>ORGAN SECURED</span>
        </div>
        <div className={styles.internalBadgeLine} />
      </div>

      {/* ─── MAIN THREE-COLUMN LAYOUT ─── */}
      <div className={styles.dashboardGrid}>
        
        {/* LEFT COLUMN: HEADLINE & DESCRIPTION */}
        <div className={styles.headlineColumn}>
          <h1 className={styles.mainHeading}>
            <span className={styles.textSilver}>Secured by</span> <br />
            <span className={styles.textBlockchain}>Blockchain.</span> <br />
            <span className={styles.textConnected}>Connected for <span className={styles.textLife}>Life.</span></span>
          </h1>

          {/* Animated EKG Wave Line */}
          <div className={styles.ekgContainer}>
            <svg className={styles.ekgSvg} viewBox="0 0 200 40">
              <path 
                d="M 0 20 L 40 20 L 48 10 L 56 30 L 64 5 L 72 35 L 80 20 L 200 20" 
                className={styles.ekgPath} 
              />
            </svg>
          </div>

          <p className={styles.heroDescription}>
            Every organ. Every update. Every beat. Secured, verified and connected through the power of 
            <span className={styles.descHighlight}> Blockchain</span>.
          </p>
        </div>

        {/* CENTER COLUMN: 3D HEART & 6 BLOCKCHAIN VAULT MODULES */}
        <div className={styles.centerEcosystem}>
          <div className={styles.networkStage}>
            
            {/* SVG 3D Metallic Interlink Chain Paths */}
            <svg className={styles.svgBeams} viewBox="0 0 600 600">
              {/* Radial Energy Spoke Lines (stopping outside heart and outside cards) */}
              <line x1="300" y1="220" x2="300" y2="150" className={styles.beamLine} />
              <line x1="369" y1="260" x2="430" y2="225" className={styles.beamLine} />
              <line x1="369" y1="340" x2="430" y2="375" className={styles.beamLine} />
              <line x1="300" y1="380" x2="300" y2="450" className={styles.beamLine} />
              <line x1="231" y1="340" x2="170" y2="375" className={styles.beamLine} />
              <line x1="231" y1="260" x2="170" y2="225" className={styles.beamLine} />
              
              {/* Interlink Chain Ring (connecting outer node edges) */}
              <polygon 
                points="300,150 430,225 430,375 300,450 170,375 170,225" 
                className={styles.blockchainChainRing} 
              />
            </svg>

            {/* Center Floating Heart Pedestal */}
            <div id="network-stage-center" className={styles.centerHeartPedestal}>
              <div className={styles.pedestalGlow} />
              <div className={styles.heartContainerInsideCube}>
                {/* Heart3D instance removed: The main floating heart from Home.jsx will dock here via scroll transition */}
              </div>
            </div>

            {/* ─── VAULT MODULE 1: TOP - TEMPERATURE ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeTop}`}>
              {/* Metallic Frame & Corner Security Bolts */}
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              {/* Mechanical Hinges on Left Side */}
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <Thermometer size={16} className={styles.vaultIconCyan} />
                <span className={styles.vaultTitle}>TEMPERATURE</span>
              </div>
              <div className={styles.vaultValue}>4.0°C</div>

              {/* Combination Lock Wheel */}
              <div className={styles.combinationLockWheel}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconCyan} />
                </div>
              </div>
            </div>

            {/* ─── VAULT MODULE 2: TOP RIGHT - TAMPER ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeTopRight}`}>
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <ShieldCheck size={16} className={styles.vaultIconCyan} />
                <span className={styles.vaultTitle}>TAMPER</span>
              </div>
              <div className={styles.vaultValue}>Secure</div>

              <div className={styles.combinationLockWheel}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconCyan} />
                </div>
              </div>
            </div>

            {/* ─── VAULT MODULE 3: BOTTOM RIGHT - BLOCKCHAIN ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeBottomRight}`}>
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <Box size={16} className={styles.vaultIconPurple} />
                <span className={styles.vaultTitlePurple}>BLOCKCHAIN</span>
              </div>
              <div className={styles.vaultValuePurple}>Verified</div>

              <div className={styles.combinationLockWheelPurple}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconPurple} />
                </div>
              </div>
            </div>

            {/* ─── VAULT MODULE 4: BOTTOM - ALERT / BUZZER ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeBottom}`}>
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <Bell size={16} className={styles.vaultIconOrange} />
                <span className={styles.vaultTitleOrange}>ALERT</span>
              </div>
              <div className={styles.vaultValueOrange}>Silent</div>

              <div className={styles.combinationLockWheelOrange}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconOrange} />
                </div>
              </div>
            </div>

            {/* ─── VAULT MODULE 5: BOTTOM LEFT - BATTERY ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeBottomLeft}`}>
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <BatteryCharging size={16} className={styles.vaultIconCyan} />
                <span className={styles.vaultTitle}>BATTERY</span>
              </div>
              <div className={styles.vaultValue}>92%</div>

              <div className={styles.combinationLockWheel}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconCyan} />
                </div>
              </div>
            </div>

            {/* ─── VAULT MODULE 6: TOP LEFT - LOCATION ─── */}
            <div className={`${styles.blockchainVaultModule} ${styles.nodeTopLeft}`}>
              <div className={styles.boltTL} />
              <div className={styles.boltTR} />
              <div className={styles.boltBL} />
              <div className={styles.boltBR} />
              <div className={styles.hingeTopLeft} />
              <div className={styles.hingeBottomLeft} />

              <div className={styles.vaultHeader}>
                <MapPin size={16} className={styles.vaultIconCyan} />
                <span className={styles.vaultTitle}>LOCATION</span>
              </div>
              <div className={styles.vaultValueSmall}>21.2514° N</div>

              <div className={styles.combinationLockWheel}>
                <div className={styles.lockDialTicks} />
                <div className={styles.lockInnerCenter}>
                  <Lock size={12} className={styles.lockIconCyan} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ACCESS PORTAL SHORTCUTS */}
        <div className={styles.accessPortalCard}>
          <div className={styles.cardHeader}>
            <Lock size={16} className={styles.headerLockIcon} />
            <span className={styles.cardTitle}>ACCESS PORTAL</span>
          </div>

          <div className={styles.portalList}>
            <Link to="/login?role=hospital" className={styles.portalItem}>
              <div className={styles.portalLeft}>
                <Building2 size={20} className={styles.portalIcon} />
                <span className={styles.portalName}>Hospitals</span>
              </div>
              <span className={styles.portalSub}>Login &rarr;</span>
            </Link>

            <Link to="/login?role=sotto" className={styles.portalItem}>
              <div className={styles.portalLeft}>
                <Landmark size={20} className={styles.portalIcon} />
                <span className={styles.portalName}>SOTTO</span>
              </div>
              <span className={styles.portalSub}>Login &rarr;</span>
            </Link>

            <Link to="/login?role=rotto" className={styles.portalItem}>
              <div className={styles.portalLeft}>
                <Landmark size={20} className={styles.portalIcon} />
                <span className={styles.portalName}>ROTTO</span>
              </div>
              <span className={styles.portalSub}>Login &rarr;</span>
            </Link>

            <Link to="/login?role=notto" className={styles.portalItem}>
              <div className={styles.portalLeft}>
                <Landmark size={20} className={styles.portalIcon} />
                <span className={styles.portalName}>NOTTO</span>
              </div>
              <span className={styles.portalSub}>Login &rarr;</span>
            </Link>

            <Link to="/login?role=transplant" className={styles.portalItem}>
              <div className={styles.portalLeft}>
                <Heart size={20} className={styles.portalIcon} />
                <span className={styles.portalName}>Transplant Team</span>
              </div>
              <span className={styles.portalSub}>Login &rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ─── BOTTOM 7-STEP WORKFLOW TIMELINE ─── */}
      <div className={styles.workflowTimeline}>
        <div className={styles.timelineTrackLine} />
        
        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircle}>
            <Heart size={18} />
          </div>
          <span className={styles.timelineLabel}>Organ Secured</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircle}>
            <Wifi size={18} />
          </div>
          <span className={styles.timelineLabel}>IoT Sensors</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircle}>
            <Lock size={18} />
          </div>
          <span className={styles.timelineLabel}>Data Encrypted</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCirclePurple}>
            <Box size={18} />
          </div>
          <span className={styles.timelineLabel}>Blockchain Ledger</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircle}>
            <Network size={18} />
          </div>
          <span className={styles.timelineLabel}>Decentralized Network</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircle}>
            <ShieldCheck size={18} />
          </div>
          <span className={styles.timelineLabel}>Verified Data</span>
        </div>

        <span className={styles.timelineArrow}>&rarr;</span>

        <div className={styles.timelineItem}>
          <div className={styles.timelineIconCircleGreen}>
            <UserCheck size={18} />
          </div>
          <span className={styles.timelineLabel}>Trusted Access</span>
        </div>

      </div>

    </section>
  );
};

export default EcosystemSegment;
