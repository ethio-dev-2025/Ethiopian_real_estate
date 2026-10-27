// Format full status like Telegram
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Last seen recently';

  const now = new Date();
  const seen = new Date(lastSeen);

  const diffMs = now - seen;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute
  if (diffSeconds < 60) {
    return 'Last seen just now';
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return `Last seen yesterday at ${seen.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  // Within this week
  if (diffDays < 7) {
    return `Last seen ${seen.toLocaleDateString([], {
      weekday: 'long'
    })} at ${seen.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })}`;
  }

  // Older dates
  return `Last seen ${seen.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== seen.getFullYear() ? 'numeric' : undefined
  })} at ${seen.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })}`;
};

// Header status text
export const getStatusText = (isOnline, lastSeen, isTyping = false) => {
  if (isTyping) return 'Typing...';
  if (isOnline) return 'Online';
  return formatLastSeen(lastSeen);
};

// Chat list status
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

// Avatar status color
export const getStatusColor = (isOnline, lastSeen = null) => {
  if (isOnline) return 'bg-green-500';
  if (!lastSeen) return 'bg-slate-400';

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMinutes = Math.floor((now - seen) / 60000);

  // Active within 10 minutes
  if (diffMinutes <= 10) return 'bg-amber-500';

  return 'bg-slate-400';
};

// Presence indicator
export const getPresenceInfo = (isOnline, lastSeen, isTyping = false) => {
  return {
    text: getStatusText(isOnline, lastSeen, isTyping),
    shortText: getShortStatus(isOnline, lastSeen),
    color: getStatusColor(isOnline, lastSeen),
    isOnline,
    isTyping
  };
};