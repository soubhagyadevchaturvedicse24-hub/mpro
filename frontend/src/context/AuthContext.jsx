import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('neolife_user');
    const storedToken = localStorage.getItem('neolife_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setTokenState(storedToken);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // DEMO BYPASS: Intercept demo credentials and allow login
      if (password === 'demo123' || password === 'network123' || password === 'aiims123aiims') {
        let assignedRole = 'PLATFORM_ADMIN';
        let assignedName = 'System Admin';
        
        if (email.includes('network') || email.includes('gov')) {
          assignedRole = 'PLATFORM_ADMIN'; // Network staff use the admin dashboard
          assignedName = 'Network Official';
        } else if (email.includes('aiims') || email.includes('hospital')) {
          assignedRole = 'HOSPITAL_COORDINATOR';
          assignedName = 'Hospital Staff';
        }

        const dummyUser = { 
          id: 'demo-user-1', 
          role: assignedRole, 
          name: assignedName,
          email: email
        };
        const token = 'demo-mock-token-12345';
        
        setUser(dummyUser);
        setTokenState(token);
        localStorage.setItem('neolife_user', JSON.stringify(dummyUser));
        localStorage.setItem('neolife_token', token);
        return dummyUser;
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://v1-organ-transport-system.onrender.com/api/v1';
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');

      const loggedInUser = result.data.user;
      const token = result.data.accessToken;

      setUser(loggedInUser);
      setTokenState(token);
      localStorage.setItem('neolife_user', JSON.stringify(loggedInUser));
      localStorage.setItem('neolife_token', token);
      
      return loggedInUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    localStorage.removeItem('neolife_user');
    localStorage.removeItem('neolife_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
