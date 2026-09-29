// src/routes/AppRoutes.jsx
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SellerLayout from '../components/layout/SellerLayout';
import BuyerLayout from '../components/layout/BuyerLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Buyer components
import BuyerDashboard from '../components/dashboard/buyer/BuyerDashboard';
import BuyerMessages from '../components/dashboard/buyer/BuyerMessages';
import BuyerProperties from '../components/dashboard/buyer/BuyerProperties';
import BuyerSaved from '../components/dashboard/buyer/BuyerSaved';

// Common Settings Component
import Settings from '../components/dashboard/common/Settings';

// Admin Components
import AdminDashboard from '../components/dashboard/admin/AdminDashboard';
import DashboardOverview from '../components/dashboard/admin/DashboardOverview';
import UserManagement from '../components/dashboard/admin/UserManagement';
import VerificationQueue from '../components/dashboard/admin/VerificationQueue';
import PaymentHistory from '../components/dashboard/admin/PaymentHistory';
import ReportsAnalytics from '../components/dashboard/admin/ReportsAnalytics';
import AdminMessages from '../components/dashboard/admin/AdminMessages';
import AdminSettings from '../components/dashboard/admin/AdminSettings';
import CompanySettings from '../components/dashboard/admin/CompanySettings';

// Payment Success Page
import PaymentSuccessPage from '../pages/PaymentSuccessPage';

// Public Pages
import PropertiesListPage from '../pages/public/PropertiesListPage';
import PropertyDetailPage from '../pages/public/PropertyDetailPage';
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';

// Seller Components (lazy loaded)
const SellerDashboard = lazy(() => import('../components/dashboard/seller/sellerDashboard'));
const SellerListings = lazy(() => import('../components/dashboard/seller/SellerListings'));
const SellerMessages = lazy(() => import('../components/dashboard/seller/SellerMessages'));
const SellerProperties = lazy(() => import('../components/dashboard/seller/SellerProperties'));
const SellerSubscription = lazy(() => import('../components/dashboard/seller/SellerSubscription'));
const SellerActivation = lazy(() => import('../components/dashboard/seller/SellerActivation'));
const SellerCreateListing = lazy(() => import('../components/dashboard/seller/sellerCreateListing'));
const SellerDashboardOverview = lazy(() => import('../components/dashboard/seller/sellerDashboardOverview'));
const SellerDocumentVerification = lazy(() => import('../components/dashboard/seller/sellerDocumentVerification'));

// Common Components (lazy loaded)
const Notifications = lazy(() => import('../components/common/Notifications'));
const RoleSelectionModal = lazy(() => import('../components/common/RoleSelectionModal'));

