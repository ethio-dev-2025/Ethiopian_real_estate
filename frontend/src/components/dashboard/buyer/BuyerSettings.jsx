// src/components/dashboard/buyer/BuyerSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, User, Mail, Phone, Shield, CheckCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const BuyerSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', username: '', email: '', phone: '' });

  useEffect(() => {
    if (user) setProfile({ full_name: user.full_name || '', username: user.username || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-gray-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500 text-sm">Manage your account preferences</p></div></div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-white" /></div><div><h2 className="text-lg font-semibold text-gray-900">Profile Information</h2><p className="text-sm text-gray-500">Your personal information</p></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={profile.full_name} disabled className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" value={profile.username} disabled className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label><input type="email" value={profile.email} disabled className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</label><input type="tel" value={profile.phone} disabled className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600" /></div>
          </div>
        </div>
        <div className="p-6 bg-gray-50"><div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Account Status</h3></div><div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}><CheckCircle className="w-4 h-4" />{user?.status === 'active' ? 'Active Account' : 'Pending Verification'}</span><span className="text-sm text-gray-500">Account created as Buyer / Renter</span></div></div>
        <div className="p-6 border-t"><div className="flex items-center gap-3 mb-4"><Building2 className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Membership</h3></div><p className="text-sm text-gray-600">You are registered as a <span className="font-semibold">Buyer</span>. You can browse properties, save favorites, and contact sellers.</p></div>
      </div>
    </div>
  );
};

export default BuyerSettings;