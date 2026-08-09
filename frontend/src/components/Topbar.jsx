import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, AlertTriangle, Activity, ShieldCheck, Check, Trash2, X, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSimulatorContext } from '../context/SimulatorContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Topbar.module.css';

const Topbar = () => {
  const [time, setTime] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const simContext = useSimulatorContext();
  const { isDayMode, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'System Active',
      message: 'Jeevan Setu organ transport logistics platform initialized.',
      type: 'info',
      time: 'Just now',
      read: false
    }
  ]);
  const [activeToasts, setActiveToasts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  
  const lastHealthRef = useRef('NORMAL');
  const lastTamperedRef = useRef(false);

  // Live Clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen to simulator telemetry changes & health state for Toast Popups
  useEffect(() => {
    if (!simContext?.telemetry) return;
    const { temperature, tampered, spiked, batteryLevel } = simContext.telemetry;

    let currentHealth = 'NORMAL';
    if (tampered || batteryLevel < 20) {
      currentHealth = 'CRITICAL';
    } else if (temperature > 8.0 || temperature < 2.0 || spiked) {
      currentHealth = 'WARNING';
    }

    const healthChanged = currentHealth !== lastHealthRef.current;
    const tamperChanged = tampered !== lastTamperedRef.current;

    if (healthChanged || tamperChanged) {
      lastHealthRef.current = currentHealth;
      lastTamperedRef.current = tampered;

      const newId = Date.now() + Math.random();
      const notifItem = {
        id: newId,
        title: tampered ? '🚨 TAMPER DETECTED!' : currentHealth === 'CRITICAL' ? '⚠️ CRITICAL HEALTH ALERT' : currentHealth === 'WARNING' ? '⚡ HEALTH WARNING' : '✅ Health Normal',
        message: tampered 
          ? `Lid open / unauthorized box tampering detected!`
          : currentHealth === 'CRITICAL'
          ? `Low battery (${batteryLevel}%) or critical alert!`
          : currentHealth === 'WARNING'
          ? `Temperature out of safe bounds (${temperature}°C)!`
          : `Transport health restored to normal parameters (${temperature}°C).`,
        type: (tampered || currentHealth === 'CRITICAL') ? 'error' : currentHealth === 'WARNING' ? 'warning' : 'success',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        read: false
      };

      setNotifications(prev => [notifItem, ...prev].slice(0, 25));
      setUnreadCount(c => c + 1);

      // Add to floating top-right toast popups
      setActiveToasts(prev => [notifItem, ...prev].slice(0, 3));

      // Auto-dismiss floating toast after 5s
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newId));
      }, 5000);
    }
  }, [simContext?.telemetry]);

  const dismissToast = (id) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const fmt = (n) => String(n).padStart(2, '0');
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const getInitials = (name) => {
    const displayName = name || user?.name || user?.hospitalName || 'NOTTO Officer';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Floating Toast Notifications */}
      <div className={styles.toastContainer}>
        {activeToasts.map(toast => (
          <div key={toast.id} className={`${styles.toastCard} ${styles[`toast_${toast.type}`]}`}>
            <div className={styles.toastIcon}>
              {toast.type === 'error' && <AlertTriangle size={18} color="#ef4444" />}
              {toast.type === 'warning' && <Activity size={18} color="#f59e0b" />}
              {toast.type === 'success' && <Check size={18} color="#10b981" />}
              {toast.type === 'info' && <ShieldCheck size={18} color="#3b82f6" />}
            </div>
            <div className={styles.toastBody}>
              <div className={styles.toastTitle}>{toast.title}</div>
              <div className={styles.toastMessage}>{toast.message}</div>
            </div>
            <button className={styles.toastCloseBtn} onClick={() => dismissToast(toast.id)} title="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <header className={styles.topbar}>

        {/* ── LEFT: Jeevan Setu Brand ── */}
        <div className={styles.brandSection}>
          <div className={styles.logoWrap}>
            <img
              src="/White and Blue Modern Health Care Presentation.png"
              alt="Jeevan Setu Logo"
              className={styles.logoImg}
            />
          </div>
          <div className={styles.brandTextGroup}>
            <div className={styles.brandName}>
              Jeevan <span className={styles.brandAccent}>Setu</span>
            </div>
            <div className={styles.brandTagline}>Smart Organ Transit Network</div>
          </div>
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        </div>

        {/* ── CENTER: Search ── */}
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            placeholder="Search donors, organs, missions…"
            className={styles.searchInput}
          />
        </div>

        {/* ── RIGHT: Actions ── */}
        <div className={styles.actions}>
          {/* Live Clock */}
          <div className={styles.timeDisplay}>
            <div className={styles.timeClock}>{timeStr}</div>
            <div className={styles.timeDate}>{dateStr}</div>
          </div>

          {/* Day / Night Toggle */}
          <button
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            id="global-theme-toggle"
          >
            <span className={styles.themeToggleTrack} data-mode={isDayMode ? 'day' : 'night'}>
              <span className={styles.themeToggleThumb}>
                {isDayMode ? <Sun size={11} color="#f59e0b" /> : <Moon size={11} color="#a78bfa" />}
              </span>
            </span>
            <span className={styles.themeToggleLabel}>
              {isDayMode ? 'Day' : 'Night'}
            </span>
          </button>

          {/* Notifications */}
          <div className={styles.notifWrapper}>
            <button
              className={styles.iconBtn}
              title="Notifications"
              onClick={handleToggleNotifications}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <div className={styles.notifHeaderTitle}>
                    <Bell size={15} />
                    <span>Notifications Center</span>
                  </div>
                  {notifications.length > 0 && (
                    <button className={styles.btnClear} onClick={handleClearNotifications} title="Clear All">
                      <Trash2 size={13} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`${styles.notifItem} ${styles[n.type]}`}>
                        <div className={styles.notifIcon}>
                          {n.type === 'error' && <AlertTriangle size={15} color="#ef4444" />}
                          {n.type === 'warning' && <Activity size={15} color="#f59e0b" />}
                          {n.type === 'success' && <Check size={15} color="#10b981" />}
                          {n.type === 'info' && <ShieldCheck size={15} color="#3b82f6" />}
                        </div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifItemTitle}>{n.title}</div>
                          <div className={styles.notifItemMessage}>{n.message}</div>
                          <div className={styles.notifItemTime}>{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* Profile + Logout */}
          <div className={styles.profileSection}>
            <div className={styles.profile}>
              <div className={styles.avatar}>
                {getInitials(user?.displayName)}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.displayName || user?.name || user?.hospitalName || 'NOTTO Officer'}</span>
                <span className={styles.userRole}>{formatRole(user?.role)}</span>
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
