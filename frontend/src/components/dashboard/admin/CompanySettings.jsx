// src/components/dashboard/admin/CompanySettings.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, Globe, DollarSign, Users, Home, CreditCard, 
  Save, TrendingUp, Clock, BarChart3, Settings, FileText,
  Phone, Mail, MapPin, Link, Award, Target, Shield
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const CompanySettings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Get active tab from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab || 'company_info';
  });

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    company_name: 'EstateHub Real Estate',
    company_email: 'admin@estatehub.com',
    company_phone: '+251 911 111 111',
    company_address: 'Addis Ababa, Ethiopia',
    company_website: 'www.estatehub.com',
    company_tin: '0071406415',
    company_logo: null,
    currency: 'ETB',
    tax_rate: 15,
    commission_rate: 3.5,
    listing_fee: 500,
    subscription_fee_seller: 2500,
    subscription_fee_landlord: 2500,
    subscription_fee_dual: 4000,
    about_text: 'EstateHub is Ethiopia\'s premier real estate platform connecting buyers, sellers, and renters.',
    mission_text: 'To revolutionize the real estate industry in Ethiopia through technology and transparency.',
    vision_text: 'To become the most trusted real estate marketplace in Africa.'
  });

  // Platform Stats
  const [platformStats, setPlatformStats] = useState({
    total_users: 0,
    total_listings: 0,
    total_revenue: 0,
    pending_approvals: 0,
    monthly_active_users: 0,
    completed_transactions: 0,
    active_listings: 0,
    verified_agents: 0
  });

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load data
  useEffect(() => {
    loadCompanySettings();
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/admin/stats/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlatformStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const loadCompanySettings = () => {
    const savedSettings = localStorage.getItem('company_settings');
    if (savedSettings) {
      try {
        setCompanySettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
  };

  const saveCompanySettings = () => {
    localStorage.setItem('company_settings', JSON.stringify(companySettings));
    toast.success('Company settings saved successfully!');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({ ...prev, [name]: value }));
  };

  // Tabs configuration
  const tabs = [
    { id: 'company_info', label: 'Company Info', icon: Building2, color: 'from-cyan-600 to-blue-600' },
    { id: 'financial', label: 'Financial', icon: DollarSign, color: 'from-emerald-600 to-teal-600' },
    { id: 'platform_stats', label: 'Platform Stats', icon: BarChart3, color: 'from-orange-600 to-red-600' },
    { id: 'about', label: 'About & Legal', icon: FileText, color: 'from-purple-600 to-pink-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Company Settings
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md scale-105`
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Company Info Section */}
        {activeTab === 'company_info' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                Company Information
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your company details</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={companySettings.company_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Email</label>
                  <input
                    type="email"
                    name="company_email"
                    value={companySettings.company_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Phone</label>
                  <input
                    type="tel"
                    name="company_phone"
                    value={companySettings.company_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company TIN</label>
                  <input
                    type="text"
                    name="company_tin"
                    value={companySettings.company_tin}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Address</label>
                  <textarea
                    name="company_address"
                    value={companySettings.company_address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                  <input
                    type="text"
                    name="company_website"
                    value={companySettings.company_website}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <select
                    name="currency"
                    value={companySettings.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:bg-gray-700 dark:text-white transition"
                  >
                    <option value="ETB">Ethiopian Birr (ETB)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={saveCompanySettings}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Company Info
              </button>
            </div>
          </div>
        )}

        {/* Financial Section */}
        {activeTab === 'financial' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Financial Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure fees and rates</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={companySettings.tax_rate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commission_rate"
                    value={companySettings.commission_rate}
                    onChange={handleChange}
                    step="0.5"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Listing Fee (ETB)</label>
                  <input
                    type="number"
                    name="listing_fee"
                    value={companySettings.listing_fee}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-3">Subscription Fees</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Seller Plan:</span>
                      <span className="font-semibold">{companySettings.subscription_fee_seller} ETB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Landlord Plan:</span>
                      <span className="font-semibold">{companySettings.subscription_fee_landlord} ETB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dual Plan:</span>
                      <span className="font-semibold">{companySettings.subscription_fee_dual} ETB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={saveCompanySettings}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Financial Settings
              </button>
            </div>
          </div>
        )}

        {/* Platform Stats Section */}
        {activeTab === 'platform_stats' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Platform Statistics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of platform performance</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center">
                  <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_users.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-center">
                  <Home className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_listings.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Listings</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 text-center">
                  <DollarSign className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.total_revenue.toLocaleString()} ETB</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 text-center">
                  <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.pending_approvals}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
                </div>
                
                <div className="bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-xl p-6 text-center">
                  <TrendingUp className="w-10 h-10 text-cyan-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.monthly_active_users.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Active Users</p>
                </div>
                
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-center">
                  <CreditCard className="w-10 h-10 text-teal-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{platformStats.completed_transactions.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Transactions</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={fetchPlatformStats}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Stats
              </button>
            </div>
          </div>
        )}

        {/* About & Legal Section */}
        {activeTab === 'about' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                About & Legal Information
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Company description and legal information</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About Us</label>
                  <textarea
                    name="about_text"
                    value={companySettings.about_text}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none dark:bg-gray-700 dark:text-white transition"
                    placeholder="Tell your company story..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mission Statement</label>
                  <textarea
                    name="mission_text"
                    value={companySettings.mission_text}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none dark:bg-gray-700 dark:text-white transition"
                    placeholder="Our mission..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vision Statement</label>
                  <textarea
                    name="vision_text"
                    value={companySettings.vision_text}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none dark:bg-gray-700 dark:text-white transition"
                    placeholder="Our vision..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={saveCompanySettings}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Information
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;