// src/components/dashboard/buyer/BuyerMessages.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Send, Paperclip, Image, File, X, CheckCheck,
  Check, Clock, MessageCircle, AlertCircle, Loader,
  ArrowLeft, Download, User, Users, MessageSquare, RefreshCw,
  Maximize2, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

// Telegram-style CSS for badge animation
const telegramStyles = `
  @keyframes pulse-badge {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }
  .animate-pulse-badge {
    animation: pulse-badge 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = telegramStyles;
  document.head.appendChild(style);
}

const BuyerMessages = () => {
  const { user, socket, addMessageHandler } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();

  const [activeView, setActiveView] = useState('all_users');
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fetchedMessageIds = useRef(new Set());

  const getToken = () => localStorage.getItem('access_token');

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Update global sidebar badge (total unread)
  const updateGlobalUnreadBadge = useCallback((count) => {
    window.dispatchEvent(new CustomEvent('buyer_unread_update', { detail: { count } }));
    localStorage.setItem('buyer_unread_count', count.toString());
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read': return <CheckCheck className="w-4 h-4 text-blue-400" title="Seen" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-gray-400" title="Delivered" />;
      case 'sent': return <Check className="w-4 h-4 text-gray-400" title="Sent" />;
      case 'sending': return <Loader className="w-3 h-3 animate-spin text-gray-300" />;
      default: return <Clock className="w-3 h-3 text-gray-300" />;
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_URL}${url}`;
    return url;
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">Admin</span>;
      case 'seller': return <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Seller</span>;
      case 'landlord': return <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Landlord</span>;
      case 'dual': return <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Dual</span>;
      default: return <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">User</span>;
    }
  };

  const getAdminAndOwnerRecipients = (users) => {
    const admin = users.find(u => u.user_role === 'admin');
    const owner = users.find(u => u.user_role !== 'admin');
    const recipients = [];
    if (admin) recipients.push(admin);
    if (owner && owner.user_id !== admin?.user_id) recipients.push(owner);
    return recipients;
  };

  // Fetch messages by user_id
  const fetchMessagesByUserId = useCallback(async (userId) => {
    if (!userId) {
      console.error('No userId provided to fetchMessagesByUserId');
      return;
    }
    
    try {
      const token = getToken();
      if (!token) return;

      console.log('🔄 Fetching messages for user_id:', userId);
      const url = `${API_URL}/api/messages/messages/${userId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('📨 Messages received:', data.length);
        
        const messagesArray = Array.isArray(data) ? data : [];
        const sorted = messagesArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        fetchedMessageIds.current.clear();
        
        const formattedMessages = sorted.map(msg => ({
          ...msg,
          time: formatMessageTime(msg.created_at),
          is_mine: msg.sender_id === user?.id,
          status: msg.status || 'sent'
        }));
        
        formattedMessages.forEach(msg => fetchedMessageIds.current.add(msg.id));
        setMessages(formattedMessages);
        scrollToBottom();
      } else {
        console.error('Failed to fetch messages:', res.status);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  }, [user?.id]);

  // Fetch conversations with unread counts for each conversation
  const fetchConversations = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/buyer/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const conversationsArray = Array.isArray(data) ? data : [];
        
        // Sort by last message time (newest first)
        const sorted = conversationsArray.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        
        console.log('📋 Conversations loaded:', sorted.map(c => ({ name: c.user_name, unread: c.unread_count })));
        
        setConversations(sorted);
        
        // Calculate total unread count for sidebar badge
        const totalUnread = sorted.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setTotalUnreadCount(totalUnread);
        updateGlobalUnreadBadge(totalUnread);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [updateGlobalUnreadBadge]);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/buyer/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const usersList = Array.isArray(data) ? data : data.users || [];
        
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
          is_online: u.is_online || false
        }));

        const visibleUsers = getAdminAndOwnerRecipients(formattedUsers);
        setAllUsers(visibleUsers);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark all messages from a specific user as read
  const markAllMessagesRead = async (userId) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/messages/mark-all-read/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local conversations state - set unread_count to 0 for this conversation
      setConversations(prev => prev.map(c =>
        c.user_id === userId ? { ...c, unread_count: 0 } : c
      ));
      
      // Recalculate total unread count
      const newTotal = conversations.filter(c => c.user_id !== userId).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setTotalUnreadCount(newTotal);
      updateGlobalUnreadBadge(newTotal);
      
      console.log(`✅ Marked all messages as read for user ${userId}`);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const startNewConversation = async (selectedUser) => {
    const existingConv = conversations.find(c => c.user_id === selectedUser.user_id);

    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessagesByUserId(existingConv.user_id);
      markAllMessagesRead(existingConv.user_id);
      setActiveView('conversations');
      navigate(`/dashboard/buyer/messages/${existingConv.id}`);
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
      fetchedMessageIds.current.clear();
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

  // Initial data load
  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
    const interval = setInterval(() => {
      fetchConversations();
      fetchAllUsers();
    }, 30000);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, [fetchConversations, fetchAllUsers]);

  useEffect(() => {
    if (conversations.length === 0 && allUsers.length > 0) {
      setActiveView('all_users');
    }
  }, [conversations.length, allUsers.length]);

  // Handle URL conversation
  useEffect(() => {
    if (!urlConversationId || conversations.length === 0) return;
    const conv = conversations.find(c => c.id === parseInt(urlConversationId, 10));
    if (conv && !selectedConversation) {
      setSelectedConversation(conv);
      fetchMessagesByUserId(conv.user_id);
      markAllMessagesRead(conv.user_id);
    }
  }, [urlConversationId, conversations, selectedConversation, fetchMessagesByUserId]);

  // Handle location state
  useEffect(() => {
    if (location.state?.openChatWith && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(c => c.user_id === location.state.openChatWith);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessagesByUserId(conversation.user_id);
        markAllMessagesRead(conversation.user_id);
        if (location.state?.autoOpenChat) {
          toast.success(`Now chatting with ${location.state?.ownerName || 'user'}`);
        }
      }
    }
  }, [conversations, location.state, selectedConversation, fetchMessagesByUserId]);

  useEffect(() => {
    if (selectedConversation) {
      setConversations(prev => prev.map(c =>
        c.user_id === selectedConversation.user_id ? { ...c, unread_count: 0 } : c
      ));
    }
  }, [selectedConversation]);

  // WebSocket handler for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ No WebSocket connection available');
      return;
    }

    const handleMessage = (data) => {
      console.log('📨 WebSocket message type:', data.type);
      
      if (data.type === 'new_message') {
        const msg = data.message;
        const isFromCurrentUser = msg.sender_id === user?.id;
        const isCurrentConversation = selectedConversation?.user_id === msg.sender_id;

        // Prevent duplicate messages
        if (fetchedMessageIds.current.has(msg.id)) {
          console.log('Duplicate message, skipping');
          return;
        }

        fetchedMessageIds.current.add(msg.id);

        if (!isFromCurrentUser) {
          // Update conversations list (this will update unread badges)
          fetchConversations();
          fetchAllUsers();
          
          if (!isCurrentConversation) {
            toast.info(`📩 New message from ${msg.sender_name || 'someone'}`, {
              duration: 5000,
              position: 'top-right',
              icon: '💬'
            });
          }
        }

        if (isCurrentConversation && !isFromCurrentUser) {
          const newMessage = {
            ...msg,
            time: formatMessageTime(msg.created_at),
            is_mine: false,
            status: msg.status || 'delivered'
          };
          
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
          
          // Send read receipt
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'read_receipt',
              sender_id: msg.sender_id
            }));
          }
        }
      }

      if (data.type === 'message_sent' && data.message) {
        const msg = data.message;
        const isCurrentConversation = selectedConversation?.user_id === msg.receiver_id;

        fetchConversations();
        fetchAllUsers();

        if (isCurrentConversation) {
          setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...msg, status: 'sent', time: formatMessageTime(msg.created_at), is_mine: true } : m
          ));
        }
      }

      if (data.type === 'messages_read') {
        // Update conversations - set unread to 0 for the reader
        setConversations(prev => prev.map(c =>
          c.user_id === data.reader_id ? { ...c, unread_count: 0 } : c
        ));
        
        setMessages(prev => prev.map(m => ({
          ...m,
          status: m.sender_id === user?.id && m.receiver_id === data.reader_id ? 'read' : m.status
        })));
        
        // Recalculate total unread
        const newTotal = conversations.filter(c => c.user_id !== data.reader_id).reduce((sum, c) => sum + (c.unread_count || 0), 0);
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
  }, [socket, selectedConversation, addMessageHandler, user, fetchConversations, fetchAllUsers, conversations, updateGlobalUnreadBadge]);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isFullscreen]);

  const sendTyping = (isTyping) => {
    if (socket?.readyState === WebSocket.OPEN && selectedConversation) {
      socket.send(JSON.stringify({
        type: 'typing',
        receiver_id: selectedConversation.user_id,
        is_typing: isTyping
      }));
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(true);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1000);
  };

  const sendMessage = async (file = null, fileType = null) => {
    if (!selectedConversation) {
      toast.error('Select conversation first');
      return;
    }

    let messageContent = inputMessage.trim();
    if (!messageContent && !file) return;

    setSending(true);

    let uploadedFile = null;
    let fileUrl = null;
    let fileName = null;
    let fileTypeDetected = null;

    if (file) {
      uploadedFile = await uploadFile(file);
      if (uploadedFile && uploadedFile.url) {
        fileUrl = uploadedFile.url;
        fileName = uploadedFile.original_name || file.name;
        fileTypeDetected = uploadedFile.file_type || (file.type.startsWith('image/') ? 'image' : 'file');
      } else {
        toast.error('Failed to upload file');
        setSending(false);
        return;
      }
      messageContent = messageContent || `Sent a ${fileType || 'file'}`;
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
      is_mine: true
    };

    fetchedMessageIds.current.add(tempId);
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    setInputMessage('');

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('receiver_id', selectedConversation.user_id);
      formData.append('content', messageContent);
      
      if (file) {
        formData.append('file', file);
        const response = await fetch(`${API_URL}/api/messages/send-with-attachment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          fetchedMessageIds.current.delete(tempId);
          fetchedMessageIds.current.add(data.message.id);
          
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...data.message, is_mine: true, status: 'sent', time: formatMessageTime(data.message.created_at) } : m
          ));
          fetchConversations();
          fetchAllUsers();
        } else {
          fetchedMessageIds.current.delete(tempId);
          setMessages(prev => prev.filter(m => m.id !== tempId));
          toast.error('Failed to send message');
        }
      } else {
        const response = await fetch(`${API_URL}/api/messages/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.user_id,
            content: messageContent
          })
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          fetchedMessageIds.current.delete(tempId);
          fetchedMessageIds.current.add(data.message.id);
          
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...data.message, is_mine: true, status: 'sent', time: formatMessageTime(data.message.created_at) } : m
          ));
          fetchConversations();
          fetchAllUsers();
        } else {
          fetchedMessageIds.current.delete(tempId);
          setMessages(prev => prev.filter(m => m.id !== tempId));
          toast.error(data.detail || 'Failed to send message');
        }
      }
    } catch (err) {
      console.error(err);
      fetchedMessageIds.current.delete(tempId);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      return;
    }

    if (type === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setAttachmentPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    sendMessage(file, type);
  };

  const removeAttachment = () => {
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      if (inputMessage.trim()) {
        sendMessage();
      }
    }
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
    const displayTime = message.time || formatMessageTime(message.created_at);
    
    return (
      <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} px-4 py-2 rounded-2xl shadow-sm`}>
          {message.attachment_url && (
            <div className="mb-2">
              {message.attachment_type === 'image' ? (
                <img
                  src={getFullUrl(message.attachment_url)}
                  alt={message.attachment_name || 'Image'}
                  className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover"
                  onClick={() => {
                    setSelectedAttachment({
                      url: getFullUrl(message.attachment_url),
                      name: message.attachment_name || 'Image',
                      type: 'image'
                    });
                    setShowAttachmentModal(true);
                  }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image'; }}
                />
              ) : (
                <a
                  href={getFullUrl(message.attachment_url)}
                  download={message.attachment_name}
                  className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-blue-700 hover:bg-blue-800' : 'bg-gray-300 hover:bg-gray-400'}`}
                >
                  <File className="w-5 h-5" />
                  <span className="text-sm font-medium truncate">{message.attachment_name || 'File'}</span>
                </a>
              )}
            </div>
          )}
          {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{displayTime}</span>
            {isOwn && getStatusIcon(message.status)}
          </div>
        </div>
      </div>
    );
  };

  const AttachmentModal = () => {
    if (!selectedAttachment) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold truncate">{selectedAttachment.name}</h3>
            <div className="flex gap-2">
              <a href={selectedAttachment.url} download={selectedAttachment.name} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setShowAttachmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {selectedAttachment.type === 'image' ? (
              <img src={selectedAttachment.url} alt={selectedAttachment.name} className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <div className="text-center">
                <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Preview not available</p>
                <a href={selectedAttachment.url} download={selectedAttachment.name} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                  <Download className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && conversations.length === 0 && allUsers.length === 0) {
    return (
      <div className="flex h-full bg-gray-100 items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-screen'}`}>
      {showAttachmentModal && <AttachmentModal />}

      {/* Conversations Sidebar */}
      <div className={`${(isFullscreen || (isMobile && selectedConversation)) ? 'hidden' : 'w-80'} bg-white border-r flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Messages</h2>
            <div className="flex items-center gap-2">
              {totalUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount} new
                </span>
              )}
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 hover:bg-gray-100 rounded-lg">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveView('conversations')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeView === 'conversations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Conversations
              {conversations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-600 text-white">
                  {conversations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('all_users')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeView === 'all_users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" /> All Users
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-600 text-white">
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List with RED BADGES on individual conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations yet. Switch to "All Users" to start a new chat.</p>
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
                    fetchMessagesByUserId(item.user_id);
                    markAllMessagesRead(item.user_id);
                    if (item.id) {
                      navigate(`/dashboard/buyer/messages/${item.id}`);
                    }
                  }
                }}
                className={`p-3 flex gap-3 cursor-pointer transition-all border-l-4 ${
                  selectedConversation?.user_id === item.user_id 
                    ? 'bg-blue-50 border-l-blue-600' 
                    : 'border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {item.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {isUserOnline(item.user_id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                  {/* RED BADGE - Shows unread count for individual conversation */}
                  {item.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse-badge border border-white z-10">
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className={`font-semibold truncate ${item.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.user_name}
                      </h3>
                    </div>
                    {item.last_message_at && (
                      <span className={`text-xs flex-shrink-0 ${item.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                        {formatTime(item.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(item.user_role)}
                  </div>
                  <p className={`text-sm truncate mt-1 ${item.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {item.last_message || (activeView === 'all_users' ? 'Click to start conversation' : 'No messages yet')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b p-4 flex items-center gap-3 flex-shrink-0 shadow-md">
              <button 
                onClick={() => {
                  setSelectedConversation(null);
                  navigate('/dashboard/buyer/messages');
                }}
                className="p-2 hover:bg-blue-500 rounded-lg transition text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow-md">
                  {selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {isUserOnline(selectedConversation.user_id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-md"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{selectedConversation.user_name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-100">
                    {isUserOnline(selectedConversation.user_id) ? '● Online' : '● Offline'}
                    {typingUsers[selectedConversation.user_id] && ' • Typing...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
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

            {/* Input Area */}
            <div className="bg-white border-t p-3 sticky bottom-0 z-10 shadow-lg">
              {attachmentPreview && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg relative inline-block border-2 border-blue-200">
                  <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button onClick={removeAttachment} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Attach document">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button onClick={() => imageInputRef.current?.click()} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Attach image">
                  <Image className="w-5 h-5" />
                </button>
                <textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button 
                  onClick={() => sendMessage()} 
                  disabled={(!inputMessage.trim() && !attachmentPreview) || sending} 
                  className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
                >
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-20 h-20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Select a conversation</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerMessages;