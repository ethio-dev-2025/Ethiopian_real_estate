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

      const response = await fetch(
        `${API_URL}/api/listings/my-listings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        const listings = data.listings || [];

        const totalListings = listings.length;

        const activeListings = listings.filter(
          (l) => !l.is_draft && l.status === 'active'
        ).length;

        const totalViews = listings.reduce(
          (sum, l) => sum + (l.views_count || 0),
          0
        );

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
          status: l.is_draft
            ? 'draft'
            : l.status || 'active'
        }));

        setTopPerformers(performers);

        setRecentActivities([
          {
            id: 1,
            action: 'Welcome to your seller dashboard!',
            time: 'Just now',
            type: 'success'
          },
          {
            id: 2,
            action: 'Start by creating your first listing',
            time: 'Just now',
            type: 'info'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    trend
  }) => (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: '#666',
              marginBottom: 8
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#111'
            }}
          >
            {value}
          </div>

          {trend && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color:
                  trend > 0
                    ? '#10b981'
                    : '#ef4444'
              }}
            >
              <TrendingUp size={12} />
              {trend}% this month
            </div>
          )}
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid #f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div>
        <div
          style={{
            fontSize: 14,
            color: '#222',
            marginBottom: 4
          }}
        >
          {activity.action}
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#999'
          }}
        >
          {activity.time}
        </div>
      </div>

      {activity.type === 'success' && (
        <CheckCircle
          size={18}
          color="#10b981"
        />
      )}
    </div>
  );

  const QuickActionButton = ({
    title,
    icon,
    color,
    onClick
  }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: `1px solid ${color}20`,
        background: `${color}08`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: '0.3s'
      }}
    >
      <div style={{ color }}>
        {icon}
      </div>

      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#222'
        }}
      >
        {title}
      </span>
    </button>
  );

  const quickActions = [
    {
      title: 'Create Listing',
      icon: <PlusCircle size={18} />,
      path: '/create-listing',
      color: '#1890ff'
    },
    {
      title: 'Add Rental Property',
      icon: <Home size={18} />,
      path: '/create-listing?type=rent',
      color: '#52c41a'
    },
    {
      title: 'View My Listings',
      icon: <ListOrdered size={18} />,
      path: '/listings',
      color: '#722ed1'
    },
    {
      title: 'Messages',
      icon: <MessageCircle size={18} />,
      path: '/messages',
      color: '#fa8c16'
    },
    {
      title: 'Upgrade Subscription',
      icon: <ShoppingCart size={18} />,
      path: '/subscription',
      color: '#eb2f96'
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 'bold',
            marginBottom: 8
          }}
        >
          Dashboard Overview
        </h1>

        <p
          style={{
            color: '#666',
            fontSize: 14
          }}
        >
          Welcome back! Here's your latest performance.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 28
        }}
      >
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          icon={<Home size={20} />}
          color="#1890ff"
          trend={8}
        />

        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={<Visibility size={20} />}
          color="#52c41a"
          trend={15}
        />

        <StatCard
          title="Messages"
          value={stats.totalInquiries}
          icon={<MessageCircle size={20} />}
          color="#fa8c16"
          trend={12}
        />

        <StatCard
          title="Revenue"
          value={`$${stats.monthlyRevenue}`}
          icon={<DollarSign size={20} />}
          color="#722ed1"
          trend={22}
        />
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 24
        }}
      >
        {/* Quick Actions */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #f0f0f0'
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 20
            }}
          >
            Quick Actions
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onClick={() =>
                  navigate(action.path)
                }
              />
            ))}
          </div>
        </div>

        {/* Listings Table */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #f0f0f0'
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 20
            }}
          >
            Top Listings
          </h2>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    paddingBottom: 12,
                    color: '#777',
                    fontSize: 13
                  }}
                >
                  Property
                </th>

                <th
                  style={{
                    textAlign: 'right',
                    paddingBottom: 12,
                    color: '#777',
                    fontSize: 13
                  }}
                >
                  Views
                </th>
              </tr>
            </thead>

            <tbody>
              {topPerformers.map((item, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      padding: '12px 0',
                      borderTop:
                        '1px solid #f5f5f5',
                      fontSize: 14
                    }}
                  >
                    {item.name}
                  </td>

                  <td
                    style={{
                      textAlign: 'right',
                      padding: '12px 0',
                      borderTop:
                        '1px solid #f5f5f5',
                      fontSize: 14
                    }}
                  >
                    {item.views}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f0f0f0',
          marginTop: 24
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 20
          }}
        >
          Recent Activity
        </h2>

        {recentActivities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
          />
        ))}
      </div>

      {/* Response Rate */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f0f0f0',
          marginTop: 24
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 20
          }}
        >
          Response Rate
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              flex: 1,
              height: 10,
              background: '#eee',
              borderRadius: 10,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${stats.responseRate}%`,
                height: '100%',
                background:
                  stats.responseRate >= 90
                    ? '#10b981'
                    : '#f59e0b'
              }}
            />
          </div>

          <div
            style={{
              fontWeight: 'bold',
              fontSize: 18
            }}
          >
            {stats.responseRate}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardOverview;
