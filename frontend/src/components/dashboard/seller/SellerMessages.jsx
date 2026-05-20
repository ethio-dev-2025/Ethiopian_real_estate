// src/components/dashboard/seller/SellerMessages.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Search, Send, Paperclip, Image, File, X, CheckCheck,
  Check, Clock, MessageCircle, AlertCircle, Loader,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerMessages = () => {
  const { user, socket, addMessageHandler } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();

  const [conversations, setConversations] = useState([]);
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

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const getToken = () => localStorage.getItem('access_token');

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status, isOwn) => {
    if (!isOwn) return null;
    switch (status) {
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" title="Read" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-gray-400" title="Delivered" />;
      case 'sent': return <Check className="w-3 h-3 text-gray-400" title="Sent" />;
      case 'sending': return <Loader className="w-3 h-3 animate-spin text-gray-400" title="Sending" />;
      default: return <Clock className="w-3 h-3 text-gray-400" title="Pending" />;
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_URL}${url}`;
    return url;
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
        setMessages(sorted);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

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
        
        console.log('📋 Fetched conversations:', sorted.length, 'Unread total:', totalUnread);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const markAllMessagesRead = async (userId) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/messages/mark-all-read/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setConversations(prev => prev.map(c =>
        c.user_id === userId ? { ...c, unread_count: 0 } : c
      ));
      
      setTotalUnreadCount(prev => {
        const conv = conversations.find(c => c.user_id === userId);
        const newCount = prev - (conv?.unread_count || 0);
        return newCount > 0 ? newCount : 0;
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
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
  }, [fetchConversations]);

  // Auto open conversation from URL
  useEffect(() => {
    if (!urlConversationId || conversations.length === 0) return;
    const conv = conversations.find(c => c.id === parseInt(urlConversationId));
    if (conv && !selectedConversation) {
      setSelectedConversation(conv);
      fetchMessages(conv.user_id);
      markAllMessagesRead(conv.user_id);
    }
  }, [urlConversationId, conversations, selectedConversation, fetchMessages]);

  // Auto open chat from property contact
  useEffect(() => {
    const openChatWith = location.state?.openChatWith;
    const ownerName = location.state?.ownerName;
    const autoOpenChat = location.state?.autoOpenChat;
    const conversationIdFromState = location.state?.conversationId;

    if (conversationIdFromState && !selectedConversation) {
      const conversation = conversations.find(c => c.id === conversationIdFromState);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessages(conversation.user_id);
        markAllMessagesRead(conversation.user_id);
        if (autoOpenChat) {
          toast.success(`Now chatting with ${ownerName || 'owner'}`);
        }
        window.history.replaceState({}, document.title);
      }
    } else if (openChatWith && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(c => c.user_id === openChatWith);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessages(conversation.user_id);
        markAllMessagesRead(conversation.user_id);
        if (autoOpenChat) {
          toast.success(`Now chatting with ${ownerName || 'owner'}`);
        }
        window.history.replaceState({}, document.title);
      }
    }
  }, [conversations, location.state, selectedConversation, fetchMessages]);

  // Update sidebar unread count
  useEffect(() => {
    if (window.updateUnreadCount) {
      window.updateUnreadCount(totalUnreadCount);
    }
  }, [totalUnreadCount]);

  // WebSocket handler
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ No WebSocket connection available');
      return;
    }

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
              updated[existingIndex] = {
                ...updated[existingIndex],
                last_message: msg.content,
                last_message_at: msg.created_at,
                unread_count: (updated[existingIndex].unread_count || 0) + 1
              };
              const [moved] = updated.splice(existingIndex, 1);
              updated.unshift(moved);
              setTotalUnreadCount(prevTotal => prevTotal + 1);
              return updated;
            } else {
              const newConv = {
                id: Date.now(),
                user_id: msg.sender_id,
                user_name: msg.sender_name || 'Unknown',
                last_message: msg.content,
                last_message_at: msg.created_at,
                unread_count: 1
              };
              setTotalUnreadCount(prev => prev + 1);
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

        if (isCurrentConversation) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
          
          if (socket.readyState === WebSocket.OPEN && !isFromCurrentUser) {
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

        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.user_id === msg.receiver_id);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: 0
            };
            const [moved] = updated.splice(existingIndex, 1);
            updated.unshift(moved);
            return updated;
          } else {
            const newConv = {
              id: Date.now(),
              user_id: msg.receiver_id,
              user_name: msg.receiver_name || 'User',
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: 0
            };
            return [newConv, ...prev];
          }
        });

        if (isCurrentConversation) {
          setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...msg, status: 'sent' } : m
          ));
        }
      }

      if (data.type === 'messages_read') {
        setConversations(prev => prev.map(c =>
          c.user_id === data.sender_id ? { ...c, unread_count: 0 } : c
        ));
        
        const readCount = data.read_count || 0;
        setTotalUnreadCount(prev => prev - readCount > 0 ? prev - readCount : 0);
        
        setMessages(prev => prev.map(m => ({
          ...m,
          status: m.sender_id === user?.id && m.receiver_id === data.sender_id ? 'read' : m.status
        })));
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
  }, [socket, selectedConversation, addMessageHandler, user, conversations]);

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

    const optimisticMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedConversation.user_id,
      content: messageContent,
      attachment_url: fileUrl,
      attachment_name: fileName,
      attachment_type: fileTypeDetected,
      status: 'sending',
      created_at: new Date().toISOString(),
      sender_name: user.full_name || user.username
    };

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
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...data.message, status: 'sent' } : m
          ));
          fetchConversations();
        } else {
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
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...data.message, status: 'sent' } : m
          ));
          fetchConversations();
        } else {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          toast.error(data.detail || 'Failed to send message');
        }
      }
    } catch (err) {
      console.error(err);
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

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
        {message.attachment_url && message.attachment_type === 'image' && (
          <div className="mb-2">
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
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          <span>{formatTime(message.created_at)}</span>
          {getStatusIcon(message.status, isOwn)}
        </div>
      </div>
    </div>
  );

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

  const filteredConversations = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUserOnline = (userId) => onlineUsers[userId] === true;

  return (
    <div className="flex h-full bg-gray-100" style={{ height: 'calc(100vh - 80px)' }}>
      {showAttachmentModal && <AttachmentModal />}

      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Messages</h2>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {totalUnreadCount} new
              </span>
            )}
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv);
                  fetchMessages(conv.user_id);
                  markAllMessagesRead(conv.user_id);
                  // FIXED: Use correct path that matches your route
                  navigate(`/messages/${conv.id}`);
                }}
                className={`p-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition ${
                  selectedConversation?.user_id === conv.user_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {conv.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {isUserOnline(conv.user_id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold truncate">{conv.user_name}</h3>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedConversation.user_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {isUserOnline(selectedConversation.user_id) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{selectedConversation.user_name}</h3>
                <p className="text-xs text-gray-500">
                  {isUserOnline(selectedConversation.user_id) ? 'Online' : 'Offline'}
                  {typingUsers[selectedConversation.user_id] && ' • Typing...'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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

            <div className="bg-white border-t p-4">
              {attachmentPreview && (
                <div className="mb-2 p-2 bg-gray-100 rounded-lg relative inline-block">
                  <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e, 'file')} className="hidden" />
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach file">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Attach image">
                  <Image className="w-5 h-5" />
                </button>
                <textarea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button onClick={() => sendMessage()} disabled={(!inputMessage.trim() && !attachmentPreview) || sending} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Select a conversation</h3>
              <p className="text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessages;