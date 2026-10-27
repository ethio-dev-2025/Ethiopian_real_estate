// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const getNotificationSettings = useCallback(() => {
    const settings = localStorage.getItem('admin_notifications');
    if (settings) {
      try {
        return JSON.parse(settings);
      } catch (e) {
        return { email_alerts: true, new_user_notifications: true, payment_notifications: true };
      }
    }
    return { email_alerts: true, new_user_notifications: true, payment_notifications: true };
  }, []);

  const shouldShowNotification = useCallback((type) => {
    const settings = getNotificationSettings();
    switch(type) {
      case 'payment':
        return settings.payment_notifications !== false;
      case 'new_user':
        return settings.new_user_notifications !== false;
      case 'email':
        return settings.email_alerts !== false;
      default:
        return true;
    }
  }, [getNotificationSettings]);

  const showSuccess = useCallback((message, type = 'default') => {
    if (type === 'payment' && !shouldShowNotification('payment')) {
      console.log('Payment notifications disabled, skipping...');
      return;
    }
    if (type === 'new_user' && !shouldShowNotification('new_user')) {
      console.log('New user notifications disabled, skipping...');
      return;
    }
    toast.success(message, {
      style: {
        background: '#10b981',
        color: '#ffffff',
        borderRadius: '12px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981',
      },
    });
    setNotifications(prev => [{ id: Date.now(), message, type: 'success', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [shouldShowNotification])

  const showError = useCallback((message, type = 'default') => {
    if (type === 'payment' && !shouldShowNotification('payment')) {
      console.log('Payment notifications disabled, skipping...');
      return;
    }
    if (type === 'new_user' && !shouldShowNotification('new_user')) {
      console.log('New user notifications disabled, skipping...');
      return;
    }
    toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#ffffff',
        borderRadius: '12px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#ef4444',
      },
    });
    setNotifications(prev => [{ id: Date.now(), message, type: 'error', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [shouldShowNotification])

  const showInfo = useCallback((message, type = 'default') => {
    if (type === 'payment' && !shouldShowNotification('payment')) {
      console.log('Payment notifications disabled, skipping...');
      return;
    }
    if (type === 'new_user' && !shouldShowNotification('new_user')) {
      console.log('New user notifications disabled, skipping...');
      return;
    }
    toast(message, {
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        borderRadius: '12px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#3b82f6',
      },
    });
    setNotifications(prev => [{ id: Date.now(), message, type: 'info', timestamp: new Date() }, ...prev].slice(0, 50))
  }, [shouldShowNotification])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      showSuccess, 
      showError, 
      showInfo, 
      clearNotifications,
      shouldShowNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  )
}