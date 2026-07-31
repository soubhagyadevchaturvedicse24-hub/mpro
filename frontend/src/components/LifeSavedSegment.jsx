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

/* ─── Timeline Steps ─────────────────────────────────────────── */
const TIMELINE = [
  { icon: Package,     label: 'Organ\nDonated'         },
  { icon: ShieldCheck, label: 'Secure\nTransport'       },
  { icon: ShieldCheck, label: 'Verified &\nTracked'     },
  { icon: MapPin,      label: 'In\nTransit'             },
  { icon: Building2,   label: 'Organ\nReceived'         },
  { icon: BedDouble,   label: 'Transplant\nSuccessful'  },
  { icon: Activity,    label: 'Life\nSaved', active: true },
];

/* ─── Existing Modular Components ────────────────────────────── */
const LifeSavedCard = () => (
  <motion.div
    variants={fadeUp}
    whileHover={{ scale: 1.02, y: -4, rotateX: 2, rotateY: -2, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
    className="w-full z-10"
  >
    <div style={{
      background: 'rgba(255,255,255,0.42)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.55)',
      borderRadius: '24px',
      padding: '8px',
      boxShadow: '0 12px 36px rgba(96,165,250,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
    }}>
      <img
        src="/life_saved_card.png"
        alt="Life Saved — Hope Delivered"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }}
      />
    </div>
  </motion.div>
);

const DonorLoginButton = () => (
  <Link to="/dashboard/donor-consent" className="inline-block">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 8px 20px rgba(59,130,246,0.3))' }}
      whileHover={{ 
        scale: 1.05, 
        y: -5, 
        filter: 'drop-shadow(0 15px 35px rgba(59,130,246,0.7)) drop-shadow(0 0 30px rgba(59,130,246,0.5))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer' }}
    >
      <img src="/donor_button_3d.png" alt="Enter as Donor" style={{ height: '95px', width: 'auto', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

const ReceiverLoginButton = () => (
  <Link to="/login" className="inline-block">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 8px 20px rgba(167,139,250,0.28))' }}
      whileHover={{ 
        scale: 1.05, 
        y: -5, 
        filter: 'drop-shadow(0 15px 35px rgba(167,139,250,0.7)) drop-shadow(0 0 30px rgba(167,139,250,0.5))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer' }}
    >
      <img src="/receiver_button_3d.png" alt="Enter as Receiver" style={{ height: '95px', width: 'auto', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

const HospitalLoginButton = () => (
  <Link to="/dashboard/hospital-registry" className="inline-block">
    <motion.div
      variants={fadeUp}
      initial={{ filter: 'drop-shadow(0 8px 20px rgba(34,197,94,0.3))' }}
      whileHover={{ 
        scale: 1.05, 
        y: -5, 
        filter: 'drop-shadow(0 15px 35px rgba(34,197,94,0.7)) drop-shadow(0 0 30px rgba(34,197,94,0.5))',
        transition: { type: 'spring', stiffness: 300, damping: 20 } 
      }}
      whileTap={{ scale: 0.97 }}
      style={{ cursor: 'pointer' }}
    >
      <img src="/hospital.png" alt="Enter as Hospital" style={{ height: '95px', width: 'auto', display: 'block', objectFit: 'contain' }} />
    </motion.div>
  </Link>
);

/* ─── Main Component ─────────────────────────────────────────── */
const LifeSavedSegment = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <section
      id="life-saved-segment"
      className="relative w-full font-sans min-h-screen overflow-hidden flex flex-col justify-between pt-[90px]"
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
        className="relative z-10 max-w-[1300px] mx-auto px-6 py-6 flex flex-col gap-6 w-full flex-grow justify-center"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* 1. TOP ROW: Life Saved Card (Left) & 3D Hospital with Button Directly Below (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
          
          {/* Left Column: Life Saved Card */}
          <div className="lg:col-span-8 w-full flex items-center justify-start">
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
          </div>

          {/* Right Column: 3D Hospital Image & Hospital Button Directly Below */}
          <div className="lg:col-span-4 w-full flex flex-col justify-center items-center gap-2 pl-4 lg:pl-0">
            <motion.div
              variants={fadeUp}
              initial={{ filter: 'drop-shadow(0 12px 24px rgba(34,197,94,0.3))' }}
              whileHover={{ 
                scale: 1.04, 
                y: -6, 
                rotateX: 2, 
                rotateY: -2, 
                filter: 'drop-shadow(0 20px 40px rgba(34,197,94,0.6)) drop-shadow(0 0 30px rgba(34,197,94,0.4))',
                transition: { type: 'spring', stiffness: 280, damping: 20 } 
              }}
              style={{ perspective: 1200, transformStyle: 'preserve-3d', width: '100%', maxWidth: '320px', cursor: 'pointer' }}
            >
              <img
                src="/hospital_3d.png"
                alt="Hospital Component"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </motion.div>

            {/* Hospital Button directly underneath the Hospital 3D Component */}
            <HospitalLoginButton />
          </div>
        </div>

        {/* 2. MIDDLE ROW: CTA Portal Entry Buttons (Donor, Receiver, Hospital) */}
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center items-center gap-4 lg:gap-8 w-full py-2">
          <DonorLoginButton />
          <ReceiverLoginButton />
          <HospitalLoginButton />
        </motion.div>

        {/* 3. BOTTOM ROW: Image Timeline Strip (Interactive) */}
        <div className="w-full flex justify-center py-4">
          <motion.div
            variants={fadeUp}
            initial={{ filter: isLight ? 'none' : 'drop-shadow(0 8px 20px rgba(0,210,255,0.2))' }}
            whileHover={{ 
              scale: 1.02, 
              y: -4, 
              filter: isLight ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.06))' : 'drop-shadow(0 15px 35px rgba(0,210,255,0.5)) drop-shadow(0 0 25px rgba(0,210,255,0.4))' 
            }}
            whileTap={{ scale: 0.99 }}
            className="w-[90%] max-w-[1000px] flex justify-center items-center cursor-pointer px-4 lg:px-0"
          >
            <img 
              src="/strip.png" 
              alt="Process Timeline" 
              style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', display: 'block', borderRadius: '24px' }} 
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default LifeSavedSegment;