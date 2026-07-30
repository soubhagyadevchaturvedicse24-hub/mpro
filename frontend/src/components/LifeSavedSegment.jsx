import React from 'react';
import { motion } from 'framer-motion';
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

/* ─── Existing Modular Components (Mocked as requested) ──────── */
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
  <motion.div
    variants={fadeUp}
    initial={{ filter: 'drop-shadow(0 8px 20px rgba(34,197,94,0.25))' }}
    whileHover={{ 
      scale: 1.05, 
      y: -5, 
      filter: 'drop-shadow(0 15px 35px rgba(34,197,94,0.7)) drop-shadow(0 0 30px rgba(34,197,94,0.5))',
      transition: { type: 'spring', stiffness: 300, damping: 20 } 
    }}
    whileTap={{ scale: 0.97 }}
    style={{ cursor: 'pointer' }}
  >
    <img src="/donor_button_3d.png" alt="Log in as Donor" style={{ height: '110px', width: 'auto', display: 'block', objectFit: 'contain' }} />
  </motion.div>
);

const ReceiverLoginButton = () => (
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
    <img src="/receiver_button_3d.png" alt="Log in as Receiver" style={{ height: '110px', width: 'auto', display: 'block', objectFit: 'contain' }} />
  </motion.div>
);

/* ─── Main Component ─────────────────────────────────────────── */
const LifeSavedSegment = () => {
  return (
    <section
      id="life-saved-segment"
      className="relative w-full font-sans h-screen overflow-hidden flex flex-col justify-center pt-[90px] bg-gradient-to-b from-white/90 via-blue-50/80 to-white/95 backdrop-blur-md"
    >
      {/* Muted ambient glowing background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(147,197,253,0.3)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(187,247,208,0.25)', filter: 'blur(100px)' }} />
      </div>

      <motion.div
        className="relative z-10 max-w-[1300px] mx-auto px-6 py-6 flex flex-col gap-6 w-full"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
      >
        {/* ══════════════════════════════════════════════════════
            1. TOP ROW: Life Saved Card (Left) & 3D Hospital (Right)
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full">
          
          {/* Left Column: Life Saved Card */}
          <div className="lg:col-span-8 w-full flex items-center justify-start">
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 1.008, y: -4, rotateX: 1, rotateY: -1, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
              className="w-full"
            >
              <div style={{
                background: 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: '28px',
                padding: '10px',
                boxShadow: '0 16px 48px rgba(96,165,250,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}>
                <img
                  src="/life_saved_card.png"
                  alt="Life Saved — Hope Delivered"
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '20px' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Hospital Image */}
          <div className="lg:col-span-4 w-full flex justify-center items-center pl-4 lg:pl-0">
            <motion.div
              variants={fadeUp}
              initial={{ filter: 'drop-shadow(0 12px 24px rgba(34,197,94,0.22))' }}
              whileHover={{ 
                scale: 1.04, 
                y: -6, 
                rotateX: 2, 
                rotateY: -2, 
                filter: 'drop-shadow(0 20px 40px rgba(34,197,94,0.6)) drop-shadow(0 0 30px rgba(34,197,94,0.4))',
                transition: { type: 'spring', stiffness: 280, damping: 20 } 
              }}
              style={{ perspective: 1200, transformStyle: 'preserve-3d', width: '100%', maxWidth: '380px', cursor: 'pointer' }}
            >
              <img
                src="/hospital_3d.png"
                alt="Hospital Component"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </motion.div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            2. MIDDLE ROW: CTA Buttons
        ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="flex justify-center items-center gap-6 w-full">
          <DonorLoginButton />
          <ReceiverLoginButton />
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            3. BOTTOM ROW: Image Timeline Strip (Interactive)
        ══════════════════════════════════════════════════════ */}
        <div className="w-full flex justify-center">
          <motion.div
            variants={fadeUp}
            initial={{ filter: 'drop-shadow(0 8px 20px rgba(96,165,250,0.15))' }}
            whileHover={{ 
              scale: 1.02, 
              y: -4, 
              filter: 'drop-shadow(0 15px 35px rgba(96,165,250,0.6)) drop-shadow(0 0 25px rgba(96,165,250,0.4))' 
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