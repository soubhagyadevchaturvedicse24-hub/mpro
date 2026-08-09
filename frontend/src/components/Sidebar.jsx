import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GitFork, Map, ShieldCheck, HeartPulse,
  Cpu, LogOut, FileCheck, Building2, Scale, ChevronLeft, ChevronRight, BarChart3, Activity, Truck
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../context/AuthContext';

const ALL_LINKS = [
  { name: 'Command Center',     path: '/dashboard/overview',          icon: LayoutDashboard, section: 'Operations', roles: ['PLATFORM_ADMIN', 'ADMIN', 'HOSPITAL_COORDINATOR', 'HOSPITAL_LO', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'] },
  { name: 'Transport Mgmt',      path: '/dashboard/transport-management', icon: Truck,       section: null, roles: ['HOSPITAL_COORDINATOR', 'HOSPITAL_LO', 'PLATFORM_ADMIN', 'ADMIN', 'NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER'] },
  { name: 'Hospital Approvals',  path: '/dashboard/hospital-approvals', icon: ShieldCheck,     section: 'Approvals', roles: ['NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER', 'PLATFORM_ADMIN', 'ADMIN'] },
  { name: 'Hospital Compliance', path: '/dashboard/hospital-registry', icon: Building2,       section: null, roles: ['NOTTO_OFFICER', 'ROTTO_SOTTO_OFFICER', 'PLATFORM_ADMIN', 'ADMIN', 'HOSPITAL_COORDINATOR', 'HOSPITAL_LO', 'TRANSPLANT_SURGEON'] },
  { name: 'Blockchain Audit',    path: '/dashboard/audit',             icon: ShieldCheck,    section: 'Audit', roles: ['PLATFORM_ADMIN', 'ADMIN'] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  let lastSection = null;

  // Auto-collapse on mobile viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Strict Role-Based Filtering
  const isHospital = String(user?.role || '').toUpperCase().startsWith('HOSPITAL');
  const navLinks = ALL_LINKS.filter(link => {
    if (!user?.role) return true;
    const r = String(user.role).toUpperCase();
    if (r === 'ADMIN' || r === 'PLATFORM_ADMIN' || r === 'SUPER_ADMIN') return true;
    return link.roles.some(role => role.toUpperCase() === r);
  });

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Collapse Toggle Button */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoIconWrapper}>
          <HeartPulse size={22} />
        </div>
        {!collapsed && (
          <div>
            <h2 className={styles.logoText}>Jeevan Setu</h2>
            <span className={styles.logoSub}>Transplant Platform</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const showSection = !collapsed && link.section && link.section !== lastSection;
          lastSection = link.section ?? lastSection;
          
          let displayName = link.name;
          if (isHospital) {
            if (link.path === '/dashboard/overview') displayName = 'Dashboard';
            if (link.path === '/dashboard/hospital-registry') displayName = 'Hospital Profile';
          }

          return (
            <div key={link.path}>
              {showSection && (
                <p className={styles.sectionLabel}>{link.section}</p>
              )}
              <NavLink
                to={link.path}
                title={collapsed ? displayName : undefined}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''} ${link.isSimulator ? styles.simulator : ''}`
                }
              >
                <span className={styles.navIcon}><Icon size={18} /></span>
                {!collapsed && <span>{displayName}</span>}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        {!collapsed && (
          <>
            <div className={styles.systemStatus}>
              <span className="live-dot" />
              <span>All Systems Nominal</span>
            </div>
            <span className={styles.version}>v1.0.0-dashboard</span>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

