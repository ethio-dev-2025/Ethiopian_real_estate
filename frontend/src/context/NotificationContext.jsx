import React, { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showSuccess = useCallback((message) => {
    toast.success(message)
    setNotifications(prev => [{ id: Date.now(), message, type: 'success', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [])

  const showError = useCallback((message) => {
    toast.error(message)
    setNotifications(prev => [{ id: Date.now(), message, type: 'error', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [])

  const showInfo = useCallback((message) => {
    toast(message)
    setNotifications(prev => [{ id: Date.now(), message, type: 'info', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, showSuccess, showError, showInfo, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}