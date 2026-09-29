// src/components/common/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, XCircle, CheckCheck } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome!', message: 'Welcome to BetFinder platform', read: false, type: 'success', date: new Date().toLocaleDateString() },
    { id: 2, title: 'New Message', message: 'You have a new inquiry about your property', read: false, type: 'info', date: new Date().toLocaleDateString() },
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeStyles = (type) => {
    switch(type) {
      case 'success':
        return { bg: 'bg-success/10', border: 'border-success', icon: <CheckCircle className="w-5 h-5 text-success" />, text: 'text-success' };
      case 'error':
        return { bg: 'bg-error/10', border: 'border-error', icon: <XCircle className="w-5 h-5 text-error" />, text: 'text-error' };
      case 'warning':
        return { bg: 'bg-warning/10', border: 'border-warning', icon: <AlertCircle className="w-5 h-5 text-warning" />, text: 'text-warning' };
      default:
        return { bg: 'bg-primary-50', border: 'border-primary-200', icon: <Info className="w-5 h-5 text-primary-600" />, text: 'text-primary-700' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary-700" />
          <h2 className="text-2xl font-bold text-text-primary">Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all text-sm font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-border-light">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'unread'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 bg-surface-muted rounded-2xl">
          <Bell className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const styles = getTypeStyles(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  notification.read 
                    ? 'bg-white border-border-light' 
                    : `${styles.bg} ${styles.border} shadow-sm`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {styles.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-semibold ${notification.read ? 'text-text-primary' : styles.text}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-text-muted">{notification.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;