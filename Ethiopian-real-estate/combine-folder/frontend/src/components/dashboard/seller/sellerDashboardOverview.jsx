// src/components/dashboard/seller/sellerDashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Eye,
  MessageSquare,
  DollarSign,
  Home,
  PlusCircle,
  List,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

const SellerDashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    monthlyRevenue: 0,
    responseRate: 94
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_URL}/api/listings/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const listings = data.listings || [];
        const totalListings = listings.length;
        const activeListings = listings.filter(l => !l.is_draft && l.status === 'active').length;
        const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
        setStats({
          totalListings,
          activeListings,
          totalViews,
          totalInquiries: 0,
          monthlyRevenue: 0,
          responseRate: 94
        });
        const performers = listings.slice(0, 5).map((l) => ({
          name: l.title,
          views: l.views_count || 0,
          inquiries: 0,
          status: l.is_draft ? 'draft' : l.status || 'active'
        }));
        setTopPerformers(performers);
        setRecentActivities([
          { id: 1, action: 'Welcome to your seller dashboard!', time: 'Just now', type: 'success' },
          { id: 2, action: 'Start by creating your first listing', time: 'Just now', type: 'info' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-5 border border-border-light shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-text-muted text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-sm text-success">
              <TrendingUp size={12} /> {trend}% this month
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickActionButton = ({ title, icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border border-border-light bg-white hover:shadow-md transition flex items-center gap-3"
    >
      <div className={`text-${color}-600`}>{icon}</div>
      <span className="text-sm font-medium text-text-primary">{title}</span>
    </button>
  );

  const quickActions = [
    { title: 'Create Listing', icon: <PlusCircle size={18} />, path: '/dashboard/create-listing', color: 'primary' },
    { title: 'Add Rental Property', icon: <Home size={18} />, path: '/dashboard/create-listing?type=rent', color: 'success' },
    { title: 'View My Listings', icon: <List size={18} />, path: '/dashboard/listings', color: 'purple' },
    { title: 'Messages', icon: <MessageSquare size={18} />, path: '/dashboard/messages', color: 'warning' },
    { title: 'Upgrade Subscription', icon: <ShoppingCart size={18} />, path: '/dashboard/subscription', color: 'pink' }
  ];

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard Overview</h1>
        <p className="text-text-secondary text-sm">Welcome back! Here's your latest performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Active Listings" value={stats.activeListings} icon={<Home size={20} />} color="blue" trend={8} />
        <StatCard title="Total Views" value={stats.totalViews} icon={<Eye size={20} />} color="green" trend={15} />
        <StatCard title="Messages" value={stats.totalInquiries} icon={<MessageSquare size={20} />} color="orange" trend={12} />
        <StatCard title="Revenue" value={`ETB ${stats.monthlyRevenue}`} icon={<DollarSign size={20} />} color="purple" trend={22} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>
        </div>

        {/* Top Listings */}
        <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-5">Top Listings</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-3 text-text-muted font-medium text-sm">Property</th>
                <th className="text-right py-3 text-text-muted font-medium text-sm">Views</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((item, idx) => (
                <tr key={idx} className="border-b border-border-light last:border-0">
                  <td className="py-3 text-text-primary text-sm">{item.name}</td>
                  <td className="py-3 text-right text-text-primary text-sm">{item.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-5">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex justify-between items-center py-2 border-b border-border-light last:border-0">
              <div>
                <p className="text-text-primary text-sm">{activity.action}</p>
                <p className="text-text-muted text-xs mt-1">{activity.time}</p>
              </div>
              {activity.type === 'success' && <CheckCircle size={18} className="text-success" />}
            </div>
          ))}
        </div>
      </div>

      {/* Response Rate */}
      <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-5">Response Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-success to-green-600"
              style={{ width: `${stats.responseRate}%` }}
            />
          </div>
          <div className="text-xl font-bold text-text-primary">{stats.responseRate}%</div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardOverview;