// src/components/dashboard/seller/sellerDashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Visibility,
  Favorite,
  Message,
  AttachMoney,
  Home,
  People,
  BarChart,
  MoreVert,
  ArrowForward,
  Assessment,
  PlusCircle,
  UnorderedListOutlined,
  ShoppingOutlined
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
  const [monthlyViews, setMonthlyViews] = useState([]);
  const [listingStatusData, setListingStatusData] = useState([
    { name: 'Active', value: 0, color: '#4caf50' },
    { name: 'Pending', value: 0, color: '#ff9800' },
    { name: 'Sold', value: 0, color: '#f44336' },
    { name: 'Draft', value: 0, color: '#9e9e9e' }
  ]);

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
      
      // Fetch listings data
      const response = await fetch(`${API_URL}/api/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const listings = data.listings || [];
        
        const totalListings = listings.length;
        const activeListings = listings.filter(l => !l.is_draft && l.status === 'active').length;
        const draftListings = listings.filter(l => l.is_draft).length;
        const pendingListings = listings.filter(l => l.status === 'pending').length;
        const soldListings = listings.filter(l => l.status === 'sold').length;
        const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
        const rentalUnits = listings.filter(l => l.listing_type === 'rent').length;
        
        setStats({
          totalListings,
          activeListings,
          totalViews,
          totalInquiries: 0,
          monthlyRevenue: 0,
          responseRate: 94
        });
        
        setListingStatusData([
          { name: 'Active', value: activeListings, color: '#4caf50' },
          { name: 'Pending', value: pendingListings, color: '#ff9800' },
          { name: 'Sold', value: soldListings, color: '#f44336' },
          { name: 'Draft', value: draftListings, color: '#9e9e9e' }
        ]);
        
        // Top performers
        const performers = listings.slice(0, 4).map(l => ({
          name: l.title,
          views: l.views_count || 0,
          inquiries: 0,
          status: l.is_draft ? 'draft' : (l.status === 'active' ? 'active' : 'pending')
        }));
        setTopPerformers(performers);
        
        // Monthly views (mock data for demo)
        setMonthlyViews([
          { month: 'Jan', views: 120, inquiries: 5 },
          { month: 'Feb', views: 135, inquiries: 7 },
          { month: 'Mar', views: 150, inquiries: 8 },
          { month: 'Apr', views: 180, inquiries: 10 },
          { month: 'May', views: 210, inquiries: 12 },
          { month: 'Jun', views: 245, inquiries: 15 }
        ]);
        
        // Recent activities
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
    <div style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {trend && (
            <div style={{ fontSize: 11, color: trend > 0 ? '#10b981' : '#ef4444', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} />
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div>
        <div style={{ color: '#333', marginBottom: 4, fontSize: 14 }}>{activity.action}</div>
        <div style={{ fontSize: 11, color: '#999' }}>{activity.time}</div>
      </div>
      {activity.type === 'success' && <CheckCircle size={14} color="#10b981" />}
    </div>
  );

  const QuickActionButton = ({ title, icon, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: `${color}08`,
        border: `1px solid ${color}20`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.3s',
        width: '100%',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${color}08`;
      }}
    >
      <span style={{ color: color, fontSize: 18 }}>{icon}</span>
      <span style={{ color: '#333', fontWeight: 500, fontSize: 14 }}>{title}</span>
    </button>
  );

  const quickActions = [
    { title: 'Create Listing for Sale', icon: <PlusCircle size={18} />, path: '/create-listing', color: '#1890ff' },
    { title: 'Add Rental Property', icon: <Home size={18} />, path: '/create-listing?type=rent', color: '#52c41a' },
    { title: 'View My Listings', icon: <UnorderedListOutlined size={18} />, path: '/listings', color: '#722ed1' },
    { title: 'Check Messages', icon: <Message size={18} />, path: '/messages', color: '#fa8c16' },
    { title: 'Upgrade Subscription', icon: <AttachMoney size={18} />, path: '/subscription', color: '#eb2f96' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, border: '1px solid #f0f0f0' }}>
              <div style={{ height: 60, backgroundColor: '#f5f5f5', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Welcome back! Here's what's happening with your properties today.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <StatCard title="Active Listings" value={stats.activeListings} icon={<Home size={20} />} color="#1890ff" trend={8} />
        <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={<Visibility size={20} />} color="#52c41a" trend={15} />
        <StatCard title="Inquiries" value={stats.totalInquiries} icon={<Message size={20} />} color="#fa8c16" trend={12} />
        <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue.toLocaleString()}`} icon={<AttachMoney size={20} />} color="#722ed1" trend={22} />
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 24
      }}>
        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        {/* Top Performing Listings */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Top Performing Listings</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: '#666' }}>Property</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13, color: '#666' }}>Views</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13, color: '#666' }}>Inquiries</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13, color: '#666' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{item.name}</td>
                    <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13 }}>{item.views}</td>
                    <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13 }}>{item.inquiries}</td>
                    <td style={{ textAlign: 'right', padding: '12px 8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        backgroundColor: item.status === 'active' ? '#e8f5e9' : '#fff3e0',
                        color: item.status === 'active' ? '#2e7d32' : '#e65100'
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => navigate('/listings')}
            style={{ marginTop: 16, color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            View all listings →
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginTop: 24,
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Recent Activity</h2>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {recentActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        <button
          onClick={() => navigate('/notifications')}
          style={{ marginTop: 16, color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          View all activity →
        </button>
      </div>

      {/* Response Rate Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginTop: 24,
        border: '1px solid #f0f0f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Response Rate</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 8,
              backgroundColor: '#e8e8e8',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${stats.responseRate}%`,
                height: '100%',
                backgroundColor: stats.responseRate >= 90 ? '#10b981' : stats.responseRate >= 70 ? '#f59e0b' : '#ef4444',
                borderRadius: 4,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.responseRate}%</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {stats.responseRate >= 90 ? 'Excellent!' : stats.responseRate >= 70 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
        <button
          onClick={() => navigate('/messages')}
          style={{ marginTop: 16, color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          View all messages →
        </button>
      </div>
    </div>
  );
};

// Helper component for CheckCircle
const CheckCircle = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default SellerDashboardOverview;