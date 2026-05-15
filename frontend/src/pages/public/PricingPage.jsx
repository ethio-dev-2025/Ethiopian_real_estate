import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { 
  CheckCircle, Home, Briefcase, Crown, Users,
  Star, Shield, Rocket, ChevronRight,
  Camera, Globe, Award, Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      id: 'seller',
      name: 'Seller Plan',
      icon: Home,
      description: 'Perfect for selling properties',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      features: [
        'Up to 10 active listings',
        'Professional property photos',
        'Virtual tour integration',
        'Priority customer support',
        'Basic analytics dashboard',
        'Email notifications',
        'Social media promotion',
        'Listing featured for 7 days'
      ],
      popular: false,
      color: 'blue',
      buttonText: 'Start Selling',
      recommendedFor: 'Individual sellers'
    },
    {
      id: 'landlord',
      name: 'Landlord Plan',
      icon: Briefcase,
      description: 'Ideal for rental properties',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      features: [
        'Up to 20 rental listings',
        'Tenant management system',
        'Rent collection tools',
        'Maintenance request tracking',
        'Lease agreement templates',
        'Property inspection checklists',
        '24/7 priority support',
        'Rental income analytics'
      ],
      popular: true,
      color: 'purple',
      buttonText: 'Start Renting',
      recommendedFor: 'Property owners & landlords'
    },
    {
      id: 'dual',
      name: 'Dual Plan',
      icon: Crown,
      description: 'Complete real estate solution',
      monthlyPrice: 298,
      yearlyPrice: 2980,
      features: [
        'Unlimited listings (sale & rent)',
        'Advanced analytics & insights',
        'Priority listing placement',
        'Dedicated account manager',
        'API access for integrations',
        'Bulk import/export tools',
        'Custom branding options',
        'White-label reporting'
      ],
      popular: false,
      color: 'gold',
      buttonText: 'Get Started',
      recommendedFor: 'Professional agents & agencies'
    }
  ]

  const addOns = [
    {
      name: 'Featured Listing',
      price: 49,
      description: 'Boost your property to the top of search results',
      icon: Star
    },
    {
      name: 'Professional Photography',
      price: 99,
      description: 'Professional photos of your property',
      icon: Camera
    },
    {
      name: 'Virtual Tour',
      price: 149,
      description: 'Create immersive 360° virtual tours',
      icon: Globe
    },
    {
      name: 'Social Media Boost',
      price: 79,
      description: 'Promote your listing on social media',
      icon: Users
    }
  ]

  const comparisons = [
    { feature: 'Number of listings', seller: '10', landlord: '20', dual: 'Unlimited' },
    { feature: 'Rental management tools', seller: 'Basic', landlord: 'Advanced', dual: 'Full suite' },
    { feature: 'Analytics dashboard', seller: 'Basic', landlord: 'Standard', dual: 'Advanced' },
    { feature: 'Priority support', seller: 'Email', landlord: 'Chat & Email', dual: '24/7 Phone' },
    { feature: 'Featured listings', seller: '1/month', landlord: '3/month', dual: 'Unlimited' },
    { feature: 'Dedicated account manager', seller: 'No', landlord: 'No', dual: 'Yes' },
    { feature: 'API access', seller: 'No', landlord: 'No', dual: 'Yes' },
    { feature: 'Custom branding', seller: 'No', landlord: 'No', dual: 'Yes' }
  ]

  const testimonials = [
    {
      name: 'Melkamu Abebe',
      role: 'Property Developer',
      content: 'The Dual plan transformed how I manage my properties. The analytics and support are outstanding!',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      name: 'Selam Tesfaye',
      role: 'Real Estate Agent',
      content: 'I\'ve increased my sales by 40% since using this platform. The featured listings are a game-changer.',
      rating: 5,
      image: 'https://randomuser.me/api/portraits/women/2.jpg'
    }
  ]

  const getPrice = (price) => {
    return billingCycle === 'monthly' ? price : Math.floor(price * 0.9)
  }

  const getColorStyles = (color) => {
    const styles = {
      blue: {
        from: 'from-blue-600',
        to: 'to-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      },
      purple: {
        from: 'from-purple-600',
        to: 'to-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-700'
      },
      gold: {
        from: 'from-yellow-500',
        to: 'to-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700'
      }
    }
    return styles[color] || styles.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Choose the perfect plan for your real estate needs
          </motion.p>
        </div>
      </section>

      {/* Billing Toggle */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="flex justify-center">
          <div className="bg-white rounded-full shadow-lg p-1 inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                billingCycle === 'monthly' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                billingCycle === 'yearly' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly 
              <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 rounded">Save 10%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => {
              const Icon = plan.icon
              const styles = getColorStyles(plan.color)
              const price = getPrice(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${
                    plan.popular ? 'ring-2 ring-purple-600 transform scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`p-6 bg-gradient-to-r ${styles.from} ${styles.to} text-white`}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-white/80 text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-500">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">{plan.recommendedFor}</p>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 ${styles.text}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      to="/register"
                      className={`block text-center py-3 rounded-xl font-semibold transition ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                          : `border-2 ${styles.border} ${styles.text} hover:bg-${plan.color}-50`
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Add-ons</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enhance your listing with these optional features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, idx) => {
              const Icon = addon.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{addon.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{addon.description}</p>
                  <p className="text-xl font-bold text-blue-600">${addon.price}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Plans</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what each plan includes
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Feature</th>
                  <th className="px-6 py-4 text-center">Seller Plan</th>
                  <th className="px-6 py-4 text-center">Landlord Plan</th>
                  <th className="px-6 py-4 text-center">Dual Plan</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, idx) => (
                  <tr key={idx} className={`border-t ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.feature}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.seller}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.landlord}</td>
                    <td className="px-6 py-4 text-center font-semibold text-purple-600">{item.dual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trusted by thousands of real estate professionals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions about our pricing? We're here to help
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Contact Sales
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <Rocket className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of successful real estate professionals using our platform
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition group"
          >
            Start Your Free Trial
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  )
}

export default PricingPage