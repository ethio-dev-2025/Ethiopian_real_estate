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

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('role_selected');
    
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
  }, []);

  const addMessageHandler = useCallback((handler) => {
    const id = Date.now().toString() + Math.random().toString();
    messageHandlersRef.current.set(id, handler);
    return () => {
      messageHandlersRef.current.delete(id);
    };
  }, []);

  // FIX 1: DISABLE WEBSOCKET COMPLETELY - COMMENTED OUT
  const connectWebSocket = useCallback((authToken) => {
    // WEBSOCKET DISABLED - Performance improvement
    console.log('🔌 WebSocket is disabled for performance');
    return null;
  }, []);

  const fetchFreshUserData = useCallback(async (accessToken) => {
    if (!accessToken) return null;
    if (isRefreshingRef.current) return null;
    
    isRefreshingRef.current = true;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const freshUser = await response.json();
        console.log('📦 Fresh user data from API:', freshUser);
        return freshUser;
      } else if (response.status === 401) {
        console.log('Token expired, clearing auth data');
        clearAuthData();
        return null;
      }
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
    } finally {
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 500);
    }
    return null;
  }, [clearAuthData]);

  // Initialize auth from localStorage - ONLY ONCE
  useEffect(() => {
    if (isInitialized) return;
    
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('AuthContext: Loaded user from storage:', parsedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setToken(storedToken);
          setAuthReady(true);
          
          if (parsedUser.role_type) {
            localStorage.setItem('user_role', parsedUser.role_type);
            localStorage.setItem('role_selected', 'true');
          }
          
          // WebSocket disabled - no connection attempt
          // setTimeout(() => connectWebSocket(storedToken), 1000);
        } catch (error) {
          console.error('AuthContext: Failed to parse user', error);
          clearAuthData();
        }
      } else {
        setAuthReady(true);
      }
      setLoading(false);
      setIsInitialized(true);
    };
    
    initAuth();
  }, [connectWebSocket, clearAuthData, isInitialized]);

  const setAuthData = useCallback((accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user_role', userData.role_type || 'dual');
    localStorage.setItem('role_selected', 'true');
    
    setUser(userData);
    setIsAuthenticated(true);
    setToken(accessToken);
    setAuthReady(true);
    
    // WebSocket disabled - no connection attempt
    // setTimeout(() => connectWebSocket(accessToken), 1000);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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

  const logout = () => {
    clearAuthData();
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

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
    if (isRefreshingRef.current) return null;
    
    isRefreshingRef.current = true;
    
    try {
      const freshUser = await fetchFreshUserData(currentToken);
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        let userRole = freshUser.role_type || freshUser.role || 'buyer';
        if (userRole === 'user') userRole = 'buyer';
        localStorage.setItem('user_role', userRole);
        console.log('🔄 User refreshed:', freshUser);
        return freshUser;
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 500);
    }
    return null;
  }, [fetchFreshUserData]);

  const updateUser = useCallback((updatedUser) => {
    console.log('🔄 Updating user in context:', updatedUser);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    let userRole = updatedUser.role_type || updatedUser.role || 'buyer';
    if (userRole === 'user') userRole = 'buyer';
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('role_selected', 'true');
    
    return updatedUser;
  }, []);

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