// Auth pages (lazy loaded)
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const SetNewPasswordPage = lazy(() => import('../pages/auth/SetNewPasswordPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));

// Buyer Auth pages (lazy loaded)
const BuyerLoginPage = lazy(() => import('../pages/buyer/BuyerLoginPage'));
const BuyerRegisterPage = lazy(() => import('../pages/buyer/BuyerRegisterPage'));

// Edit Listing Page (lazy loaded)
const EditListingPage = lazy(() => import('../pages/EditListingPage'));

const AppRoutes = () => {
  const { isAuthenticated, loading, user, refreshUser } = useAuth();
  const [role, setRole] = useState(null);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthenticated && !user) {
        await refreshUser();
      }
    };
    checkUser();
  }, [isAuthenticated, user, refreshUser]);

  useEffect(() => {
    if (isAuthenticated && user) {
      let userRole = user.role_type || user.role;
      if (!userRole) {
        userRole = localStorage.getItem('user_role');
      }
      
      let finalRole = userRole;
      if (userRole === 'user') {
        finalRole = 'buyer';
      }
      
      console.log('Setting role:', finalRole);
      setRole(finalRole);
      setHasSelectedRole(!!finalRole && finalRole !== 'null' && finalRole !== null);
    } else if (!isAuthenticated) {
      setRole(null);
      setHasSelectedRole(false);
    }
    setResolved(true);
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (!loading && resolved && isAuthenticated && hasSelectedRole && role && !initialRedirectDone) {
      const normalizedRole = String(role).toLowerCase();
      const currentPath = window.location.pathname;
      
      const shouldRedirect = currentPath === '/' || currentPath === '/login' || currentPath === '';
      
      if (shouldRedirect) {
        console.log('Initial redirect to role-specific dashboard:', normalizedRole);
        setInitialRedirectDone(true);
        
        if (normalizedRole === 'seller' || normalizedRole === 'landlord' || normalizedRole === 'dual') {
          navigate('/dashboard');
        } else if (normalizedRole === 'buyer') {
          navigate('/dashboard/buyer/messages');
        } else if (normalizedRole === 'admin') {
          navigate('/admin');
        }
      }
    }
  }, [loading, resolved, isAuthenticated, hasSelectedRole, role, initialRedirectDone, navigate]);

  // Show loading spinner while checking auth
  if (loading || !resolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ============ PUBLIC ROUTES (NOT AUTHENTICATED) ============
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/properties" element={<PropertiesListPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-new-password" element={<SetNewPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/buyer/login" element={<BuyerLoginPage />} />
          <Route path="/buyer/register" element={<BuyerRegisterPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/return" element={<PaymentSuccessPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    );
  }

  // ============ AUTHENTICATED - ROLE SELECTION ============
  if (!hasSelectedRole) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        <RoleSelectionModal open={true} />
      </Suspense>
    );
  }

  const normalizedRole = String(role).toLowerCase();
  console.log('Normalized role for routing:', normalizedRole);

  // ============ ADMIN ROUTES ============
  if (normalizedRole === 'admin') {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<DashboardOverview />} />
          <Route path="/admin/dashboard" element={<DashboardOverview />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/verification-queue" element={<VerificationQueue />} />
          <Route path="/admin/payment-approvals" element={<PaymentHistory />} />
          <Route path="/admin/reports" element={<ReportsAnalytics />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/company-settings" element={<CompanySettings />} />
          
          {/* Public pages for admin */}
          <Route path="/properties" element={<PropertiesListPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/return" element={<PaymentSuccessPage />} />
          
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  // ============ SELLER / LANDLORD / DUAL ROUTES ============
  if (normalizedRole === 'seller' || normalizedRole === 'landlord' || normalizedRole === 'dual') {
    return (
      <SellerLayout>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            {/* Dashboard Routes */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/dashboard/overview" element={<SellerDashboardOverview />} />
            
            {/* Listing Routes */}
            <Route path="/dashboard/listings" element={<SellerListings />} />
            <Route path="/dashboard/create-listing" element={<SellerCreateListing />} />
            <Route path="/dashboard/edit-listing/:id" element={<EditListingPage />} />
            <Route path="/dashboard/properties" element={<SellerProperties />} />
            
            {/* Message Routes */}
            <Route path="/dashboard/messages" element={<SellerMessages />} />
            <Route path="/dashboard/messages/:conversationId" element={<SellerMessages />} />
            
            {/* Subscription & Activation Routes */}
            <Route path="/dashboard/subscription" element={<SellerSubscription />} />
            <Route path="/dashboard/activation" element={<SellerActivation />} />
            <Route path="/dashboard/verification" element={<SellerDocumentVerification />} />
            
            {/* Settings & Notifications */}
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/notifications" element={<Notifications />} />
            
            {/* Public pages for sellers */}
            <Route path="/properties" element={<PropertiesListPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/return" element={<PaymentSuccessPage />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </SellerLayout>
    );
  }

  // ============ BUYER ROUTES ============
  if (normalizedRole === 'buyer') {
    return (
      <BuyerLayout>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            {/* Dashboard Routes */}
            <Route path="/" element={<Navigate to="/dashboard/buyer" />} />
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            
            {/* Message Routes */}
            <Route path="/dashboard/buyer/messages" element={<BuyerMessages />} />
            <Route path="/dashboard/buyer/messages/:conversationId" element={<BuyerMessages />} />
            
            {/* Property Routes */}
            <Route path="/dashboard/buyer/properties" element={<BuyerProperties />} />
            <Route path="/dashboard/buyer/saved" element={<BuyerSaved />} />
            
            {/* Settings & Notifications */}
            <Route path="/dashboard/buyer/settings" element={<Settings />} />
            <Route path="/dashboard/buyer/notifications" element={<Notifications />} />
            
            {/* Public pages for buyers */}
            <Route path="/properties" element={<PropertiesListPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/return" element={<PaymentSuccessPage />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard/buyer" />} />
          </Routes>
        </Suspense>
      </BuyerLayout>
    );
  }

  // Fallback - redirect to home
  return <Navigate to="/" />;
};

export default AppRoutes;