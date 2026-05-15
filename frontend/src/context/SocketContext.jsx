import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Only connect if user is authenticated and we're in production
    const token = localStorage.getItem('access_token')
    if (!token) return

    // Comment out or disable socket connection to avoid errors
    // const newSocket = io('http://localhost:8000', {
    //   transports: ['websocket'],
    //   auth: { token }
    // })
    // 
    // newSocket.on('connect', () => {
    //   console.log('Socket connected')
    //   setIsConnected(true)
    // })
    // 
    // newSocket.on('disconnect', () => {
    //   console.log('Socket disconnected')
    //   setIsConnected(false)
    // })
    // 
    // setSocket(newSocket)
    // 
    // return () => {
    //   newSocket.close()
    // }

    console.log('Socket.io disabled - using REST API only')
    
  }, [])

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  )
}