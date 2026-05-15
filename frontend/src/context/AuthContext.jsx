import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const reconnectAttempts = useRef(0)
  const messageHandlersRef = useRef(new Map())
  const pingIntervalRef = useRef(null)

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_role')
    
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    setUser(null)
    setIsAuthenticated(false)
    setToken(null)
    reconnectAttempts.current = 0
    messageHandlersRef.current.clear()
  }, [])

  const addMessageHandler = useCallback((handler) => {
    const id = Date.now().toString() + Math.random().toString()
    messageHandlersRef.current.set(id, handler)
    console.log(`📝 Added message handler, total: ${messageHandlersRef.current.size}`)
    
    return () => {
      messageHandlersRef.current.delete(id)
      console.log(`🗑️ Removed message handler, total: ${messageHandlersRef.current.size}`)
    }
  }, [])

  const connectWebSocket = useCallback((authToken) => {
    if (!authToken) return null
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected')
      return socketRef.current
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket already connecting...')
      return socketRef.current
    }
    
    if (socketRef.current) {
      console.log('🔌 Closing existing WebSocket connection')
      socketRef.current.close()
      socketRef.current = null
    }
    
    console.log('🔌 Creating new WebSocket connection...')
    
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/${authToken}`)
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        reconnectAttempts.current = 0
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        
        pingIntervalRef.current = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', data.type)
          
          messageHandlersRef.current.forEach((handler) => {
            try {
              handler(data)
            } catch (err) {
              console.error('Error in message handler:', err)
            }
          })
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        socketRef.current = null
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        if (event.code !== 1000 && localStorage.getItem('access_token')) {
          const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(reconnectAttempts.current, 5)))
          console.log(`🔄 Reconnecting WebSocket in ${delay}ms...`)
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (localStorage.getItem('access_token')) {
              reconnectAttempts.current += 1
              connectWebSocket(localStorage.getItem('access_token'))
            }
          }, delay)
        }
      }
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }
      
      socketRef.current = ws
      return ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      return null
    }
  }, [])

  const fetchFreshUserData = useCallback(async (accessToken) => {
    if (!accessToken) return null
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const freshUser = await response.json()
        console.log('📦 Fresh user data from API:', freshUser)
        return freshUser
      } else if (response.status === 401) {
        console.log('Token expired, clearing auth data')
        clearAuthData()
        return null
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching fresh user data:', error)
      }
    }
    return null
  }, [clearAuthData])

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('AuthContext: Loaded user from storage:', parsedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
        setToken(storedToken)
        setTimeout(() => connectWebSocket(storedToken), 500)
      } catch (error) {
        console.error('AuthContext: Failed to parse user', error)
        clearAuthData()
      }
    }
    setLoading(false)
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      messageHandlersRef.current.clear()
    }
  }, [connectWebSocket, clearAuthData])

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt for:', email)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      const data = await response.json()
      console.log('📦 Login response:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid credentials')
      }
      
      localStorage.setItem('access_token', data.access_token)
      setToken(data.access_token)
      
      const freshUser = await fetchFreshUserData(data.access_token)
      const userData = freshUser || data.user
      console.log('📦 Final user data to store:', userData)
      
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('user_role', userData.role_type || 'user')
      
      setUser(userData)
      setIsAuthenticated(true)
      
      messageHandlersRef.current.clear()
      setTimeout(() => connectWebSocket(data.access_token), 500)
      
      toast.success(`Welcome back, ${userData.full_name || userData.username}!`)
      return { success: true, user: userData }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      if (error.name === 'AbortError') {
        toast.error('Request timeout. Please try again.')
      } else {
        toast.error(error.message)
      }
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    clearAuthData()
    toast.success('Logged out successfully')
    window.location.href = '/login'
  }

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
          phone: userData.phone || ''
        })
      })
      
      const data = await response.json()
      
      if (!data.id) {
        throw new Error(data.detail || 'Registration failed')
      }
      
      toast.success('Registration successful! Please login.')
      return { success: true, data }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  }

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('access_token')
    if (currentToken) {
      const freshUser = await fetchFreshUserData(currentToken)
      if (freshUser) {
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
        localStorage.setItem('user_role', freshUser.role_type || 'user')
      }
    }
  }, [fetchFreshUserData])

  const updateUser = useCallback((updatedUser) => {
    console.log('Updating user:', updatedUser)
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    localStorage.setItem('user_role', updatedUser.role_type || 'user')
  }, [])

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
    clearAuthData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider