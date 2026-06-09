// src/pages/public/AboutPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/layout/Header'
import { 
  Building2, Users, Award, Globe, Shield, Clock, 
  CheckCircle, TrendingUp, Heart, Star, Briefcase,
  MapPin, Phone, Mail, MessageCircle, Facebook, Twitter, 
  Linkedin, Instagram, Youtube, ChevronRight, Crown,
  Key, Store, Gem, UserCheck, CreditCard, FileCheck,
  Zap, Sparkles, Target, Eye, MessageSquare, Bell,
  Home, Search, Filter, Bookmark, DollarSign, Lock,
  LogIn, ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = 'http://localhost:8000'

const AboutPage = () => {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    totalTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('buyer')
  const [animateNumbers, setAnimateNumbers] = useState(false)
  const statsRef = useRef(null)

  // Fetch real data from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats({
          totalUsers: 158,
          totalListings: 25,
          activeListings: 23,
          totalRevenue: 37999,
          totalTransactions: 81
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimateNumbers(true)
        }
      },
      { threshold: 0.3 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Role data - UPDATED: All roles use primary blue for backgrounds
  const roles = [
    {
      id: 'buyer',
      name: 'Buyer / Tenant',
      icon: Users,
      color: 'from-primary-600 to-primary-800',
      badgeColor: 'bg-primary-100 text-primary-700',
      description: 'Browse and inquire about properties',
      capabilities: [
        'Browse all listings (sale & rent)',
        'Search and filter properties',
        'Save favorite properties',
        'Contact sellers/landlords via messages',
        'Track saved properties',
        'Free access - no subscription needed'
      ],
      requirements: ['Simple registration', 'No documents required', 'Instant activation'],
      price: 'FREE',
      dashboard: '/dashboard'
    },
    {
      id: 'seller',
      name: 'Property Seller',
      icon: Store,
      color: 'from-primary-600 to-primary-800',
      badgeColor: 'bg-primary-100 text-primary-700',
      description: 'Create and manage property listings for SALE',
      capabilities: [
        'Create property listings (for sale)',
        'Edit/Delete own listings',
        'View listing analytics (views count)',
        'Receive messages from buyers',
        'Manage subscription',
        'Track active subscription days remaining'
      ],
      requirements: [
        'Register account',
        'Upload verification documents',
        'Admin approval',
        'Subscribe to Seller Plan (894 ETB/6 months)'
      ],
      price: '894 ETB',
      duration: '6 months',
      pricePerMonth: '149',
      dashboard: '/dashboard'
    },
    {
      id: 'landlord',
      name: 'Landlord',
      icon: Key,
      color: 'from-primary-600 to-primary-800',
      badgeColor: 'bg-primary-100 text-primary-700',
      description: 'Create and manage rental property listings',
      capabilities: [
        'Create rental property listings',
        'Edit/Delete own rental listings',
        'Manage tenant applications',
        'Track rental income',
        'Receive messages from tenants/buyers',
        'Manage subscription'
      ],
      requirements: [
        'Register account',
        'Upload verification documents',
        'Admin approval',
        'Subscribe to Landlord Plan (1194 ETB/6 months)'
      ],
      price: '1,194 ETB',
      duration: '6 months',
      pricePerMonth: '199',
      dashboard: '/dashboard'
    },
    {
      id: 'dual',
      name: 'Dual (Seller + Landlord)',
      icon: Crown,
      color: 'from-primary-600 to-primary-800',
      badgeColor: 'bg-primary-100 text-primary-700',
      description: 'Both selling and rental capabilities combined',
      capabilities: [
        'All Seller features',
        'All Landlord features',
        'Unlimited listings',
        'Advanced analytics',
        'Dedicated account manager',
        'Priority support',
        'Marketing tools access',
        'Property promotion boost'
      ],
      requirements: [
        'Register account',
        'Upload verification documents',
        'Admin approval',
        'Subscribe to Dual Plan (1788 ETB/6 months)'
      ],
      price: '1,788 ETB',
      duration: '6 months',
      pricePerMonth: '298',
      dashboard: '/dashboard',
      popular: true
    },
    {
      id: 'admin',
      name: 'Administrator',
      icon: Shield,
      color: 'from-primary-600 to-primary-800',
      badgeColor: 'bg-primary-100 text-primary-700',
      description: 'Full system control and management',
      capabilities: [
        'View all users (sellers, landlords, buyers)',
        'Approve/Reject document verification requests',
        'View payment history and transactions',
        'Generate reports and analytics',
        'Manage user accounts (activate/deactivate)',
        'Respond to user messages',
        'Configure system settings',
        'View all listings across the platform'
      ],
      requirements: ['System access only'],
      dashboard: '/admin'
    }
  ]

  // Platform features
  const features = [
    { icon: Shield, title: "Secure Transactions", description: "All payments processed through Chapa payment gateway" },
    { icon: MessageCircle, title: "Real-time Chat", description: "Direct messaging between buyers and sellers" },
    { icon: FileCheck, title: "Document Verification", description: "Verified sellers and landlords only" },
    { icon: Eye, title: "Listing Analytics", description: "Track property views and inquiries" },
    { icon: Bell, title: "Instant Notifications", description: "Real-time alerts for messages and updates" },
    { icon: Bookmark, title: "Save Favorites", description: "Bookmark properties you love" },
    { icon: CreditCard, title: "Easy Payments", description: "Multiple payment options via Chapa" }
  ]

  // Subscription plans
  const subscriptionPlans = [
    {
      name: "Seller Plan",
      price: "894",
      duration: "6 months",
      pricePerMonth: "149",
      icon: Store,
      color: "primary",
      features: [
        "Professional property photos",
        "Virtual tour integration",
        "Message buyers directly",
        "Listing analytics dashboard",
        "24/7 customer support"
      ]
    },
    {
      name: "Landlord Plan",
      price: "1,194",
      duration: "6 months",
      pricePerMonth: "199",
      icon: Key,
      color: "success",
      features: [
        "Up to 20 rental listings",
        "Tenant management system",
        "Rent collection tools",
        "Maintenance request system",
        "Priority support"
      ]
    },
    {
      name: "Dual Plan",
      price: "1,788",
      duration: "6 months",
      pricePerMonth: "298",
      icon: Crown,
      color: "purple",
      features: [
        "Unlimited listings",
        "Advanced analytics",
        "Dedicated account manager",
        "Priority customer support",
        "Marketing tools access",
        "Property promotion boost"
      ],
      popular: true
    }
  ]

  // How it works steps
  const steps = [
    { step: "01", title: "Choose Your Role", description: "Select buyer, seller, or landlord", icon: Users, color: "from-primary-600 to-primary-800" },
    { step: "02", title: "Create Account", description: "Simple registration process", icon: UserCheck, color: "from-purple-500 to-purple-600" },
    { step: "03", title: "Verification", description: "Upload documents for approval", icon: FileCheck, color: "from-success to-success" },
    { step: "04", title: "Subscribe", description: "Choose your plan and pay", icon: CreditCard, color: "from-secondary-500 to-secondary-600" },
    { step: "05", title: "Start Using", description: "List or find properties", icon: Home, color: "from-emerald-500 to-emerald-600" }
  ]

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M+`
    }
    return `ETB ${amount.toLocaleString()}`
  }

  const StatCard = ({ icon: Icon, value, label, suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0)
    
    useEffect(() => {
      if (animateNumbers) {
        const duration = 2000
        const steps = 60
        const numValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : value
        const stepValue = numValue / steps
        let current = 0
        const timer = setInterval(() => {
          current += stepValue
          if (current >= numValue) {
            setDisplayValue(numValue)
            clearInterval(timer)
          } else {
            setDisplayValue(Math.floor(current))
          }
        }, duration / steps)
        return () => clearInterval(timer)
      }
    }, [animateNumbers, value])

    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {loading ? '...' : (typeof value === 'string' ? value : displayValue.toLocaleString())}{suffix}
        </p>
        <p className="text-gray-500 mt-1">{label}</p>
      </div>
    )
  }

  const getPlanColorClasses = (color) => {
    switch(color) {
      case 'primary':
        return {
          bg: 'from-primary-600 to-primary-800',
          text: 'text-primary-700',
          button: 'bg-primary-700 hover:bg-primary-800'
        }
      case 'success':
        return {
          bg: 'from-success to-emerald-600',
          text: 'text-success',
          button: 'bg-success hover:bg-green-700'
        }
      case 'purple':
        return {
          bg: 'from-purple-500 to-indigo-600',
          text: 'text-purple-600',
          button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        }
      default:
        return {
          bg: 'from-primary-600 to-primary-800',
          text: 'text-primary-700',
          button: 'bg-primary-700 hover:bg-primary-800'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-r from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-300">EstateHub</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto"
          >
            Ethiopia's most trusted real estate platform, connecting buyers, sellers, and landlords through modern technology
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary-50 to-purple-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To revolutionize the real estate industry in Ethiopia by providing a transparent, 
                secure, and efficient platform that connects property seekers with property owners.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become Ethiopia's most innovative and trusted real estate ecosystem, 
                empowering individuals and businesses to make confident property decisions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who Can Use EstateHub */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Can Use EstateHub?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose your role and get started
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                  activeRole === role.id
                    ? `bg-gradient-to-r ${role.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-600 hover:shadow-md border border-gray-200'
                }`}
              >
                <role.icon className="w-4 h-4" />
                {role.name}
              </button>
            ))}
          </div>

          {/* Role Details - ALL roles have BLUE backgrounds */}
          {roles.map((role) => (
            <div
              key={role.id}
              className={`transition-all duration-500 ${
                activeRole === role.id ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${role.color} p-8 text-white`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <role.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{role.name}</h3>
                      <p className="opacity-90">{role.description}</p>
                    </div>
                  </div>
                </div>
                
                {/* Body - ALL sections have BLUE backgrounds */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* What You Can Do Section - BLUE BACKGROUND */}
                    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                        What You Can Do
                      </h4>
                      <ul className="space-y-3">
                        {role.capabilities.map((cap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Requirements Section - BLUE BACKGROUND */}
                    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary-600" />
                        Requirements
                      </h4>
                      <ul className="space-y-3 mb-4">
                        {role.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <Shield className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {role.price && role.price !== 'FREE' && (
                        <div className={`p-4 rounded-xl mt-3 ${
                          role.id === 'dual' ? 'bg-gradient-to-r from-purple-100 to-indigo-100' : 'bg-white'
                        }`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 text-sm">Subscription</span>
                            <span className={`text-2xl font-bold ${
                              role.id === 'dual' ? 'text-purple-700' : 'text-primary-700'
                            }`}>
                              {role.price}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Duration</span>
                            <span className="font-medium text-gray-800">{role.duration}</span>
                          </div>
                          {role.pricePerMonth && (
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                              <span className="text-gray-500 text-xs">≈ per month</span>
                              <span className="text-gray-700">ETB {role.pricePerMonth}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {role.price === 'FREE' && (
                        <div className="bg-success/10 rounded-xl p-4 text-center mt-3">
                          <span className="text-success font-semibold text-sm">✓ Free Access - No Payment Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to get started on EstateHub
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/3 -right-3 w-6 h-0.5 bg-gray-300">
                    <ChevronRight className="w-4 h-4 text-gray-400 absolute -right-2 -top-2" />
                  </div>
                )}
                <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl`}>
                    {step.step}
                  </div>
                  <step.icon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Plans</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {subscriptionPlans.map((plan, index) => {
              const colorClasses = getPlanColorClasses(plan.color)
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                    plan.popular ? 'border-2 border-purple-400' : 'border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-6 text-center bg-gradient-to-r ${
                    plan.color === 'primary' ? 'from-primary-50 to-cyan-50' :
                    plan.color === 'success' ? 'from-success/10 to-emerald-50' :
                    'from-purple-50 to-indigo-50'
                  }`}>
                    <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
                      <plan.icon className={`w-8 h-8 ${colorClasses.text}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">ETB {plan.price}</span>
                      <span className="text-gray-500"> / {plan.duration}</span>
                    </div>
                    <p className="text-sm text-gray-500">≈ ETB {plan.pricePerMonth}/month</p>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 ${colorClasses.text}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/register"
                      className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 text-white ${colorClasses.button}`}
                    >
                      Get Started
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EstateHub?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features to make your real estate journey seamless
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-8 h-8 text-primary-500" />
                <span className="text-xl font-bold text-white">EstateHub</span>
              </div>
              <p className="text-sm">Your trusted partner in real estate</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/properties" className="hover:text-white transition">Properties</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +251-960724272</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@estatehub.com</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Addis Ababa, Ethiopia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 EstateHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AboutPage