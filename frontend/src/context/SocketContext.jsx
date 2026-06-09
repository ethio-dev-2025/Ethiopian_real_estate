// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)
  const eventHandlersRef = useRef(new Map())
  const [webSocketEnabled, setWebSocketEnabled] = useState(true)

  useEffect(() => {
    if (!webSocketEnabled) {
      console.log('🔌 WebSocket is disabled')
      return
    }

    const token = localStorage.getItem('access_token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || !user.id) {
      console.log('No token or user, skipping socket connection')
      return
    }

    // ✅ Correct WebSocket URL - matches backend /ws/{token}
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
    const websocketUrl = `${wsBaseUrl}/${encodeURIComponent(token)}`
    console.log('🔌 Connecting to WebSocket:', websocketUrl)
    
    const newSocket = new WebSocket(websocketUrl)

    eventHandlersRef.current = new Map()

    newSocket.onopen = () => {
      console.log('✅ WebSocket connected successfully')
      setIsConnected(true)
      toast.success('Real-time connected', { icon: '🔌', duration: 2000 })
    }

    newSocket.onclose = (closeEvent) => {
      console.log('🔌 WebSocket disconnected', closeEvent)
      setIsConnected(false)
    }

    newSocket.onerror = (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    }

    newSocket.onmessage = async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)
        const { type, ...payload } = data
        console.log('📨 WebSocket message received:', type)

        const handlers = eventHandlersRef.current.get(type) || []
        handlers.forEach((handler) => handler(payload))

        switch (type) {
          // Step 2: New message received by User B
          case 'new_message':
            console.log('📨 New message received:', payload.message)
            window.dispatchEvent(new CustomEvent('new_chat_message', { detail: payload.message }))
            
            // Auto-send delivered receipt
            if (socketRef.current?.readyState === WebSocket.OPEN && payload.message) {
              socketRef.current.send(JSON.stringify({
                type: 'message_delivered',
                message_id: payload.message.id,
                sender_id: payload.message.sender_id
              }))
              console.log(`📤 Sent delivered receipt for message ${payload.message.id}`)
            }
            
            if (payload.message) {
              window.dispatchEvent(new CustomEvent('new_chat_message_notification', {
                detail: {
                  message: payload.message,
                  sender_id: payload.message.sender_id,
                  sender_name: payload.message.sender_name,
                  sender_role: payload.message.sender_role
                }
              }))
            }
            break
            
          // Step 3: Message sent confirmation to User A (Single gray check)
          case 'message_sent':
            console.log('✅ Message sent confirmation:', payload.message)
            window.dispatchEvent(new CustomEvent('message_sent', { detail: payload.message }))
            break
            
          // Step 5: Delivered receipt to User A (Gray double check)
          case 'message_delivered':
            console.log('📦 Message delivered receipt:', payload)
            window.dispatchEvent(new CustomEvent('message_delivered', { 
              detail: { 
                message_id: payload.message_id,
                status: 'delivered'
              } 
            }))
            break
            
          // Step 8: Read receipt to User A (Blue double check)
          case 'messages_read':
            console.log('📖 Messages read event received:', payload)
            window.dispatchEvent(new CustomEvent('messages_read', { 
              detail: { 
                reader_id: payload.reader_id, 
                sender_id: payload.sender_id,
                read_at: payload.read_at 
              } 
            }))
            break
            
          // Handle read_receipt events from backend
          case 'read_receipt':
            console.log('📖 Read receipt received:', payload)
            window.dispatchEvent(new CustomEvent('messages_read', { 
              detail: { 
                reader_id: payload.reader_id, 
                sender_id: payload.sender_id,
                read_at: payload.read_at 
              } 
            }))
            break
            
          case 'typing':
            window.dispatchEvent(new CustomEvent('user_typing', { detail: payload }))
            break
            
          case 'user_status':
            window.dispatchEvent(new CustomEvent('user_status_change', { detail: payload }))
            break
            
          case 'connection_established':
            console.log('🔌 Connection established with server')
            break
            
          case 'new_payment':
            setNotifications((prev) => [{
              id: Date.now(),
              type: 'payment',
              title: 'New Payment Received',
              message: `${payload.user_name} just paid for ${payload.plan_type} plan`,
              amount: payload.amount,
              user_name: payload.user_name,
              plan_type: payload.plan_type,
              payment_id: payload.payment_id,
              timestamp: new Date().toISOString(),
              read: false,
            }, ...prev])
            setUnreadCount((prev) => prev + 1)
            toast.success(
              <div>
                <p className="font-semibold">💰 New Payment!</p>
                <p className="text-sm">{payload.user_name} paid {payload.plan_type} plan</p>
                <p className="text-xs text-green-600">ETB {payload.amount?.toLocaleString()}</p>
              </div>,
              { duration: 10000 }
            )
            break
            
          case 'account_activated':
            setNotifications((prev) => [{
              id: Date.now(),
              type: 'activation',
              title: 'Account Activated!',
              message: payload.message || 'Your account has been activated',
              read: false,
              timestamp: new Date().toISOString(),
            }, ...prev])
            setUnreadCount((prev) => prev + 1)
            try {
              const token = localStorage.getItem('access_token')
              if (token) {
                const resp = await fetch('http://localhost:8000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                if (resp.ok) {
                  const freshUser = await resp.json()
                  localStorage.setItem('user', JSON.stringify(freshUser))
                  window.dispatchEvent(new CustomEvent('user:updated', { detail: freshUser }))
                }
              }
            } catch (err) {
              console.error('Failed to refresh user after activation:', err)
            }
            toast.success(
              <div>
                <p className="font-semibold">✅ Account Activated!</p>
                <p className="text-sm">You can now create listings</p>
              </div>,
              { duration: 5000 }
            )
            break
            
          case 'payment_approved':
            setNotifications((prev) => [{
              id: Date.now(),
              type: 'approval',
              title: 'Payment Approved',
              message: `Your ${payload.plan_type} plan payment has been approved`,
              read: false,
              timestamp: new Date().toISOString(),
            }, ...prev])
            setUnreadCount((prev) => prev + 1)
            try {
              const token = localStorage.getItem('access_token')
              if (token) {
                const resp = await fetch('http://localhost:8000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                if (resp.ok) {
                  const freshUser = await resp.json()
                  localStorage.setItem('user', JSON.stringify(freshUser))
                  window.dispatchEvent(new CustomEvent('user:updated', { detail: freshUser }))
                }
              }
            } catch (err) {
              console.error('Failed to refresh user after payment approval:', err)
            }
            toast.success(
              <div>
                <p className="font-semibold">✅ Payment Approved!</p>
                <p className="text-sm">Your account is now active</p>
              </div>,
              { duration: 5000 }
            )
            break
            
          case 'payment_rejected':
            setNotifications((prev) => [{
              id: Date.now(),
              type: 'rejection',
              title: 'Payment Rejected',
              message: payload.message || `Your payment was rejected: ${payload.reason}`,
              reason: payload.reason,
              read: false,
              timestamp: new Date().toISOString(),
            }, ...prev])
            setUnreadCount((prev) => prev + 1)
            toast.error(
              <div>
                <p className="font-semibold">❌ Payment Rejected</p>
                <p className="text-sm">{payload.reason || 'Please contact support'}</p>
              </div>,
              { duration: 8000 }
            )
            break
            
          default:
            break
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [webSocketEnabled])

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

  const emit = useCallback((event, data = {}) => {
    if (socketRef.current && isConnected) {
      const payload = JSON.stringify({ type: event, ...data })
      socketRef.current.send(payload)
    } else {
      console.log(`WebSocket not connected, cannot emit: ${event}`)
    }
  }, [isConnected])

  const on = useCallback((event, callback) => {
    const handlers = eventHandlersRef.current.get(event) || []
    eventHandlersRef.current.set(event, [...handlers, callback])
  }, [])

  const off = useCallback((event, callback) => {
    const handlers = eventHandlersRef.current.get(event) || []
    eventHandlersRef.current.set(event, handlers.filter((handler) => handler !== callback))
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