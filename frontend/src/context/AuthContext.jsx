import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api','') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const messageHandlersRef = useRef(new Map());
  const pingIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  
  const isProduction = window.location.hostname !== 'localhost';
  const [webSocketEnabled, setWebSocketEnabled] = useState(() => {
    if (isProduction) {
      console.log('🔌 WebSocket disabled on production to prevent connection loops');
      return false;
    }
    const savedSetting = localStorage.getItem('webSocketEnabled');
    return savedSetting === 'true';
  });

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('role_selected');
    localStorage.removeItem('seller_days_remaining');
    localStorage.removeItem('seller_has_active_subscription');
    localStorage.removeItem('activation_status');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('user_role');
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setIsInitialized(false);
    setAuthReady(false);
    setToken(null);
    reconnectAttempts.current = 0;
    messageHandlersRef.current.clear();
    isRefreshingRef.current = false;
    refreshInProgressRef.current = false;
  }, []);

  const addMessageHandler = useCallback((handler) => {
    const id = Date.now().toString() + Math.random().toString();
    messageHandlersRef.current.set(id, handler);
    return () => {
      messageHandlersRef.current.delete(id);
    };
  }, []);

  const connectWebSocket = useCallback((authToken) => {
    if (isProduction) return null;
    if (!authToken || !webSocketEnabled) return null;
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setWebSocketEnabled(false);
      return null;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }
    
    const wsUrl = `${WS_URL}/ws/${encodeURIComponent(authToken)}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        reconnectAttempts.current = 0;
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageHandlersRef.current.forEach((handler) => {
            try { handler(data); } catch (err) { console.error('Handler error:', err); }
          });
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => console.error('❌ WebSocket error:', error);
      
      ws.onclose = (event) => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (authToken && webSocketEnabled && reconnectAttempts.current < maxReconnectAttempts) {
              connectWebSocket(authToken);
            }
          }, 10000);
        }
      };
      
      socketRef.current = ws;
      return ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      return null;
    }
  }, [webSocketEnabled, isProduction]);

  const fetchUserDirectly = useCallback(async (accessToken) => {
    if (!accessToken) return null;
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // ✅ CRITICAL FIX: Ensure these boolean fields are explicitly set
        // so the frontend doesn't see undefined
        const normalizedUser = {
          ...userData,
          is_activated: userData.is_activated ?? false,
          can_create_listings: userData.can_create_listings ?? false,
          has_active_subscription: userData.has_active_subscription ?? false,
          payment_approved: userData.payment_approved ?? false
        };

        if (userData.subscription_end_date) {
          const endDate = new Date(userData.subscription_end_date);
          const now = new Date();
          const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          localStorage.setItem('seller_days_remaining', daysRemaining > 0 ? daysRemaining.toString() : '0');
          localStorage.setItem('seller_has_active_subscription', (normalizedUser.can_create_listings && daysRemaining > 0) ? 'true' : 'false');
        }
        
        return normalizedUser;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Direct user fetch error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      
      if (storedToken) {
        setIsAuthenticated(true);
        setToken(storedToken);
        
        const freshUser = await fetchUserDirectly(storedToken);
        
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          sessionStorage.setItem('user', JSON.stringify(freshUser));
          const userRole = freshUser.role_type || freshUser.role || 'buyer';
          const normalizedRole = userRole === 'user' ? 'buyer' : userRole;
          localStorage.setItem('user_role', normalizedRole);
          localStorage.setItem('role_selected', 'true');
          setAuthReady(true);
        } else {
          clearAuthData();
          setAuthReady(true);
        }
        
        if (webSocketEnabled && !isProduction) {
          setTimeout(() => connectWebSocket(storedToken), 1000);
        }
      } else {
        setAuthReady(true);
      }
      setLoading(false);
      setIsInitialized(true);
    };
    
    initAuth();
  }, [clearAuthData, connectWebSocket, fetchUserDirectly, isInitialized, webSocketEnabled, isProduction]);

  const setAuthData = useCallback((accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user_role', userData.role_type || 'dual');
    localStorage.setItem('role_selected', 'true');
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('user_role', userData.role_type || 'dual');
    
    setUser(userData);
    setIsAuthenticated(true);
    setToken(accessToken);
    setAuthReady(true);
    
    if (webSocketEnabled && !isProduction) {
      setTimeout(() => connectWebSocket(accessToken), 1000);
    }
  }, [connectWebSocket, webSocketEnabled, isProduction]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Invalid credentials');
      
      setAuthData(data.access_token, data.user);
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`);
      return { success: true, user: data.user, role: data.user.role_type };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(() => {
    clearAuthData();
    toast.success('Logged out successfully');
    window.location.href = '/login';
  }, [clearAuthData]);

  const register = async (userData, role = 'user') => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          username: userData.username,
          password: userData.password,
          full_name: userData.full_name,
          phone: userData.phone || '',
          role_type: role
        })
      });
      const data = await response.json();
      if (!data.id) throw new Error(data.detail || 'Registration failed');
      toast.success('Registration successful! Please login.');
      return { success: true, data };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return null;
    if (refreshInProgressRef.current) return null;
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) return null;
    
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    
    try {
      const freshUser = await fetchUserDirectly(currentToken);
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        sessionStorage.setItem('user', JSON.stringify(freshUser));
        const userRole = freshUser.role_type || freshUser.role || 'buyer';
        localStorage.setItem('user_role', userRole === 'user' ? 'buyer' : userRole);
        return freshUser;
      }
      return null;
    } finally {
      setTimeout(() => { refreshInProgressRef.current = false; }, 1000);
    }
  }, [fetchUserDirectly]);

  const forceRefreshUser = useCallback(async () => await refreshUser(), [refreshUser]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    let userRole = updatedUser.role_type || updatedUser.role || 'buyer';
    if (userRole === 'user') userRole = 'buyer';
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('role_selected', 'true');
    return updatedUser;
  }, []);

  useEffect(() => {
    const handleUserUpdated = async (event) => {
      const updatedUser = event?.detail;
      if (updatedUser && typeof updatedUser === 'object') {
        setUser(updatedUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        let userRole = updatedUser.role_type || updatedUser.role || 'buyer';
        if (userRole === 'user') userRole = 'buyer';
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('role_selected', 'true');
        return;
      }
      await refreshUser();
    };
    window.addEventListener('user:updated', handleUserUpdated);
    return () => window.removeEventListener('user:updated', handleUserUpdated);
  }, [refreshUser]);

  const value = {
    user,
    loading,
    isAuthenticated,
    isInitialized,
    authReady,
    login,
    logout,
    register,
    token,
    socket: socketRef.current,
    addMessageHandler,
    refreshUser,
    forceRefreshUser,
    updateUser,
    clearAuthData,
    setAuthData,
    userRole: user?.role_type || user?.role || localStorage.getItem('user_role'),
    webSocketEnabled
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
