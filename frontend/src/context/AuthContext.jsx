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
  const [loading, setLoading] = useState(false); // CHANGED: false initially
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const reconnectAttempts = useRef(0);
  const messageHandlersRef = useRef(new Map());
  const pingIntervalRef = useRef(null);

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
    setToken(null);
    reconnectAttempts.current = 0;
    messageHandlersRef.current.clear();
  }, []);

  const addMessageHandler = useCallback((handler) => {
    const id = Date.now().toString() + Math.random().toString();
    messageHandlersRef.current.set(id, handler);
    return () => {
      messageHandlersRef.current.delete(id);
    };
  }, []);

  const connectWebSocket = useCallback((authToken) => {
    if (!authToken) return null;
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      return socketRef.current;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/${authToken}`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        reconnectAttempts.current = 0;
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        pingIntervalRef.current = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messageHandlersRef.current.forEach((handler) => {
            try {
              handler(data);
            } catch (err) {
              console.error('Error in message handler:', err);
            }
          });
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code);
        socketRef.current = null;
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (event.code !== 1000 && localStorage.getItem('access_token')) {
          const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5)));
          setTimeout(() => {
            if (localStorage.getItem('access_token')) {
              reconnectAttempts.current += 1;
              connectWebSocket(localStorage.getItem('access_token'));
            }
          }, delay);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      socketRef.current = ws;
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return null;
    }
  }, []);

  const fetchFreshUserData = useCallback(async (accessToken) => {
    if (!accessToken) return null;
    
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
    }
    return null;
  }, [clearAuthData]);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthContext: Loaded user from storage:', parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setToken(storedToken);
        
        if (parsedUser.role_type) {
          localStorage.setItem('user_role', parsedUser.role_type);
          localStorage.setItem('role_selected', 'true');
        }
        
        setTimeout(() => connectWebSocket(storedToken), 500);
      } catch (error) {
        console.error('AuthContext: Failed to parse user', error);
        clearAuthData();
      }
    }
    // REMOVED: setLoading(false) - loading is already false
  }, [connectWebSocket, clearAuthData]);

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
      
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      
      const freshUser = await fetchFreshUserData(data.access_token);
      const userData = freshUser || data.user;
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      let userRole = userData.role_type || userData.role || 'buyer';
      if (userRole === 'user') {
        userRole = 'buyer';
      }
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('role_selected', 'true');
      
      setUser(userData);
      setIsAuthenticated(true);
      
      messageHandlersRef.current.clear();
      setTimeout(() => connectWebSocket(data.access_token), 500);
      
      toast.success(`Welcome back, ${userData.full_name || userData.username}!`);
      return { success: true, user: userData, role: userRole };
      
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
    if (currentToken) {
      const freshUser = await fetchFreshUserData(currentToken);
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        let userRole = freshUser.role_type || freshUser.role || 'buyer';
        if (userRole === 'user') {
          userRole = 'buyer';
        }
        localStorage.setItem('user_role', userRole);
      }
    }
  }, [fetchFreshUserData]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    let userRole = updatedUser.role_type || updatedUser.role || 'buyer';
    if (userRole === 'user') {
      userRole = 'buyer';
    }
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('role_selected', 'true');
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    token,
    socket: socketRef.current,
    addMessageHandler,
    refreshUser,
    updateUser,
    clearAuthData,
    userRole: user?.role_type || user?.role || localStorage.getItem('user_role')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;