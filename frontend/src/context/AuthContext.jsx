import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const doLogout = useCallback(() => {
    setUser(null);
    setTokenState(null);
    localStorage.removeItem('neolife_user');
    localStorage.removeItem('neolife_token');
  }, []);

  // Try to silently refresh the token using the httpOnly refresh cookie
  const tryRefreshToken = useCallback(async () => {
    try {
      const { getBaseUrl } = await import('../services/api');
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends httpOnly refreshToken cookie
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const result = await res.json();
        const newToken = result?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('neolife_token', newToken);
          setTokenState(newToken);
          return newToken;
        }
      }
    } catch (e) {
      console.warn('Token refresh failed:', e);
    }
    return null;
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('neolife_user');
    const storedToken = localStorage.getItem('neolife_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setTokenState(storedToken);

        // If it's a mock token, we need a real one — try refresh silently
        if (storedToken.startsWith('mock-token-')) {
          tryRefreshToken();
        }
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, [tryRefreshToken]);

  // Auto-refresh token every 10 minutes to prevent expiry mid-session
  useEffect(() => {
    if (!token || token.startsWith('mock-token-')) return;
    const interval = setInterval(() => {
      tryRefreshToken();
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, [token, tryRefreshToken]);

  const login = async (email, password) => {
    try {
      const { getBaseUrl } = await import('../services/api');
      const baseUrl = getBaseUrl();
      let loggedInUser = null;
      let accessToken = null;

      // Always try real backend first
      try {
        const response = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          credentials: 'include', // capture httpOnly refresh cookie
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        if (response.ok && result.data) {
          loggedInUser = result.data.user;
          accessToken = result.data.accessToken;
        } else if (!response.ok) {
          // Backend explicitly rejected — throw the real error
          throw new Error(result?.message || result?.error || `Login failed (${response.status})`);
        }
      } catch (err) {
        // Only fall through to mock if it's a network error (backend offline)
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          console.warn('Backend offline — falling back to local auth.');
        } else {
          throw err; // Re-throw real backend rejections
        }
      }

      // Fallback: local hospital/admin lookup ONLY when backend is unreachable
      if (!loggedInUser) {
        const { getALLHospitals } = await import('../data/hospitals');
        const allHospitals = getALLHospitals();
        const cleanEmail = (email || '').toLowerCase().trim();

        let matched = allHospitals.find(h => {
          const e1 = (h.loginEmail || '').toLowerCase();
          const e2 = (h.officialEmail || '').toLowerCase();
          const e3 = (h.contact?.email || '').toLowerCase();
          return e1 === cleanEmail || e2 === cleanEmail || e3 === cleanEmail;
        });

        if (!matched && cleanEmail) {
          matched = allHospitals.find(h => {
            const hName = (h.name || h.hospitalLegalName || '').toLowerCase();
            const firstWord = hName.split(' ')[0];
            return firstWord.length > 2 && cleanEmail.includes(firstWord);
          });
        }

        const isNodalAdmin = cleanEmail.includes('notto') || cleanEmail.includes('sotto') || cleanEmail.includes('rotto') || cleanEmail.includes('admin');

        if (matched && !isNodalAdmin) {
          const status = (matched.status || '').toUpperCase();
          if (status !== 'APPROVED' && status !== 'ACTIVE') {
            throw new Error(`Hospital registration is ${status.replace('_', ' ').toLowerCase() || 'pending'}. Access denied.`);
          }
          loggedInUser = {
            id: matched.id || matched._id,
            name: matched.displayName || matched.name || matched.hospitalLegalName,
            email,
            role: 'HOSPITAL_LO',
            hospitalId: matched.id || matched._id,
            hospitalName: matched.name || matched.hospitalLegalName,
            status: matched.status || 'APPROVED'
          };
          accessToken = `mock-token-${Date.now()}`;
        } else if (isNodalAdmin) {
          const role = cleanEmail.includes('admin@platform') ? 'PLATFORM_ADMIN' : 'NOTTO_OFFICER';
          loggedInUser = {
            id: 'usr-admin',
            name: role === 'PLATFORM_ADMIN' ? 'Platform Administrator' : 'NOTTO Central Nodal Officer',
            email,
            role,
            hospitalName: 'NOTTO Headquarters'
          };
          accessToken = `mock-token-${Date.now()}`;
        } else {
          throw new Error('Invalid credentials or unregistered entity.');
        }
      }

      setUser(loggedInUser);
      setTokenState(accessToken);
      localStorage.setItem('neolife_user', JSON.stringify(loggedInUser));
      localStorage.setItem('neolife_token', accessToken);
      return loggedInUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    doLogout();
    // Also clear backend session cookie
    import('../services/api').then(({ getBaseUrl }) => {
      fetch(`${getBaseUrl()}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, tryRefreshToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
