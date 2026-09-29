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
      bgColor: 'bg-blue-600',
      gradient: 'from-blue-600 to-blue-800',
      action: () => navigate('/dashboard/buyer/properties'),
      stat: `${savedCount} saved properties`
    },
    {
      title: 'Your Favorites',
      description: 'Properties you\'ve saved',
      icon: Heart,
      bgColor: 'bg-rose-500',
      gradient: 'from-rose-500 to-rose-700',
      action: () => navigate('/dashboard/buyer/saved'),
      stat: `${savedCount} saved`
    },
    {
      title: 'Messages',
      description: 'Chat with property owners',
      icon: MessageCircle,
      bgColor: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-700',
      action: () => navigate('/dashboard/buyer/messages'),
      stat: unreadCount > 0 ? `${unreadCount} unread messages` : 'Start chatting'
    }
  ];

  return (
    <div className="w-full">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'Buyer'}!</p>
        <p className="text-gray-400 text-xs mt-0.5">Find your dream property today</p>
      </div>

      {/* Quick Actions Grid - All 3 cards will be visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Start Exploring Card */}
        <div
          onClick={quickActions[0].action}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-98 min-h-[180px] flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Search className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Start Exploring</h3>
              <p className="text-white/80 text-sm mt-1">Browse thousands of properties</p>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <p className="text-sm font-medium text-white/90">{quickActions[0].stat}</p>
            <div className="flex items-center gap-1 mt-2 text-sm font-medium text-white/80 group">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Your Favorites Card */}
        <div
          onClick={quickActions[1].action}
          className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-98 min-h-[180px] flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Heart className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Your Favorites</h3>
              <p className="text-white/80 text-sm mt-1">Properties you've saved</p>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <p className="text-sm font-medium text-white/90">{quickActions[1].stat}</p>
            <div className="flex items-center gap-1 mt-2 text-sm font-medium text-white/80 group">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Messages Card - Now using AMBER color */}
        <div
          onClick={quickActions[2].action}
          className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-98 min-h-[180px] flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Messages</h3>
              <p className="text-white/80 text-sm mt-1">Chat with property owners</p>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <p className="text-sm font-medium text-white/90">{quickActions[2].stat}</p>
            <div className="flex items-center gap-1 mt-2 text-sm font-medium text-white/80 group">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      
        
      
    </div>
  );
};

export default BuyerDashboard;