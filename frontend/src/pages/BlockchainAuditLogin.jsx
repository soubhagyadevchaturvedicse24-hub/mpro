/**
 * BlockchainAuditLogin.jsx
 * Apple-level dark mode admin login gate for the Blockchain Audit page.
 * Renders as a full-screen overlay inside the audit page.
 * On successful login → slides out and reveals the audit trail.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence }    from 'framer-motion';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './BlockchainAuditLogin.module.css';

const BlockchainAuditLogin = ({ onAuthenticated }) => {
  const { login }              = useAuth();
  const [email, setEmail]      = useState('admin@platform.com');
  const [password, setPassword]= useState('admin123admin');
  const [showPw, setShowPw]    = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);
  const [exiting, setExiting]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setExiting(true);
      // Let the exit animation play, then notify parent
      setTimeout(() => onAuthenticated(), 700);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Animated grid background */}
          <div className={styles.gridBg} aria-hidden />
          <div className={styles.glowOrb1} aria-hidden />
          <div className={styles.glowOrb2} aria-hidden />

          {/* Center card */}
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Shield icon with glow rings */}
            <div className={styles.iconWrap}>
              <div className={styles.ring3} />
              <div className={styles.ring2} />
              <div className={styles.ring1} />
              <div className={styles.shieldCircle}>
                <ShieldCheck size={28} strokeWidth={1.8} />
              </div>
            </div>

            {/* Headings */}
            <div className={styles.headings}>
              <h1 className={styles.title}>Blockchain Audit Vault</h1>
              <p className={styles.subtitle}>
                Restricted access · Admin credentials required
              </p>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className={styles.errorBanner}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form} id="audit-login-form">
              {/* Email */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="audit-email">
                  Admin Email
                </label>
                <div className={styles.inputWrap}>
                  <Mail size={15} className={styles.fieldIcon} />
                  <input
                    id="audit-email"
                    type="email"
                    className={styles.input}
                    placeholder="admin@jeevansetu.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="audit-password">
                  Security Passkey
                </label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.fieldIcon} />
                  <input
                    id="audit-password"
                    type={showPw ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="Enter passkey"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPw(!showPw)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                className={styles.cta}
                disabled={loading}
                id="audit-login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    <span>Authenticate &amp; Enter Vault</span>
                  </>
                )}
              </button>
            </form>

            {/* Trust footer */}
            <div className={styles.trustBar}>
              <div className={styles.trustItem}>
                <span className={styles.trustDot} />
                256-bit AES
              </div>
              <div className={styles.trustSep} />
              <div className={styles.trustItem}>
                <span className={styles.trustDot} />
                On-Chain Verified
              </div>
              <div className={styles.trustSep} />
              <div className={styles.trustItem}>
                <span className={styles.trustDot} />
                Immutable Ledger
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlockchainAuditLogin;
