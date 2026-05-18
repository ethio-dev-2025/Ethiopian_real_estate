// src/components/dashboard/buyer/BuyerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const API_URL = 'http://localhost:8000';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle auto-open chat from property page
  useEffect(() => {
    const state = location.state;
    if (state?.autoOpenChat && state?.conversationId) {
      console.log('Auto-opening chat from dashboard, conversationId:', state.conversationId);
      window.history.replaceState({}, document.title);
      navigate(`/dashboard/buyer/messages/${state.conversationId}`, {
        replace: true,
        state: {
          autoOpenChat: true,
          conversationId: state.conversationId,
          ownerName: state.ownerName
        }
      });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const saved = localStorage.getItem('buyer_saved_properties');
        if (saved) {
          try {
            const savedProps = JSON.parse(saved);
            setSavedCount(savedProps.length);
          } catch (e) {}
        }

        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await fetch(`${API_URL}/api/buyer/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const conversations = await response.json();
            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
            setUnreadCount(totalUnread);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };
    
    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Start Exploring',
      description: 'Browse thousands of properties',
      icon: Search,
      gradient: 'from-blue-500 to-blue-600',
      action: () => navigate('/dashboard/buyer/properties'),
      stat: 'Find your dream home'
    },
    {
      title: 'Your Favorites',
      description: 'Properties you\'ve saved',
      icon: Heart,
      gradient: 'from-rose-500 to-rose-600',
      action: () => navigate('/dashboard/buyer/saved'),
      stat: `${savedCount} saved properties`
    },
    {
      title: 'Messages',
      description: 'Chat with property owners',
      icon: MessageCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      action: () => navigate('/dashboard/buyer/messages'),
      stat: unreadCount > 0 ? `${unreadCount} unread messages` : 'Start a conversation'
    }
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.gradient} rounded-xl p-8 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{action.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{action.description}</p>
                  <p className="text-sm font-medium mt-3 text-white/90">{action.stat}</p>
                  <div className="flex items-center gap-1 mt-4 text-sm font-medium text-white/80">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuyerDashboard;