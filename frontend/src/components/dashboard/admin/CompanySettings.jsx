import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, DollarSign, Save, FileText,
  Phone, Mail, MapPin
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
  }, []);

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

  // Tabs configuration - REMOVED Platform Stats tab
  const tabs = [
    { id: 'company_info', label: 'Company Info', icon: Building2, color: 'from-cyan-600 to-blue-600' },
    { id: 'financial', label: 'Financial', icon: DollarSign, color: 'from-emerald-600 to-teal-600' },
    { id: 'about', label: 'About & Legal', icon: FileText, color: 'from-purple-600 to-pink-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-full sm:max-w-3xl md:max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs - Only Company Info, Financial, About (removed Platform Stats) */}
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

        {/* About & Legal Section */}
        {activeTab === 'about' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">            
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