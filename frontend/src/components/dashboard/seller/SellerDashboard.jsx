// src/components/dashboard/seller/SellerDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { RefreshCw, Home, Eye, ShoppingBag, List, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeProperties: 0,
    totalViews: 0,
    rentalUnits: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  const fetchStats = useCallback(async (force = false) => {
    if (fetchInProgressRef.current && !force) {
      console.log('⏳ Fetch already in progress, skipping...');
      return;
    }
    if (hasFetchedRef.current && !force) {
      console.log('✅ Already fetched my-listings, skipping...');
      return;
    }
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found');
      setLoading(false);
      return;
    }
    fetchInProgressRef.current = true;
    if (!force) hasFetchedRef.current = true;
    try {
      console.log('📊 Fetching my-listings...');
      const response = await fetch(`${API_URL}/api/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        const listingsData = data.listings || [];
        console.log('📊 Listings fetched:', listingsData.length);
        setListings(listingsData);
        const activeListings = listingsData.filter(l => l.status === 'active' && !l.is_draft);
        const rentalListings = listingsData.filter(l => l.listing_type === 'rent');
        const totalViewsCount = listingsData.reduce((sum, l) => sum + (l.views_count || 0), 0);
        setStats({
          totalListings: listingsData.length,
          activeProperties: activeListings.length,
          totalViews: totalViewsCount,
          rentalUnits: rentalListings.length
        });
        console.log('📊 Stats updated:', {
          total: listingsData.length,
          active: activeListings.length,
          views: totalViewsCount,
          rentals: rentalListings.length
        });
      } else {
        console.error('Failed to fetch listings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    hasFetchedRef.current = false;
    try {
      await refreshUser();
      await fetchStats(true);
      toast.success('Dashboard refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      if (!hasFetchedRef.current) fetchStats();
    }, 500);
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      hasFetchedRef.current = false;
    };
  }, [fetchStats]);

  const StatCard = ({ title, value, icon, color, gradient, onClick, subtitle }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-border-light shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-text-muted text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtitle && <p className="text-text-muted text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );

  const getUserName = () => {
    if (!user) return 'Seller';
    if (user.full_name && user.full_name !== 'vvvvv' && user.full_name !== 'vvvvvvv') return user.full_name;
    if (user.username && user.username !== 'vvvvv' && user.username !== 'vvvvvvv') return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Seller';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div><div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div><div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="h-10 w-24 bg-gray-200 rounded mb-2"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          icon={<List className="w-6 h-6" />}
          onClick={() => navigate('/dashboard/listings')}
          subtitle={`${stats.activeProperties} active`}
        />
        <StatCard
          title="Active Properties"
          value={stats.activeProperties}
          icon={<Home className="w-6 h-6" />}
          onClick={() => navigate('/dashboard/listings?status=active')}
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={<Eye className="w-6 h-6" />}
        />
        <StatCard
          title="Rental Units"
          value={stats.rentalUnits}
          icon={<ShoppingBag className="w-6 h-6" />}
          onClick={() => navigate('/dashboard/listings?type=rent')}
        />
      </div>

      
    </div>
  );
};

export default SellerDashboard;