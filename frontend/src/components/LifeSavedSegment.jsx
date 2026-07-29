import React from 'react';
import { ShieldCheck, Heart, Hospital, Activity, ArrowRight, Building2, User } from 'lucide-react';
import styles from './LifeSavedSegment.module.css';

const LifeSavedSegment = ({ theme = 'light' }) => {
  return (
    <section className={styles.segmentContainer} data-theme={theme}>
      
      {/* ─── HERO BLOCK: HOSPITAL RECOVERY SCENE ─── */}
      <div className={styles.heroScene}>
        <div className={styles.heroTextOverlay}>
          
          <div className={styles.heartIconPulse}>
            <Heart fill="currentColor" strokeWidth={0} size={48} className={styles.greenHeart} />
            <div className={styles.ecgLines}>
              {/* Decorative ECG lines */}
              <svg viewBox="0 0 100 20" className={styles.miniEcg}>
                <path d="M 0 10 L 20 10 L 25 5 L 35 18 L 40 10 L 100 10" className={styles.ecgPath} />
              </svg>
            </div>
          </div>
          
          <h1 className={styles.lifeSavedTitle}>LIFE SAVED</h1>
          <p className={styles.heroSubtitle}>Organ Delivered Successfully</p>
          
          <div className={styles.verificationBadge}>
            <div className={styles.shieldIconContainer}>
              <ShieldCheck size={16} strokeWidth={2.5} className={styles.shieldIcon} />
            </div>
            <span>Verified by NeoLife</span>
          </div>

        </div>
      </div>

      {/* ─── MIDDLE BLOCK: BLOCKCHAIN JOURNEY PILL ─── */}
      <div className={styles.journeyPill}>
        <div className={styles.journeyStep}>
          <div className={styles.stepIconBox}><Heart size={20} className={styles.stepIconBlue} /></div>
          <span className={styles.stepText}>Donation</span>
        </div>
        
        <div className={styles.journeyConnector}>
          <div className={styles.connectorLine} />
          <ArrowRight size={14} className={styles.connectorArrow} />
        </div>

        <div className={styles.journeyStep}>
          <div className={styles.stepIconBox}><ShieldCheck size={20} className={styles.stepIconBlue} /></div>
          <span className={styles.stepText}>Verified</span>
        </div>

        <div className={styles.journeyConnector}>
          <div className={styles.connectorLine} />
          <ArrowRight size={14} className={styles.connectorArrow} />
        </div>

        <div className={styles.journeyStep}>
          <div className={styles.stepIconBox}><Hospital size={20} className={styles.stepIconBlue} /></div>
          <span className={styles.stepText}>Hospital</span>
        </div>

        <div className={styles.journeyConnector}>
          <div className={styles.connectorLineFinal} />
          <ArrowRight size={14} className={styles.connectorArrowFinal} />
        </div>

        <div className={`${styles.journeyStep} ${styles.stepFinal}`}>
          <div className={styles.stepIconBoxGreen}><Activity size={20} className={styles.stepIconGreen} /></div>
          <span className={styles.stepTextGreen}>Life Saved</span>
        </div>
      </div>

      {/* ─── BOTTOM BLOCK: HUGE CTAs ─── */}
      <div className={styles.ctaGrid}>
        <div className={`${styles.hugeCtaCard} ${styles.donorCta}`}>
          <div className={styles.ctaIconContainer}>
            <Heart size={40} className={styles.ctaMainIcon} />
          </div>
          <div className={styles.ctaTextGroup}>
            <h2>Log in as Donor</h2>
            <p>Register or access your donor account</p>
          </div>
          <div className={styles.ctaArrowCircle}>
            <ArrowRight size={24} />
          </div>
        </div>

        <div className={`${styles.hugeCtaCard} ${styles.receiverCta}`}>
          <div className={styles.ctaIconContainer}>
            <User size={40} className={styles.ctaMainIcon} />
          </div>
          <div className={styles.ctaTextGroup}>
            <h2>Log in as Receiver</h2>
            <p>Access your recipient account</p>
          </div>
          <div className={styles.ctaArrowCircle}>
            <ArrowRight size={24} />
          </div>
        </div>
      </div>

      {/* ─── BOTTOM STRIP: TRUST CHECKMARKS ─── */}
      <div className={styles.trustStrip}>
        <div className={styles.trustItem}>
          <ShieldCheck size={18} className={styles.trustIcon} />
          <span>Blockchain Verified</span>
        </div>
        <div className={styles.trustSeparator} />
        <div className={styles.trustItem}>
          <Building2 size={18} className={styles.trustIcon} />
          <span>Hospital Confirmed</span>
        </div>
        <div className={styles.trustSeparator} />
        <div className={styles.trustItem}>
          <ShieldCheck size={18} className={styles.trustIcon} />
          <span>Privacy Protected</span>
        </div>
        <div className={styles.trustSeparator} />
        <div className={styles.trustItem}>
          <Heart size={18} fill="currentColor" strokeWidth={0} className={styles.trustIconGreen} />
          <span className={styles.trustTextGreen}>Organ Successfully Delivered</span>
        </div>
      </div>

    </section>
  );
};

export default LifeSavedSegment;