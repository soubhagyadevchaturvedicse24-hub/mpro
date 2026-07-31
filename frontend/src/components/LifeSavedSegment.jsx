import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package, ShieldCheck, MapPin, Building2, BedDouble, Activity, Heart, ArrowRight, Lock
} from 'lucide-react';

/* ─── Animation Variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } }
};

/* ─── Portal Entry Buttons with Night/Day Glow ──────────────── */
const DonorLoginButton = () => (
  <Link to="/dashboard/donor-consent" className="inline-block flex-1 max-w-[340px]">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 10px 25px rgba(59,130,246,0.35)) drop-shadow(0 0 15px rgba(59,130,246,0.2))' }}
      whileHover={{ 
        scale: 1.04, 
        y: -5, 
        filter: 'drop-shadow(0 18px 40px rgba(59,130,246,0.75)) drop-shadow(0 0 35px rgba(59,130,246,0.6))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer', width: '100%' }}
    >
      <img src="/donor_button_3d.png" alt="Enter as Donor" style={{ width: '100%', height: 'auto', maxHeight: '100px', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

const ReceiverLoginButton = () => (
  <Link to="/login" className="inline-block flex-1 max-w-[340px]">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 10px 25px rgba(167,139,250,0.32)) drop-shadow(0 0 15px rgba(167,139,250,0.2))' }}
      whileHover={{ 
        scale: 1.04, 
        y: -5, 
        filter: 'drop-shadow(0 18px 40px rgba(167,139,250,0.75)) drop-shadow(0 0 35px rgba(167,139,250,0.6))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer', width: '100%' }}
    >
      <img src="/receiver_button_3d.png" alt="Enter as Receiver" style={{ width: '100%', height: 'auto', maxHeight: '100px', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

const HospitalLoginButton = () => (
  <Link to="/dashboard/hospital-registry" className="inline-block w-full max-w-[340px]">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 10px 25px rgba(34,197,94,0.35)) drop-shadow(0 0 15px rgba(34,197,94,0.2))' }}
      whileHover={{ 
        scale: 1.04, 
        y: -5, 
        filter: 'drop-shadow(0 18px 40px rgba(34,197,94,0.75)) drop-shadow(0 0 35px rgba(34,197,94,0.6))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer', width: '100%' }}
    >
      <img src="/hospital.png" alt="Enter as Hospital" style={{ width: '100%', height: 'auto', maxHeight: '100px', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

/* ─── Main Component ─────────────────────────────────────────── */
const LifeSavedSegment = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <section
      id="life-saved-segment"
      className="relative w-full font-sans min-h-screen overflow-hidden flex flex-col justify-between pt-[85px] pb-6"
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
        className="relative z-10 max-w-[1320px] mx-auto px-6 py-4 flex flex-col gap-6 w-full flex-grow justify-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* 1. MAIN 2-COLUMN GRID (8-Cols Left / 4-Cols Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
          
          {/* LEFT COLUMN (8 Cols): Life Saved Card + Donor & Receiver Buttons */}
          <div className="lg:col-span-8 w-full flex flex-col justify-between gap-5">
            
            {/* Top: Life Saved Card */}
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 1.008, y: -4, rotateX: 1, rotateY: -1, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
              className="w-full"
            >
              <div style={{
                background: isLight ? '#FFFFFF' : 'rgba(10, 20, 35, 0.45)',
                backdropFilter: isLight ? 'none' : 'blur(14px)',
                WebkitBackdropFilter: isLight ? 'none' : 'blur(14px)',
                border: isLight ? '1px solid #E8E8ED' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                padding: '10px',
                boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 16px 48px rgba(0, 191, 255, 0.12), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}>
                <img
                  src="/life_saved_card.png"
                  alt="Life Saved — Hope Delivered"
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }}
                />
              </div>
            </motion.div>

            {/* Bottom: Donor & Receiver Entry Buttons Side-by-Side */}
            <motion.div variants={fadeUp} className="flex flex-row items-center justify-between gap-4 w-full">
              <DonorLoginButton />
              <ReceiverLoginButton />
            </motion.div>
          </div>

          {/* RIGHT COLUMN (4 Cols): Unified Hospital Glass Node Frame */}
          <div className="lg:col-span-4 w-full flex flex-col justify-between items-center h-full">
            <motion.div
              variants={fadeUp}
              className="w-full h-full flex flex-col justify-between items-center p-4"
              style={{
                background: isLight ? '#FFFFFF' : 'rgba(10, 20, 35, 0.45)',
                backdropFilter: isLight ? 'none' : 'blur(14px)',
                WebkitBackdropFilter: isLight ? 'none' : 'blur(14px)',
                border: isLight ? '1px solid #E8E8ED' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 16px 48px rgba(34, 197, 94, 0.14), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {/* 3D Hospital Model Component */}
              <motion.div
                initial={{ filter: 'drop-shadow(0 12px 24px rgba(34,197,94,0.3))' }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -6, 
                  rotateX: 2, 
                  rotateY: -2, 
                  filter: 'drop-shadow(0 20px 40px rgba(34,197,94,0.65)) drop-shadow(0 0 30px rgba(34,197,94,0.45))',
                  transition: { type: 'spring', stiffness: 280, damping: 20 } 
                }}
                className="w-full flex justify-center items-center py-2"
                style={{ perspective: 1200, transformStyle: 'preserve-3d', cursor: 'pointer' }}
              >
                <img
                  src="/hospital_3d.png"
                  alt="Hospital Component"
                  style={{ width: '100%', maxWidth: '280px', height: 'auto', display: 'block' }}
                />
              </motion.div>

              {/* Enter as Hospital Button directly below the 3D Hospital */}
              <div className="w-full flex justify-center pt-2">
                <HospitalLoginButton />
              </div>
            </motion.div>
          </div>
        </div>

        {/* 2. BOTTOM ROW: Interactive Timeline Process Strip */}
        <div className="w-full flex justify-center pt-2 pb-2">
          <motion.div
            variants={fadeUp}
            initial={{ filter: isLight ? 'none' : 'drop-shadow(0 10px 25px rgba(0,210,255,0.25))' }}
            whileHover={{ 
              scale: 1.015, 
              y: -3, 
              filter: isLight ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.06))' : 'drop-shadow(0 18px 40px rgba(0,210,255,0.55)) drop-shadow(0 0 30px rgba(0,210,255,0.4))' 
            }}
            whileTap={{ scale: 0.99 }}
            className="w-full max-w-[1240px] flex justify-center items-center cursor-pointer px-2"
          >
            <img 
              src="/strip.png" 
              alt="Process Timeline" 
              style={{ width: '100%', maxHeight: '115px', objectFit: 'contain', display: 'block', borderRadius: '24px' }} 
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default LifeSavedSegment;