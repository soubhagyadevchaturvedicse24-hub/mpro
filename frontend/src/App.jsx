import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { SimulatorProvider } from './context/SimulatorContext';
import ErrorBoundary from './components/ErrorBoundary';
import { initHospitals } from './data/hospitals';
import './App.css';
import IoTRemoteControl from './components/IoTRemoteControl';

/* ── Lazy-loaded pages for code splitting ── */
const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Login'));
const RegisterHospital = lazy(() => import('./pages/RegisterHospital'));
const DashboardLayout  = lazy(() => import('./layouts/DashboardLayout'));
const ExecutiveOverview = lazy(() => import('./pages/ExecutiveOverview'));
const HospitalOverview = lazy(() => import('./pages/HospitalOverview'));
const TransportMap     = lazy(() => import('./pages/TransportMap'));
const BlockchainAudit  = lazy(() => import('./pages/BlockchainAudit'));
const SimulatorPage    = lazy(() => import('./pages/SimulatorPage'));
const DonorConsent     = lazy(() => import('./pages/DonorConsent'));
const HospitalRegistry = lazy(() => import('./pages/HospitalRegistry'));
const HospitalProfile  = lazy(() => import('./pages/HospitalProfile'));
const HospitalApprovals = lazy(() => import('./pages/HospitalApprovals'));
const CommitteeApproval = lazy(() => import('./pages/CommitteeApproval'));
const Analytics        = lazy(() => import('./pages/Analytics'));
const DataEntryHub     = lazy(() => import('./pages/DataEntryHub'));
const ApplicationStatus = lazy(() => import('./pages/ApplicationStatus'));
const SystemHealth     = lazy(() => import('./pages/SystemHealth/index.jsx'));
const TransportManagement = lazy(() => import('./pages/TransportManagement/index.jsx'));
const Incidents          = lazy(() => import('./pages/Incidents/index.jsx'));
/* ── Skeleton fallback while chunk loads ── */
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem'
  }}>
    <div style={{
      width: '36px', height: '36px',
      border: '3px solid rgba(255,255,255,0.08)',
      borderTop: '3px solid #22d3a0',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    Loading page…
  </div>
);

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    initHospitals().then(() => {
      setIsAppReady(true);
    });
  }, []);

  if (!isAppReady) {
    return <PageLoader />;
  }

  const OverviewRouter = () => {
    const { user } = useAuth();
    const role = String(user?.role || '').toUpperCase();
    const isHospital = role === 'HOSPITAL_COORDINATOR' || role === 'HOSPITAL_LO';
    
    return isHospital ? (
      <ErrorBoundary><Suspense fallback={<PageLoader />}><HospitalOverview /></Suspense></ErrorBoundary>
    ) : (
      <ErrorBoundary><Suspense fallback={<PageLoader />}><ExecutiveOverview /></Suspense></ErrorBoundary>
    );
  };

  const RegistryRouter = () => {
    const { user } = useAuth();
    const role = String(user?.role || '').toUpperCase();
    const isHospital = role === 'HOSPITAL_COORDINATOR' || role === 'HOSPITAL_LO';
    
    return isHospital ? (
      <ErrorBoundary><Suspense fallback={<PageLoader />}><HospitalProfile /></Suspense></ErrorBoundary>
    ) : (
      <ErrorBoundary><Suspense fallback={<PageLoader />}><HospitalRegistry /></Suspense></ErrorBoundary>
    );
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <SimulatorProvider>
            <Router>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register/hospital" element={<RegisterHospital />} />
                    <Route path="/register-hospital" element={<RegisterHospital />} />
                    <Route path="/hospital-register" element={<RegisterHospital />} />
                    <Route path="/application-status" element={<ApplicationStatus />} />
                    
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<OverviewRouter />} />
                      <Route path="matching" element={<Navigate to="/dashboard/overview" replace />} />
                      <Route path="transport" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><TransportMap /></Suspense></ErrorBoundary>
                      } />
                      <Route path="transport-management" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><TransportManagement /></Suspense></ErrorBoundary>
                      } />
                      <Route path="donor-consent" element={<Navigate to="/dashboard/overview" replace />} />
                      <Route path="hospital-registry" element={<RegistryRouter />} />
                      <Route path="hospital-approvals" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><HospitalApprovals /></Suspense></ErrorBoundary>
                      } />
                      <Route path="committee" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><CommitteeApproval /></Suspense></ErrorBoundary>
                      } />
                      <Route path="analytics" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><Analytics /></Suspense></ErrorBoundary>
                      } />
                      <Route path="data-entry" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><DataEntryHub /></Suspense></ErrorBoundary>
                      } />
                      <Route path="health" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><SystemHealth /></Suspense></ErrorBoundary>
                      } />
                      <Route path="audit" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><BlockchainAudit /></Suspense></ErrorBoundary>
                      } />
                      <Route path="incidents" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><Incidents /></Suspense></ErrorBoundary>
                      } />
                      <Route path="simulator" element={
                        <ErrorBoundary><Suspense fallback={<PageLoader />}><SimulatorPage /></Suspense></ErrorBoundary>
                      } />
                    </Route>
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Router>
          <IoTRemoteControl />
          </SimulatorProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
