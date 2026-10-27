// frontend/src/context/PresenceContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const PresenceContext = createContext();

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Last seen recently';

  const now = new Date();
  const seen = new Date(lastSeen);

  const diffMs = now - seen;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Last seen recently';
  }

  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays === 1) {
    return `Last seen yesterday at ${seen.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  if (diffDays < 7) {
    return `Last seen ${seen.toLocaleDateString([], {
      weekday: 'long'
    })} at ${seen.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  return `Last seen ${seen.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== seen.getFullYear() ? 'numeric' : undefined
  })} at ${seen.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })}`;
};

export const getStatusText = (isOnline, lastSeen, isTyping = false) => {
  if (isTyping) return 'Typing...';
  if (isOnline) return 'Online';
  return formatLastSeen(lastSeen);
};

export const getShortStatus = (isOnline, lastSeen) => {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Recently';

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seen) / 60000);

  if (diffMinutes < 1) return 'Recently';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;

  return seen.toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  });
};

// Updated status colors to match Option 1 (Deep Blue + Amber)
export const getStatusColor = (isOnline, lastSeen = null) => {
  if (isOnline) return 'bg-success'; // Green for online (success color)
  if (!lastSeen) return 'bg-slate-400';

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seen) / 60000);

  // Active within 10 minutes - use amber/secondary color
  if (diffMinutes <= 10) return 'bg-secondary-500'; // Amber

  // Offline
  return 'bg-slate-400';
};

export const getPresenceInfo = (isOnline, lastSeen, isTyping = false) => {
  return {
    text: getStatusText(isOnline, lastSeen, isTyping),
    shortText: getShortStatus(isOnline, lastSeen),
    color: getStatusColor(isOnline, lastSeen),
    isOnline,
    isTyping
  };
};

export const PresenceProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [userPresence, setUserPresence] = useState({});
  const heartbeatIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const tabIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = localStorage.getItem('presence_session_id');
    if (!sessionIdRef.current) {
      sessionIdRef.current = `${user?.id || 'anonymous'}_${Date.now()}_${Math.random()}`;
      localStorage.setItem('presence_session_id', sessionIdRef.current);
    }
    
    tabIdRef.current = `${Date.now()}_${Math.random()}`;
  }, [user?.id]);

  const sendHeartbeat = useCallback(() => {
    if (socket && isConnected && user) {
      if (typeof socket.send === 'function') {
        socket.send(JSON.stringify({
          type: 'presence_heartbeat',
          session_id: sessionIdRef.current,
          tab_id: tabIdRef.current
        }));
      }
    }
  }, [socket, isConnected, user]);

  useEffect(() => {
    if (isConnected && user) {
      sendHeartbeat();
      
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 25000);
      
      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [isConnected, user, sendHeartbeat]);

  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'presence_init') {
          console.log('Presence initialized:', data);
        }
        
        if (data.type === 'user_presence') {
          setUserPresence(prev => ({
            ...prev,
            [data.user_id]: data.presence
          }));
        }
      } catch (err) {
        console.error('Presence message error:', err);
      }
    };
    
    if (typeof socket.addEventListener === 'function') {
      socket.addEventListener('message', handleMessage);
    }
    
    return () => {
      if (typeof socket.removeEventListener === 'function') {
        socket.removeEventListener('message', handleMessage);
      }
    };
  }, [socket]);

  const getUserPresence = useCallback(async (userId) => {
    if (socket && isConnected) {
      if (typeof socket.send === 'function') {
        socket.send(JSON.stringify({
          type: 'get_user_presence',
          target_user_id: userId
        }));
      }
    }
  }, [socket, isConnected]);

  const value = {
    userPresence,
    getUserPresence,
    formatLastSeen
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export default PresenceProvider;