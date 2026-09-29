import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/layout/Header'
import { 
  Building2, Users, Shield, Clock, 
  CheckCircle, Eye, MessageSquare, Bell,
  MapPin, Phone, Mail, ChevronRight, Crown,
  Key, Store, UserCheck, CreditCard, FileCheck,
  Target, Home, Award, Briefcase, Globe, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

const AboutPage = () => {
  const { t, language } = useLanguage()
  const [animateNumbers] = useState(false)
  const statsRef = useRef(null)

  // Role Cards (Simple cards like Mission & Vision - NO BUTTONS)
  const roleCards = [
    {
      id: 'buyer',
      name: 'Buyer / Tenant',
      icon: Users,
      color: 'from-blue-600 to-purple-700',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'Browse and inquire about properties',
      features: ['Browse all listings', 'Search & filter properties', 'Save favorites', 'Contact sellers', 'Free access']
    },
    {
      id: 'seller',
      name: 'Property Seller',
      icon: Store,
      color: 'from-green-600 to-emerald-700',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: 'Create and manage property listings for sale',
      features: ['Create listings', 'Edit/Delete listings', 'View analytics', 'Receive messages', 'Manage subscription']
    },
    {
      id: 'landlord',
      name: 'Landlord',
      icon: Key,
      color: 'from-orange-600 to-red-700',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      description: 'Create and manage rental property listings',
      features: ['Create rental listings', 'Manage tenants', 'Track rental income', 'Receive messages', 'Manage subscription']
    },
    {
      id: 'dual',
      name: 'Dual (Seller + Landlord)',
      icon: Crown,
      color: 'from-purple-600 to-pink-700',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      description: 'Both selling and rental capabilities combined',
      features: ['All seller features', 'All landlord features', 'Unlimited listings', 'Advanced analytics', 'Priority support']
    },
    {
      id: 'admin',
      name: 'Administrator',
      icon: Shield,
      color: 'from-red-600 to-pink-700',
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      description: 'Full system control and management',
      features: ['View all users', 'Approve verifications', 'View payments', 'Generate reports', 'Manage settings']
    }
  ]

  const features = [
    { icon: Shield, title: "Secure Transactions", description: "All payments processed through Chapa payment gateway" },
    { icon: MessageSquare, title: "Real-time Chat", description: "Direct messaging between buyers and sellers" },
    { icon: FileCheck, title: "Document Verification", description: "Verified sellers and landlords only" },
    { icon: Eye, title: "Listing Analytics", description: "Track property views and inquiries" },
    { icon: Bell, title: "Instant Notifications", description: "Real-time alerts for messages and updates" },
    { icon: CreditCard, title: "Easy Payments", description: "Multiple payment options via Chapa" }
  ]

  const subscriptionPlans = [
    {
      name: "Seller Plan",
      price: "894",
      duration: "6 months",
      pricePerMonth: "149",
      icon: Store,
      color: "blue",
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
      color: "purple",
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
      color: "gradient",
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

  // Steps with equal height and width
  const steps = [
    { step: "01", title: "Choose Your Role", description: "Select buyer, seller, or landlord", icon: Users, color: "from-blue-600 to-purple-700" },
    { step: "02", title: "Create Account", description: "Simple registration process", icon: UserCheck, color: "from-purple-500 to-pink-500" },
    { step: "03", title: "Verification", description: "Upload documents for approval", icon: FileCheck, color: "from-green-500 to-emerald-500" },
    { step: "04", title: "Subscribe", description: "Choose your plan and pay", icon: CreditCard, color: "from-orange-500 to-red-500" },
    { step: "05", title: "Start Using", description: "List or find properties", icon: Home, color: "from-teal-500 to-cyan-500" }
  ]

  const getPlanColorClasses = (color) => {
    switch(color) {
      case 'blue':
        return {
          bg: 'from-blue-600 to-blue-700',
          text: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'purple':
        return {
          bg: 'from-purple-600 to-purple-700',
          text: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'gradient':
        return {
          bg: 'from-blue-600 to-purple-700',
          text: 'text-purple-600',
          button: 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800'
        }
      default:
        return {
          bg: 'from-blue-600 to-purple-700',
          text: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section - Blue to Purple Gradient */}
      <section className="relative pt-24 pb-16 bg-gradient-to-r from-blue-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">EstateHub</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Ethiopia's most trusted real estate platform, connecting buyers, sellers, and landlords through modern technology
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-blue-600" />
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

      {/* Who Can Use EstateHub - SIMPLE CARDS (No Buttons) */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Can Use EstateHub?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform serves different types of users
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {roleCards.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                <div className={`${role.bgColor} p-6 text-center border-b`}>
                  <div className={`w-16 h-16 ${role.iconBg} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <role.icon className={`w-8 h-8 ${role.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                </div>
                <div className="p-4 flex-1">
                  <ul className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Equal Height Cards */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to get started on EstateHub
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 flex flex-col h-full"
              >
                <div>
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-md`}>
                    {step.step}
                  </div>
                  <step.icon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
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
                  className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col ${
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
                    plan.color === 'blue' ? 'from-blue-50 to-cyan-50' :
                    plan.color === 'purple' ? 'from-purple-50 to-pink-50' :
                    'from-blue-50 to-purple-50'
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
                  
                  <div className="p-6 flex-1">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 ${colorClasses.text}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-6 pt-0">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
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
                <Building2 className="w-8 h-8 text-blue-500" />
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