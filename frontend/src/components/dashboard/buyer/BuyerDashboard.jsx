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

  useEffect(() => {
    const state = location.state;
    if (state?.autoOpenChat && state?.conversationId) {
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
      stat: `${savedCount} saved properties`
    },
    {
      title: 'Your Favorites',
      description: 'Properties you\'ve saved',
      icon: Heart,
      gradient: 'from-rose-500 to-rose-600',
      action: () => navigate('/dashboard/buyer/saved'),
      stat: `${savedCount} saved`
    },
    {
      title: 'Messages',
      description: 'Chat with property owners',
      icon: MessageCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      action: () => navigate('/dashboard/buyer/messages'),
      stat: unreadCount > 0 ? `${unreadCount} unread` : 'Start chatting'
    }
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              onClick={action.action}
              className={`bg-gradient-to-r ${action.gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-98`}
            >
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">{action.title}</h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{action.description}</p>
                  <p className="text-xs sm:text-sm font-medium mt-2 sm:mt-3 text-white/90 truncate">{action.stat}</p>
                  <div className="flex items-center gap-1 mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-white/80">
                    Get Started <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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