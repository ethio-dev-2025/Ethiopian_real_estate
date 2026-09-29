import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';
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
    if (isProduction) {
      return null;
    }
    
    if (!authToken || !webSocketEnabled) {
      return null;
    }
    
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log(`🔌 Max WebSocket retry attempts reached. Stopping reconnection.`);
      setWebSocketEnabled(false);
      return null;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }
    
    const wsUrl = `${WS_URL}/ws/${encodeURIComponent(authToken)}`;
    console.log('🔌 Connecting WebSocket to:', wsUrl);
    
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
          console.log('📨 WebSocket message received:', data.type);
          
          messageHandlersRef.current.forEach((handler) => {
            try {
              handler(data);
            } catch (err) {
              console.error('Handler error:', err);
            }
          });
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (code: ${event.code})`);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts.current < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectAttempts.current++;
          const delay = 10000;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (authToken && webSocketEnabled && reconnectAttempts.current < maxReconnectAttempts) {
              console.log(`🔄 Attempting to reconnect WebSocket (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
              connectWebSocket(authToken);
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log(`🔌 Max reconnection attempts reached. WebSocket disabled.`);
          setWebSocketEnabled(false);
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
    
    console.log('🔄 Fetching user directly from /api/auth/me...');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Direct user fetch successful:', userData);
        console.log('📌 User role_type:', userData.role_type);
        
        if (userData.subscription_end_date) {
          const endDate = new Date(userData.subscription_end_date);
          const now = new Date();
          const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
          localStorage.setItem('seller_days_remaining', daysRemaining > 0 ? daysRemaining.toString() : '0');
          localStorage.setItem('seller_has_active_subscription', (userData.can_create_listings && daysRemaining > 0) ? 'true' : 'false');
        }
        
        return userData;
      } else {
        console.error('Direct user fetch failed with status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Direct user fetch error:', error);
      return null;
    }
  }, []);

  // Initialize auth from localStorage
  useEffect(() => {
    if (isInitialized) return;
    
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      
      if (storedToken) {
        console.log('AuthContext: Token found, fetching fresh user data from API...');
        
        setIsAuthenticated(true);
        setToken(storedToken);
        
        const freshUser = await fetchUserDirectly(storedToken);
        
        if (freshUser) {
          console.log('AuthContext: Fresh user from API:', freshUser);
          console.log('AuthContext: User role_type:', freshUser.role_type);
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          sessionStorage.setItem('user', JSON.stringify(freshUser));
          
          const userRole = freshUser.role_type || freshUser.role || 'buyer';
          const normalizedRole = userRole === 'user' ? 'buyer' : userRole;
          localStorage.setItem('user_role', normalizedRole);
          
          // FIXED: If user is admin, automatically set role_selected to true
          if (normalizedRole === 'admin') {
            localStorage.setItem('role_selected', 'true');
            console.log('✅ Admin user detected, role_selected set to true');
          } else {
            localStorage.setItem('role_selected', 'true');
          }
          
          setAuthReady(true);
        } else {
          console.error('AuthContext: Failed to fetch user, clearing auth');
          clearAuthData();
          setAuthReady(true);
        }
        
        if (webSocketEnabled && !isProduction) {
          setTimeout(() => {
            connectWebSocket(storedToken);
          }, 1000);
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
    console.log('🔐 setAuthData called with user:', userData);
    console.log('📌 User role_type:', userData.role_type);
    
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
      setTimeout(() => {
        connectWebSocket(accessToken);
      }, 1000);
    }
  }, [connectWebSocket, webSocketEnabled, isProduction]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }
      
      const userData = data.user;
      const accessToken = data.access_token;
      
      console.log('📌 Login response user role:', userData.role_type);
      
      setAuthData(accessToken, userData);
      
      toast.success(`Welcome back, ${userData.full_name || userData.username}!`);
      return { success: true, user: userData, role: userData.role_type };
      
    } catch (error) {
      console.error('❌ Login error:', error);
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
      
      if (!data.id) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      toast.success('Registration successful! Please login.');
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return null;
    
    if (refreshInProgressRef.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return null;
    }
    
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      console.log('⏳ Rate limiting refresh, skipping...');
      return null;
    }
    
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    
    try {
      console.log('🔄 Refreshing user...');
      const freshUser = await fetchUserDirectly(currentToken);
      
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        sessionStorage.setItem('user', JSON.stringify(freshUser));
        const userRole = freshUser.role_type || freshUser.role || 'buyer';
        const normalizedRole = userRole === 'user' ? 'buyer' : userRole;
        localStorage.setItem('user_role', normalizedRole);
        
        // FIXED: If user is admin, ensure role_selected is true
        if (normalizedRole === 'admin') {
          localStorage.setItem('role_selected', 'true');
        }
        
        console.log('✅ User refreshed:', freshUser);
        return freshUser;
      }
      return null;
    } finally {
      setTimeout(() => {
        refreshInProgressRef.current = false;
      }, 1000);
    }
  }, [fetchUserDirectly]);

  const forceRefreshUser = useCallback(async () => {
    return await refreshUser();
  }, [refreshUser]);

  const updateUser = useCallback((updatedUser) => {
    console.log('🔄 Updating user in context:', updatedUser);
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
        console.log('AuthContext: user updated from event', updatedUser);
        return;
      }

      console.log('AuthContext: user:update event received, refreshing user');
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