// src/components/dashboard/buyer/BuyerMessages.jsx
import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MessagesPage from '../../messages/MessagesPage';
import toast from 'react-hot-toast';

const BuyerMessages = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle auto-open chat from property page
  useEffect(() => {
    const state = location.state;
    if (state?.autoOpenChat && state?.conversationId) {
      console.log('✅ Auto-opening chat with conversation:', state.conversationId);
      
      // Small delay to ensure MessagesPage is mounted
      const timer = setTimeout(() => {
        // The MessagesPage will handle the conversation via URL param
        console.log('🎯 Messages page should now load conversation:', state.conversationId);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  // If no conversationId in URL but we have one in state, update URL
  useEffect(() => {
    const state = location.state;
    if (state?.conversationId && !conversationId) {
      console.log('🔄 Updating URL with conversationId:', state.conversationId);
      navigate(`/dashboard/buyer/messages/${state.conversationId}`, {
        replace: true,
        state: { ...state, autoOpenChat: false }
      });
    }
  }, [location.state, conversationId, navigate]);

  return <MessagesPage />;
};

export default BuyerMessages;