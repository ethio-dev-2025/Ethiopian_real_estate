// src/components/dashboard/seller/SellerMessages.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePresence } from '../../../context/PresenceContext';
import { useSocket } from '../../../context/SocketContext';
import {
  Search, Send, Paperclip, Image, File, X, CheckCheck,
  Check, Clock, MessageCircle, AlertCircle, Loader,
  ArrowLeft, Download, User, Users, MessageSquare, RefreshCw,
  Maximize2, Minimize2, Eye, Smile, Reply, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import UserStatus from '../../common/UserStatus';

const API_URL = 'http://localhost:8000';

// ✅ FIXED: Exact time formatter (no relative time)
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  // For today's messages, show time only (e.g., "2:30 PM")
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // For messages from this year, show month/day and time
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // For older messages, show full date and time
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// ✅ FIXED: Telegram-style status icons
const getStatusIcon = (status, isOwn) => {
  if (!isOwn) return null;
  switch (status) {
    case 'read':
      return <CheckCheck className="w-3 h-3 text-primary-500" title="Seen" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-gray-500" title="Delivered" />;
    case 'sent':
      return <Check className="w-3 h-3 text-gray-400" title="Sent" />;
    case 'sending':
      return <Loader className="w-3 h-3 animate-spin text-gray-400" title="Sending" />;
    default:
      return <Clock className="w-3 h-3 text-gray-400" title="Pending" />;
  }
};

const SellerMessages = () => {
  const { user } = useAuth();
  const { getUserPresence } = usePresence();
  const { socket, isConnected, addMessageHandler, emit } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();

  const [activeView, setActiveView] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const hasSentReadReceipt = useRef(false);

  const getToken = () => localStorage.getItem('access_token');

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const updateGlobalUnreadBadge = useCallback((count) => {
    window.dispatchEvent(new CustomEvent('seller_unread_update', { detail: { count } }));
    localStorage.setItem('seller_unread_count', count.toString());
  }, []);

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_URL}${url}`;
    return url;
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['txt', 'md'].includes(ext)) return '📃';
    return '📎';
  };

  const getRoleBadge = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin': return <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Admin</span>;
      case 'buyer': return <span className="text-xs text-secondary-600 bg-secondary-100 px-2 py-0.5 rounded">Buyer</span>;
      case 'landlord': return <span className="text-xs text-success bg-green-100 px-2 py-0.5 rounded">Landlord</span>;
      case 'dual': return <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Dual</span>;
      default: return null;
    }
  };

  const fetchMessages = useCallback(async (userId) => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/messages/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        const processedMessages = sorted.map(msg => ({
          ...msg,
          time: formatMessageTime(msg.created_at),
          is_mine: msg.sender_id === user?.id,
          status: msg.is_read ? 'read' : (msg.status || 'sent')
        }));
        
        setMessages(processedMessages);
        scrollToBottom();
        
        hasSentReadReceipt.current = false;
        await markConversationRead(userId);
        
        if (userId) {
          getUserPresence(userId);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user?.id, getUserPresence]);

  const fetchConversations = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const sorted = [...data].sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        setConversations(sorted);
        
        const totalUnread = sorted.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setTotalUnreadCount(totalUnread);
        updateGlobalUnreadBadge(totalUnread);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [updateGlobalUnreadBadge]);

  // ✅ FIXED: fetchAllUsers - ONLY show Admin + Users with existing conversations (buyers only)
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Use the new seller-specific endpoint
      const response = await fetch(`${API_URL}/api/messages/seller/recipients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const usersList = Array.isArray(data) ? data : [];
        
        // No additional filtering needed - backend now returns only:
        // 1. Admin users
        // 2. Buyers with existing conversations
        const formattedUsers = usersList.map(u => ({
          id: u.user_id || u.id,
          user_id: u.user_id || u.id,
          user_name: u.user_name || u.full_name || u.username,
          user_role: u.user_role || u.role_type,
          user_avatar: u.user_avatar || u.avatar_url,
          email: u.email,
          last_message: u.last_message || null,
          last_message_at: u.last_message_at || null,
          unread_count: u.unread_count || 0,
          is_online: u.is_online || false,
          conversation_id: u.conversation_id || null
        }));

        console.log('📋 Sellers can message these users (Admins + Existing Buyer Conversations only):', 
          formattedUsers.map(u => `${u.user_name} (${u.user_role}) - Has conversation: ${!!u.conversation_id}`));
        
        setAllUsers(formattedUsers);
      } else {
        console.error('Failed to fetch seller recipients:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markConversationRead = async (userId) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/messages/mark-all-read/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setConversations(prev => prev.map(c =>
        c.user_id === userId ? { ...c, unread_count: 0 } : c
      ));
      
      if (socket && isConnected && !hasSentReadReceipt.current) {
        hasSentReadReceipt.current = true;
        emit('read_receipt', {
          reader_id: user?.id,
          sender_id: userId
        });
        console.log(`📤 Sent read receipt to user ${userId}`);
      }
      
      const newTotal = conversations.filter(c => c.user_id !== userId).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setTotalUnreadCount(newTotal);
      updateGlobalUnreadBadge(newTotal);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const startNewConversation = async (selectedUser) => {
    const existingConv = conversations.find(c => c.user_id === selectedUser.user_id);

    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(existingConv.user_id);
      setActiveView('conversations');
      navigate(`/dashboard/messages/${existingConv.id}`);
    } else {
      const newConv = {
        id: null,
        user_id: selectedUser.user_id,
        user_name: selectedUser.user_name,
        user_role: selectedUser.user_role,
        last_message: null,
        last_message_at: null,
        unread_count: 0
      };
      setSelectedConversation(newConv);
      setMessages([]);
      setActiveView('conversations');
      setConversations(prev => [newConv, ...prev]);
    }
  };

  const uploadFile = async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const savedCount = localStorage.getItem('seller_unread_count');
    if (savedCount && parseInt(savedCount) > 0) {
      setTotalUnreadCount(parseInt(savedCount));
      updateGlobalUnreadBadge(parseInt(savedCount));
    }
    
    const interval = setInterval(() => {
      fetchConversations();
    }, 30000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, [fetchConversations, fetchAllUsers, updateGlobalUnreadBadge]);

  useEffect(() => {
    if (conversations.length === 0 && allUsers.length > 0) {
      setActiveView('all_users');
    }
  }, [conversations.length, allUsers.length]);

  useEffect(() => {
    if (!urlConversationId || conversations.length === 0) return;
    const conv = conversations.find(c => c.id === parseInt(urlConversationId));
    if (conv && !selectedConversation) {
      setSelectedConversation(conv);
      fetchMessages(conv.user_id);
    }
  }, [urlConversationId, conversations, selectedConversation, fetchMessages]);

  // WebSocket message handler
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (data) => {
      console.log('📨 WebSocket message:', data.type);
      
      if (data.type === 'new_message') {
        const msg = data.message;
        const isFromCurrentUser = msg.sender_id === user?.id;
        const isCurrentConversation = selectedConversation?.user_id === msg.sender_id;
        
        if (!isFromCurrentUser) {
          setConversations(prev => {
            const existingIndex = prev.findIndex(c => c.user_id === msg.sender_id);
            
            if (existingIndex !== -1) {
              const updated = [...prev];
              const wasUnread = updated[existingIndex].unread_count || 0;
              updated[existingIndex] = {
                ...updated[existingIndex],
                last_message: msg.content,
                last_message_at: msg.created_at,
                unread_count: isCurrentConversation ? 0 : wasUnread + 1
              };
              const [moved] = updated.splice(existingIndex, 1);
              updated.unshift(moved);
              
              if (!isCurrentConversation) {
                setTotalUnreadCount(prevTotal => {
                  const newTotal = prevTotal + 1;
                  updateGlobalUnreadBadge(newTotal);
                  return newTotal;
                });
              }
              return updated;
            } else {
              const newConv = {
                id: Date.now(),
                user_id: msg.sender_id,
                user_name: msg.sender_name || 'Unknown',
                user_role: msg.sender_role || 'user',
                last_message: msg.content,
                last_message_at: msg.created_at,
                unread_count: isCurrentConversation ? 0 : 1
              };
              if (!isCurrentConversation) {
                setTotalUnreadCount(prevTotal => {
                  const newTotal = prevTotal + 1;
                  updateGlobalUnreadBadge(newTotal);
                  return newTotal;
                });
              }
              return [newConv, ...prev];
            }
          });
          
          if (!isCurrentConversation) {
            toast.info(`📩 New message from ${msg.sender_name || 'someone'}`, {
              duration: 5000,
              position: 'top-right',
              icon: '💬'
            });
          }
        }

        if (isCurrentConversation && !isFromCurrentUser) {
          const newMsg = { 
            ...msg, 
            time: formatMessageTime(msg.created_at), 
            is_mine: false, 
            status: 'delivered' 
          };
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
          
          if (socket && isConnected && !hasSentReadReceipt.current) {
            hasSentReadReceipt.current = true;
            emit('read_receipt', {
              reader_id: user?.id,
              sender_id: msg.sender_id
            });
          }
        }
      }

      if (data.type === 'message_sent' && data.message) {
        const msg = data.message;
        const isCurrentConversation = selectedConversation?.user_id === msg.receiver_id;

        fetchConversations();

        if (isCurrentConversation) {
          setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...msg, status: 'sent', time: formatMessageTime(msg.created_at) } : m
          ));
        }
      }

      if (data.type === 'message_delivered') {
        const messageId = data.message_id;
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, status: 'delivered' } : m
        ));
      }

      if (data.type === 'messages_read') {
        const readerId = data.reader_id;
        
        console.log(`📖 READ RECEIPT: User ${readerId} read messages`);
        
        setConversations(prev => prev.map(c =>
          c.user_id === readerId ? { ...c, unread_count: 0 } : c
        ));
        
        let hasUpdates = false;
        setMessages(prev => prev.map(m => {
          if (m.sender_id === user?.id && m.receiver_id === readerId && m.status !== 'read') {
            console.log(`   ✅ Updating message ${m.id} status to 'read'`);
            hasUpdates = true;
            return { ...m, status: 'read' };
          }
          return m;
        }));
        
        if (hasUpdates) {
          setTimeout(() => scrollToBottom(), 100);
        }
        
        const newTotal = conversations.filter(c => c.user_id !== readerId).reduce((sum, c) => sum + (c.unread_count || 0), 0);
        setTotalUnreadCount(newTotal);
        updateGlobalUnreadBadge(newTotal);
      }

      if (data.type === 'typing') {
        setTypingUsers(prev => ({ ...prev, [data.sender_id]: data.is_typing }));
        setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [data.sender_id]: false }));
        }, 2000);
      }

      if (data.type === 'user_status') {
        setOnlineUsers(prev => ({ ...prev, [data.user_id]: data.status === 'online' }));
      }
    };

    const removeHandler = addMessageHandler(handleMessage);
    return () => {
      if (removeHandler) removeHandler();
    };
  }, [socket, isConnected, selectedConversation, addMessageHandler, emit, user?.id, fetchConversations, conversations, updateGlobalUnreadBadge]);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isFullscreen]);

  const sendTyping = (isTyping) => {
    if (socket && isConnected && selectedConversation) {
      emit('typing', {
        receiver_id: selectedConversation.user_id,
        is_typing: isTyping
      });
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(true);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1000);
  };

  const sendMessage = async () => {
    if (!selectedConversation) {
      toast.error('Select conversation first');
      return;
    }

    const actualFile = pendingFile?.file;
    let messageContent = inputMessage.trim();
    
    if (!messageContent && !actualFile) return;

    setSending(true);

    let uploadedFile = null;
    let fileUrl = null;
    let fileName = null;
    let fileTypeDetected = null;

    if (actualFile) {
      uploadedFile = await uploadFile(actualFile);
      if (uploadedFile && uploadedFile.url) {
        fileUrl = uploadedFile.url;
        fileName = uploadedFile.original_name || actualFile.name;
        fileTypeDetected = uploadedFile.file_type || (actualFile.type?.startsWith('image/') ? 'image' : 'file');
      } else {
        toast.error('Failed to upload file');
        setSending(false);
        return;
      }
      if (!messageContent) {
        messageContent = `Sent a ${fileTypeDetected === 'image' ? 'photo' : 'file'}`;
      }
    }

    const tempId = Date.now();
    const now = new Date();

    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedConversation.user_id,
      content: messageContent,
      attachment_url: fileUrl,
      attachment_name: fileName,
      attachment_type: fileTypeDetected,
      status: 'sending',
      created_at: now.toISOString(),
      time: formatMessageTime(now),
      sender_name: user.full_name || user.username,
      reply_to: replyingTo ? { id: replyingTo.id, content: replyingTo.content } : null
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    setInputMessage('');
    setPendingFile(null);
    setAttachmentPreview(null);
    setReplyingTo(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';

    try {
      const token = getToken();
      let response, data;

      if (actualFile) {
        const formData = new FormData();
        formData.append('receiver_id', selectedConversation.user_id);
        formData.append('content', messageContent);
        if (replyingTo?.id) {
          formData.append('reply_to_id', replyingTo.id);
        }
        formData.append('file', actualFile);
        
        response = await fetch(`${API_URL}/api/messages/send-with-attachment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        data = await response.json();
      } else {
        response = await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.user_id,
            content: messageContent,
            reply_to_id: replyingTo?.id || null
          })
        });
        data = await response.json();
      }
      
      if (response.ok && data.success) {
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...data.message, status: 'sent', time: formatMessageTime(data.message.created_at) } : m
        ));
        fetchConversations();
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(data.detail || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      e.target.value = '';
      return;
    }

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setAttachmentPreview(e.target.result);
      reader.readAsDataURL(file);
      setPendingFile({ file, type });
    } else {
      setAttachmentPreview('file');
      setPendingFile({ file, type });
    }
    
    e.target.value = '';
    
    toast.success(`File "${file.name}" ready. Press Enter to send.`, {
      duration: 3000,
      icon: '📎'
    });
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const removeAttachment = () => {
    setAttachmentPreview(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      e.stopPropagation();
      if (inputMessage.trim() || pendingFile) {
        sendMessage();
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData) => {
    setInputMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const getFilteredList = () => {
    const list = activeView === 'conversations' ? conversations : allUsers;
    return list.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredList = getFilteredList();
  const isUserOnline = (userId) => onlineUsers[userId] === true;

  const MessageBubble = ({ message, isOwn }) => {
    const [showActions, setShowActions] = useState(false);
    const displayTime = message.time || formatMessageTime(message.created_at);
    const fileExt = getFileExtension(message.attachment_name);
    const isImage = message.attachment_type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
    const fileIcon = getFileIcon(message.attachment_name);
    
    return (
      <div 
        className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className={`max-w-[70%] ${isOwn ? 'bg-primary-600 text-white' : 'bg-white text-text-primary'} px-4 py-2 rounded-2xl shadow-sm`}>
          
          {message.reply_to && (
            <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? 'border-primary-400' : 'border-gray-200'}`}>
              <span className="opacity-70">↩️ Replying to: {message.reply_to.content?.substring(0, 50)}</span>
            </div>
          )}
          
          {message.attachment_url && isImage && (
            <div className="mb-2">
              <img
                src={getFullUrl(message.attachment_url)}
                alt={message.attachment_name || 'Image'}
                className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover"
                onClick={() => {
                  setSelectedAttachment({
                    url: getFullUrl(message.attachment_url),
                    name: message.attachment_name || 'Image',
                    type: 'image',
                    ext: fileExt
                  });
                  setShowAttachmentModal(true);
                }}
              />
            </div>
          )}
          
          {message.attachment_url && !isImage && (
            <div className="mb-2">
              <div
                onClick={() => {
                  setSelectedAttachment({
                    url: getFullUrl(message.attachment_url),
                    name: message.attachment_name || 'File',
                    type: 'file',
                    ext: fileExt
                  });
                  setShowAttachmentModal(true);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${isOwn ? 'bg-primary-700 hover:bg-primary-800' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <span className="text-xl">{fileIcon}</span>
                <span className="text-sm font-medium truncate max-w-[150px]">{message.attachment_name || 'File'}</span>
                <Eye className="w-3 h-3 opacity-50" />
              </div>
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {showActions && (
            <div className={`absolute -top-8 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10 ${isOwn ? 'right-0' : 'left-0'}`}>
              <button 
                onClick={() => copyMessage(message.content)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy message"
              >
                <Copy className="w-3 h-3 text-gray-600" />
              </button>
              <button 
                onClick={() => setReplyingTo(message)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Reply"
              >
                <Reply className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}
          
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-primary-100' : 'text-text-muted'}`}>
            <span>{displayTime}</span>
            {getStatusIcon(message.status, isOwn)}
          </div>
        </div>
      </div>
    );
  };

  const AttachmentModal = () => {
    if (!selectedAttachment) return null;
    const { url, name, type, ext } = selectedAttachment;
    const isPdf = ext === 'pdf';
    const isImage = type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isDocFile = ['doc', 'docx'].includes(ext);
    const fullUrl = getFullUrl(url);
    
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
    const pdfViewerUrl = `${fullUrl}#toolbar=1&navpanes=1&scrollbar=1`;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setShowAttachmentModal(false)}>
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getFileIcon(name)}</span>
              <h3 className="text-lg font-semibold truncate">{name}</h3>
            </div>
            <div className="flex gap-2">
              <a href={fullUrl} download={name} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Download">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setShowAttachmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {isImage ? (
              <img src={fullUrl} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            ) : isPdf ? (
              <iframe src={pdfViewerUrl} className="w-full h-[70vh] rounded-lg shadow-lg" title={name} />
            ) : isDocFile ? (
              <iframe src={officeViewerUrl} className="w-full h-[70vh] rounded-lg shadow-lg" title={name} />
            ) : (
              <div className="text-center">
                <span className="text-8xl mb-4 block">{getFileIcon(name)}</span>
                <p className="text-gray-500 mb-4">Preview not available for this file type (.{ext})</p>
                <div className="flex gap-3 justify-center">
                  <a href={fullUrl} download={name} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 h-screen'
    : 'h-[calc(100vh-80px)]';

  if (loading && conversations.length === 0 && allUsers.length === 0) {
    return (
      <div className="flex h-[calc(100vh-80px)] bg-gray-100 items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex bg-gray-100 ${containerClass}`}>
      {showAttachmentModal && <AttachmentModal />}

      <div className={`${(isFullscreen || (isMobile && selectedConversation)) ? 'hidden' : 'w-80'} bg-white border-r flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Messages</h2>
            <div className="flex items-center gap-2">
              {totalUnreadCount > 0 && (
                <span className="bg-error text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount} new
                </span>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveView('conversations')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeView === 'conversations'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Conversations
              {conversations.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  activeView === 'conversations' ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'
                }`}>
                  {conversations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('all_users')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeView === 'all_users'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              All Users
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                activeView === 'all_users' ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'
              }`}>
                {allUsers.length}
              </span>
            </button>
          </div>
          
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeView === 'conversations' ? "Search conversations..." : "Search users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {activeView === 'conversations' 
                  ? 'No conversations yet. Switch to "All Users" to start a new chat.'
                  : 'No users available to message'}
              </p>
            </div>
          ) : (
            filteredList.map(item => (
              <div
                key={item.user_id}
                onClick={() => {
                  if (activeView === 'all_users') {
                    startNewConversation(item);
                  } else {
                    setSelectedConversation(item);
                    fetchMessages(item.user_id);
                    if (item.id) {
                      navigate(`/dashboard/messages/${item.id}`);
                    }
                  }
                }}
                className={`p-3 flex gap-3 cursor-pointer transition-all border-l-4 ${
                  selectedConversation?.user_id === item.user_id 
                    ? 'bg-primary-50 border-l-primary-600' 
                    : 'border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                    {item.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {isUserOnline(item.user_id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
                  )}
                  {item.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse-badge border border-white z-10">
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className={`font-semibold truncate ${item.unread_count > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {item.user_name}
                      </h3>
                    </div>
                    {item.last_message_at && (
                      <span className={`text-xs flex-shrink-0 ${item.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                        {formatMessageTime(item.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(item.user_role)}
                  </div>
                  <p className={`text-sm truncate mt-1 ${item.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {item.last_message || (activeView === 'all_users' ? 'Click to start conversation' : 'No messages yet')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-white">
          <button 
            onClick={() => {
              fetchConversations();
              fetchAllUsers();
            }} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white border-b p-4 flex items-center gap-3 flex-shrink-0 shadow-md">
              <button 
                onClick={() => {
                  setSelectedConversation(null);
                  navigate('/dashboard/messages');
                }}
                className="p-2 hover:bg-primary-600 rounded-lg transition text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white text-primary-700 flex items-center justify-center font-bold shadow-md">
                  {selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {isUserOnline(selectedConversation.user_id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{selectedConversation.user_name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getRoleBadge(selectedConversation.user_role)}
                  <UserStatus userId={selectedConversation.user_id} showText={true} />
                  {typingUsers[selectedConversation.user_id] && (
                    <span className="text-xs text-primary-200 ml-2">• Typing...</span>
                  )}
                </div>
              </div>
            </div>

            {replyingTo && (
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                <div className="text-sm">
                  <span className="text-gray-500">Replying to:</span>
                  <span className="ml-2 text-gray-700">{replyingTo.content?.substring(0, 50)}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-error hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-4" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t p-3 sticky bottom-0 z-10 shadow-lg">
              {attachmentPreview && attachmentPreview !== 'file' && (
                <div className="mb-3 p-3 bg-primary-50 rounded-lg relative inline-block border-2 border-primary-200">
                  <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button onClick={removeAttachment} className="absolute -top-3 -right-3 bg-error text-white rounded-full p-1 shadow-md hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {attachmentPreview === 'file' && pendingFile && (
                <div className="mb-3 p-3 bg-primary-50 rounded-lg relative inline-block border-2 border-primary-200">
                  <span className="text-xl mr-2">{getFileIcon(pendingFile.file.name)}</span>
                  <span className="ml-2 text-sm text-gray-700">{pendingFile.file.name}</span>
                  <button onClick={removeAttachment} className="absolute -top-3 -right-3 bg-error text-white rounded-full p-1 shadow-md hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" accept="image/*" />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition" 
                  title="Attach document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => imageInputRef.current?.click()} 
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition" 
                  title="Attach image"
                >
                  <Image className="w-5 h-5" />
                </button>
                
                <div className="relative" ref={emojiPickerRef}>
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    title="Add emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
                
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={sending}
                />
                <button 
                  type="button"
                  onClick={() => sendMessage()} 
                  disabled={(!inputMessage.trim() && !pendingFile) || sending} 
                  className="bg-primary-600 text-white p-2.5 rounded-full hover:bg-primary-700 disabled:opacity-50 transition shadow-md"
                >
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Select a conversation</p>
            <p className="text-sm text-gray-400">
              {activeView === 'conversations' 
                ? 'Choose a conversation from the list to start messaging'
                : 'Switch to "Conversations" tab to see your chats, or click on a user to start a new conversation'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;