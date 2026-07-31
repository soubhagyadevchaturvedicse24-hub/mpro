import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  Users, 
  Check, 
  UserPlus, 
  Building2, 
  ArrowRight,
  Lock
} from 'lucide-react';
import styles from './LifeSavedSegment.module.css';

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } }
};

/* ─── Main Component ─────────────────────────────────────────── */
const LifeSavedSegment = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <section
      id="life-saved-segment"
      className={styles.segmentContainer}
      style={{
        /* Aurora-aware glassmorphic overlay — the fixed ambient canvas
           and floating orbs are visible through this section */
        background: isLight
          ? 'linear-gradient(180deg, rgba(248, 250, 255, 0.38) 0%, rgba(248, 250, 255, 0.65) 100%)'
          : 'linear-gradient(180deg, rgba(4, 8, 15, 0.40) 0%, rgba(4, 8, 15, 0.70) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        transition: 'background 0.5s ease',
      }}
    >
      <motion.div
        className={styles.contentWrapper}
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* 1. TOP CENTER: HERO BANNER CARD */}
        <motion.div variants={fadeUp} className={styles.heroBanner} data-theme={theme}>
          
          {/* Left Text Column */}
          <div className={styles.heroLeft}>
            
            {/* Glowing Heart Icon */}
            <div className={styles.heartIconWrapper}>
              <div className={styles.heartIconGlow}>
                <HeartPulse size={44} strokeWidth={2.5} />
              </div>
            </div>

            {/* Headline */}
            <div className={styles.headline}>
              <div className={styles.headlineMain}>
                LIFE <span className={styles.headlineGradient}>SAVED</span>
              </div>
              <div className={styles.subHeadline}>Hope Delivered</div>
            </div>

            {/* EKG SVG Divider */}
            <div className={styles.ekgDivider} />

            {/* Supporting Text */}
            <p className={styles.heroText}>
              The organ reached safely.<br/>A life continues.
            </p>

            {/* 4 Feature Badges */}
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <ShieldCheck size={18} className={styles.featureIcon} />
                <span>Secure<br/>Transport</span>
              </div>
              <div className={styles.featureItem}>
                <MapPin size={18} className={styles.featureIcon} />
                <span>Verified<br/>Tracking</span>
              </div>
              <div className={styles.featureItem}>
                <Activity size={18} className={styles.featureIcon} />
                <span>Real-time<br/>Updates</span>
              </div>
              <div className={styles.featureItem}>
                <Users size={18} className={styles.featureIcon} />
                <span>Trusted<br/>Network</span>
              </div>
            </div>
            
          </div>

          {/* Right Visual Column */}
          <div className={styles.heroRight}>
            <div className={styles.imageOverlay} />
            <img 
              src="/hospital_recovery_scene.jpg" 
              alt="Hospital Recovery Scene" 
              className={styles.hospitalImage}
              onError={(e) => {
                // Fallback if image not available
                e.target.src = "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80";
              }}
            />

            {/* Floating Mission Accomplished Card */}
            <motion.div 
              className={styles.floatingCard}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <div className={styles.floatingCardTitle}>
                <div className={styles.checkBadge}>
                  <Check size={16} strokeWidth={3} />
                </div>
                Mission <span>Accomplished</span>
              </div>
              <div className={styles.floatingCardText}>
                Thank you for<br/>being the reason.
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 2. BOTTOM CENTER: 3 PORTAL CARDS */}
        <motion.div variants={fadeUp} className={styles.portalGrid}>
          
          <Link to="/dashboard/donor-consent" className={`${styles.portalCard} ${styles.cardDonor}`} data-theme={theme}>
            <div className={styles.portalLeft}>
              <div className={styles.portalIconRing}>
                <UserPlus size={28} />
              </div>
              <div className={styles.portalTextGroup}>
                <div className={styles.portalTitle}>Enter as Donor</div>
                <div className={styles.portalSub}>Sign in or create<br/>a donor account.</div>
              </div>
            </div>
            <div className={styles.portalArrowBtn}>
              <ArrowRight size={24} />
            </div>
          </Link>

          <Link to="/login" className={`${styles.portalCard} ${styles.cardReceiver}`} data-theme={theme}>
            <div className={styles.portalLeft}>
              <div className={styles.portalIconRing}>
                <Users size={28} />
              </div>
              <div className={styles.portalTextGroup}>
                <div className={styles.portalTitle}>Enter as Receiver</div>
                <div className={styles.portalSub}>Sign in or create<br/>a receiver account.</div>
              </div>
            </div>
            <div className={styles.portalArrowBtn}>
              <ArrowRight size={24} />
            </div>
          </Link>

          <Link to="/dashboard/hospital-registry" className={`${styles.portalCard} ${styles.cardHospital}`} data-theme={theme}>
            <div className={styles.portalLeft}>
              <div className={styles.portalIconRing}>
                <Building2 size={28} />
              </div>
              <div className={styles.portalTextGroup}>
                <div className={styles.portalTitle}>Enter as Hospital</div>
                <div className={styles.portalSub}>Sign in or register your<br/>hospital for approval.</div>
              </div>
            </div>
            <div className={styles.portalArrowBtn}>
              <ArrowRight size={24} />
            </div>
          </Link>

        </motion.div>

        {/* 3. TRUST FOOTER STRIP */}
        <motion.div variants={fadeUp} className={styles.trustFooter} data-theme={theme}>
          <div className={styles.trustItem}>
            <Lock size={16} className={styles.trustIcon} />
            Secure. Verified. Transparent. Because <span>every life matters</span>.
          </div>
          <div className={styles.trustItem}>
            <ShieldCheck size={16} className={styles.trustIcon} />
            Trusted by Hospitals. Powered by Blockchain.
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
};

export default LifeSavedSegment;