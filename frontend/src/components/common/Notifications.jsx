// src/components/common/Notifications.jsx
import React, { useState, useEffect } from 'react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome!', message: 'Welcome to the platform', read: false, type: 'success', date: new Date().toLocaleDateString() },
    { id: 2, title: 'New Message', message: 'You have a new inquiry', read: false, type: 'info', date: new Date().toLocaleDateString() },
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

  const getTypeStyle = (type) => {
    switch(type) {
      case 'success': return { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32' };
      case 'error': return { bg: '#ffebee', border: '#f44336', color: '#c62828' };
      case 'warning': return { bg: '#fff3e0', border: '#ff9800', color: '#e65100' };
      default: return { bg: '#e3f2fd', border: '#2196f3', color: '#1565c0' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'all' ? '2px solid #2196f3' : 'none',
            color: activeTab === 'all' ? '#2196f3' : '#666'
          }}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'unread' ? '2px solid #2196f3' : 'none',
            color: activeTab === 'unread' ? '#2196f3' : '#666'
          }}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ color: '#666' }}>No notifications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((notification) => {
            const style = getTypeStyle(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                style={{
                  padding: '16px',
                  backgroundColor: notification.read ? '#fff' : style.bg,
                  borderLeft: `4px solid ${style.border}`,
                  borderRadius: '8px',
                  cursor: !notification.read ? 'pointer' : 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: style.color }}>{notification.title}</h4>
                    <p style={{ margin: 0, color: '#666' }}>{notification.message}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#999' }}>{notification.date}</span>
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