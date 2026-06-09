// src/components/common/UserStatus.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { usePresence } from '../../context/PresenceContext';
import { useSocket } from '../../context/SocketContext';

// Helper functions for status formatting
const formatLastSeenHelper = (lastSeen) => {
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

const getStatusText = (isOnline, lastSeen, isTyping = false) => {
  if (isTyping) return 'Typing...';
  if (isOnline) return 'Online';
  return formatLastSeenHelper(lastSeen);
};

const getShortStatus = (isOnline, lastSeen) => {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Recently';
  
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seen) / 60000);
  
  if (diffMinutes < 1) return 'Recently';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
  
  return seen.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getStatusColor = (isOnline, lastSeen = null) => {
  if (isOnline) return 'bg-green-500';
  if (!lastSeen) return 'bg-slate-400';
  
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seen) / 60000);
  
  if (diffMinutes <= 10) return 'bg-amber-500';
  
  return 'bg-slate-400';
};

const UserStatus = ({
  userId,
  showText = true,
  className = '',
  compact = false
}) => {
  const { userPresence, getUserPresence, formatLastSeen } = usePresence();
  const { isConnected } = useSocket();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (userId && isConnected) {
      getUserPresence(userId);
    }
  }, [userId, isConnected, getUserPresence]);

  useEffect(() => {
    if (userPresence?.[userId]) {
      setStatus(userPresence[userId]);
    }
  }, [userPresence, userId]);

  if (!status) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        {showText && (
          <span className="text-sm text-text-muted">
            Last seen recently
          </span>
        )}
      </div>
    );
  }

  if (status.is_typing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
        {showText && (
          <span className="text-sm text-primary-600 font-medium">
            typing...
          </span>
        )}
      </div>
    );
  }

  if (status.is_online) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="absolute w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-50" />
        </div>
        {showText && (
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-green-600 font-medium`}>
            Online
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      {showText && (
        <span className={`${compact ? 'text-xs' : 'text-sm'} text-text-muted truncate`}>
          {status.status_text || formatLastSeen(status.last_seen)}
        </span>
      )}
    </div>
  );
};

export default UserStatus;