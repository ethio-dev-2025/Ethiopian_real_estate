// src/context/AuthContext.jsx
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
  const messageHandlersRef = useRef(new Map());
  const pingIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const [webSocketEnabled, setWebSocketEnabled] = useState(true);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('role_selected');
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
    if (!authToken || !webSocketEnabled) {
      console.log('🔌 WebSocket not enabled or no token');
      return null;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected');
      return socketRef.current;
    }
    
    const wsUrl = `${WS_URL}/ws/payments?token=${encodeURIComponent(authToken)}`;
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
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (authToken && webSocketEnabled) {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connectWebSocket(authToken);
          }
        }, 5000);
      };
      
      socketRef.current = ws;
      return ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      return null;
    }
  }, [webSocketEnabled]);

  const fetchWithTimeout = async (input, init = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

  // DIRECT API CALL to get user data - most reliable method
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

  // Initialize auth from localStorage - FIXED (only runs once)
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
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          sessionStorage.setItem('user', JSON.stringify(freshUser));
          
          const userRole = freshUser.role_type || freshUser.role || 'buyer';
          const normalizedRole = userRole === 'user' ? 'buyer' : userRole;
          localStorage.setItem('user_role', normalizedRole);
          localStorage.setItem('role_selected', 'true');
          setAuthReady(true);
        } else {
          console.error('AuthContext: Failed to fetch user, clearing auth');
          clearAuthData();
          setAuthReady(true);
        }
        
        setTimeout(() => {
          connectWebSocket(storedToken);
        }, 1000);
        
      } else {
        setAuthReady(true);
      }
      
      setLoading(false);
      setIsInitialized(true);
    };
    
    initAuth();
  }, [clearAuthData, connectWebSocket, fetchUserDirectly, isInitialized]);

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
    
    setTimeout(() => {
      connectWebSocket(accessToken);
    }, 1000);
  }, [connectWebSocket]);

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('role_selected');
    sessionStorage.clear();
    
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

  // FIXED: refreshUser with rate limiting to prevent infinite loops
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('access_token');
    if (!currentToken) return null;
    
    // Prevent multiple simultaneous refreshes
    if (refreshInProgressRef.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return null;
    }
    
    // Rate limit refreshes to once every 2 seconds
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
    userRole: user?.role_type || user?.role || localStorage.getItem('user_role')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;