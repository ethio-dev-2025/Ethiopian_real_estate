// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || !user.id) {
      console.log('No token or user, skipping socket connection')
      return
    }

    // Connect to WebSocket server
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully')
      setIsConnected(true)
      
      // Join user's room
      newSocket.emit('join', { user_id: user.id })
      
      toast.success('Real-time connected', { icon: '🔌', duration: 2000 })
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Listen for new payment notifications (for admin)
    newSocket.on('new_payment', (data) => {
      console.log('💰 New payment notification:', data)
      
      // Add to notifications
      setNotifications(prev => [{
        id: Date.now(),
        type: 'payment',
        title: 'New Payment Received',
        message: `${data.user_name} just paid for ${data.plan_type} plan`,
        amount: data.amount,
        user_name: data.user_name,
        plan_type: data.plan_type,
        payment_id: data.payment_id,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
      
      setUnreadCount(prev => prev + 1)
      
      // Show toast notification
      toast.success(
        <div>
          <p className="font-semibold">💰 New Payment!</p>
          <p className="text-sm">{data.user_name} paid {data.plan_type} plan</p>
          <p className="text-xs text-green-600">ETB {data.amount?.toLocaleString()}</p>
        </div>,
        { duration: 10000 }
      )
    })

    // Listen for account activation notifications
    newSocket.on('account_activated', (data) => {
      console.log('✅ Account activated notification:', data)
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'activation',
        title: 'Account Activated!',
        message: data.message || 'Your account has been activated',
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
      
      setUnreadCount(prev => prev + 1)
      
      toast.success(
        <div>
          <p className="font-semibold">✅ Account Activated!</p>
          <p className="text-sm">You can now create listings</p>
        </div>,
        { duration: 5000 }
      )
    })

    // Listen for payment approval notifications
    newSocket.on('payment_approved', (data) => {
      console.log('✅ Payment approved notification:', data)
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'approval',
        title: 'Payment Approved',
        message: `Your ${data.plan_type} plan payment has been approved`,
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
      
      setUnreadCount(prev => prev + 1)
      
      toast.success(
        <div>
          <p className="font-semibold">✅ Payment Approved!</p>
          <p className="text-sm">Your account is now active</p>
        </div>,
        { duration: 5000 }
      )
    })

    // Listen for payment rejection notifications
    newSocket.on('payment_rejected', (data) => {
      console.log('❌ Payment rejected notification:', data)
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'rejection',
        title: 'Payment Rejected',
        message: data.message || `Your payment was rejected: ${data.reason}`,
        reason: data.reason,
        read: false,
        timestamp: new Date().toISOString()
      }, ...prev])
      
      setUnreadCount(prev => prev + 1)
      
      toast.error(
        <div>
          <p className="font-semibold">❌ Payment Rejected</p>
          <p className="text-sm">{data.reason || 'Please contact support'}</p>
        </div>,
        { duration: 8000 }
      )
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    }
  }, [isConnected])

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    emit,
    on,
    off
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}