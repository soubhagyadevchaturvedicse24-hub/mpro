import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } }
};

/* ─── Tactile 3D Physical Push-Button Component Wrapper ──────── */
const TactilePushButton = ({ to, imageSrc, altText, shadowColor, hoverGlow }) => (
  <Link to={to} className="inline-block flex-1 w-full max-w-[360px] no-underline">
    <motion.div
      variants={fadeUp}
      initial={{ 
        y: 0, 
        scale: 1,
        filter: `drop-shadow(0 10px 22px ${shadowColor}) drop-shadow(0 0 12px ${shadowColor}) brightness(1)` 
      }}
      whileHover={{ 
        scale: 1.045, 
        y: -5, 
        filter: `drop-shadow(0 20px 42px ${hoverGlow}) drop-shadow(0 0 35px ${hoverGlow}) brightness(1.1) contrast(1.03)`,
        transition: { type: 'spring', stiffness: 350, damping: 18 } 
      }}
      whileTap={{ 
        scale: 0.935, 
        y: 4, 
        filter: `drop-shadow(0 4px 10px ${shadowColor}) brightness(0.92)`,
        transition: { type: 'spring', stiffness: 500, damping: 14 } 
      }}
      style={{ 
        cursor: 'pointer', 
        width: '100%', 
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        borderRadius: '24px',
      }}
    >
      {/* 3D Tactile Edge Bevel Rim */}
      <div 
        className="w-full relative overflow-hidden rounded-[24px] p-1 transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.3) 100%)',
          boxShadow: 'inset 0 1.5px 0.5px rgba(255,255,255,0.7), inset 0 -3px 0.5px rgba(0,0,0,0.4)',
        }}
      >
        {/* Subtle Glass Light Glare Line */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 40%, transparent 80%)',
            borderRadius: '24px',
          }}
        />

        <img 
          src={imageSrc} 
          alt={altText} 
          style={{ 
            width: '100%', 
            height: 'auto', 
            maxHeight: '105px', 
            display: 'block', 
            objectFit: 'contain',
            borderRadius: '20px',
          }} 
        />
      </div>
    </motion.div>
  </Link>
);

const DonorLoginButton = () => (
  <TactilePushButton 
    to="/dashboard/donor-consent" 
    imageSrc="/donor_button_3d.png" 
    altText="Enter as Donor" 
    shadowColor="rgba(59,130,246,0.35)" 
    hoverGlow="rgba(59,130,246,0.75)" 
  />
);

const ReceiverLoginButton = () => (
  <TactilePushButton 
    to="/login" 
    imageSrc="/receiver_button_3d.png" 
    altText="Enter as Receiver" 
    shadowColor="rgba(167,139,250,0.32)" 
    hoverGlow="rgba(167,139,250,0.75)" 
  />
);

const HospitalLoginButton = () => (
  <TactilePushButton 
    to="/dashboard/hospital-registry" 
    imageSrc="/hospital.png" 
    altText="Enter as Hospital" 
    shadowColor="rgba(34,197,94,0.35)" 
    hoverGlow="rgba(34,197,94,0.75)" 
  />
);

/* ─── Main Component ─────────────────────────────────────────── */
const LifeSavedSegment = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <section
      id="life-saved-segment"
      className="relative w-full font-sans h-screen min-h-screen overflow-hidden flex flex-col justify-center items-center pt-[70px] pb-4"
      style={{
        background: isLight 
          ? 'linear-gradient(180deg, rgba(245, 245, 247, 0.70) 0%, rgba(245, 245, 247, 0.92) 100%)' 
          : 'linear-gradient(180deg, rgba(3, 7, 18, 0.75) 0%, rgba(3, 7, 18, 0.94) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Muted ambient glowing background blobs for dark mode */}
      {!isLight && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(147,197,253,0.25)', filter: 'blur(100px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(187,247,208,0.2)', filter: 'blur(100px)' }} />
        </div>
      )}

      <motion.div
        className="relative z-10 max-w-[1240px] mx-auto px-6 py-2 flex flex-col gap-6 w-full items-center justify-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* 1. TOP CENTER: Expanded Prominent 3D "Life Saved — Hope Delivered" Card */}
        <motion.div
          variants={fadeUp}
          whileHover={{ scale: 1.018, y: -5, rotateX: 1.5, rotateY: -1, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
          className="w-full max-w-[1140px] z-10 cursor-pointer"
          style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
        >
          <div style={{
            background: isLight ? '#FFFFFF' : 'rgba(10, 20, 35, 0.55)',
            backdropFilter: isLight ? 'none' : 'blur(16px)',
            WebkitBackdropFilter: isLight ? 'none' : 'blur(16px)',
            border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '28px',
            padding: '12px',
            boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.07)' : '0 25px 65px rgba(0, 191, 255, 0.22), inset 0 1.5px 0 rgba(255,255,255,0.4), 0 0 40px rgba(0, 191, 255, 0.18)',
          }}>
            <img
              src="/life_saved_card.png"
              alt="Life Saved — Hope Delivered"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '20px' }}
            />
          </div>
        </motion.div>

        {/* 2. BOTTOM CENTER: 3 Tactile 3D Portal Entry Buttons (Donor, Receiver, Hospital) */}
        <motion.div 
          variants={fadeUp} 
          className="flex flex-row items-center justify-center gap-4 lg:gap-8 w-full max-w-[1140px] pt-2"
        >
          <DonorLoginButton />
          <ReceiverLoginButton />
          <HospitalLoginButton />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default LifeSavedSegment;