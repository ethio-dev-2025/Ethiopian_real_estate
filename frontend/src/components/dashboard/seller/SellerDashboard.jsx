// src/components/dashboard/seller/sellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UnorderedListOutlined,
  EyeOutlined,
  ShoppingOutlined,
  HomeOutlined,
  RiseOutlined,
  DollarOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeProperties: 0,
    totalViews: 0,
    rentalUnits: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/listings/my-listings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const listings = data.listings || [];
          setStats({
            totalListings: listings.length,
            activeProperties: listings.filter(l => !l.is_draft && l.status === 'active').length,
            totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
            rentalUnits: listings.filter(l => l.listing_type === 'rent').length
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color, gradient, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: gradient || `linear-gradient(135deg, white 0%, ${color}08 100%)`,
        borderRadius: 20,
        padding: '24px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ 
            fontSize: 36, 
            fontWeight: 'bold', 
            color: '#1a1a1a', 
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>{title}</div>
        </div>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: 28
        }}>
          {icon}
        </div>
      </div>
      {/* Decorative element */}
      <div style={{
        position: 'absolute',
        bottom: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
    </div>
  );

  return (
    <div>
      {/* Stats Grid - Beautiful cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          icon={<UnorderedListOutlined style={{ fontSize: 28 }} />}
          color="#3b82f6"
          gradient="linear-gradient(135deg, #fff 0%, #eff6ff 100%)"
          onClick={() => navigate('/listings')}
        />
        <StatCard
          title="Active Properties"
          value={stats.activeProperties}
          icon={<HomeOutlined style={{ fontSize: 28 }} />}
          color="#10b981"
          gradient="linear-gradient(135deg, #fff 0%, #ecfdf5 100%)"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={<EyeOutlined style={{ fontSize: 28 }} />}
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #fff 0%, #f5f3ff 100%)"
        />
        <StatCard
          title="Rental Units"
          value={stats.rentalUnits}
          icon={<ShoppingOutlined style={{ fontSize: 28 }} />}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #fff 0%, #fffbeb 100%)"
          onClick={() => navigate('/listings?type=rent')}
        />
      </div>
    </div>
  );
};

export default SellerDashboard;