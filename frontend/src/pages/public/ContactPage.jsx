import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/layout/Header'
import { 
  MapPin, Phone, Mail, MessageCircle, Clock, Send, 
  Facebook, Twitter, Linkedin, Instagram, Youtube,
  CheckCircle, AlertCircle, Loader, Building2, Users,
  Globe, Headphones, Calendar, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
    }, 1500)
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['Bole Sub City, Woreda 03', 'Addis Ababa, Ethiopia', 'Near Edna Mall'],
      color: 'blue'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+251 11 123 4567', '+251 91 123 4567', 'Mon - Fri, 9am - 6pm'],
      color: 'green'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@realestatepro.com', 'support@realestatepro.com', 'sales@realestatepro.com'],
      color: 'purple'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 9am - 6pm', 'Saturday: 10am - 4pm', 'Sunday: Closed'],
      color: 'orange'
    }
  ]

  const offices = [
    {
      city: 'Addis Ababa',
      address: 'Bole Sub City, Woreda 03, Addis Ababa, Ethiopia',
      phone: '+251 11 123 4567',
      email: 'addis@realestatepro.com',
      map: 'https://maps.google.com/?q=Addis+Ababa+Ethiopia'
    },
    {
      city: 'Bahir Dar',
      address: 'Kebele 05, Near Bahir Dar University, Bahir Dar, Ethiopia',
      phone: '+251 58 123 4567',
      email: 'bahirdar@realestatepro.com',
      map: 'https://maps.google.com/?q=Bahir+Dar+Ethiopia'
    },
    {
      city: 'Hawassa',
      address: 'Sidama Region, Hawassa City, Ethiopia',
      phone: '+251 46 123 4567',
      email: 'hawassa@realestatepro.com',
      map: 'https://maps.google.com/?q=Hawassa+Ethiopia'
    }
  ]

  const faqs = [
    {
      question: 'How do I list my property?',
      answer: 'Simply create an account, verify your identity, and follow our easy listing process. Our team will review and publish your listing within 24 hours.'
    },
    {
      question: 'Is the platform free for buyers?',
      answer: 'Yes! Buyers can browse properties, contact agents, and schedule viewings completely free of charge.'
    },
    {
      question: 'How are properties verified?',
      answer: 'We have a dedicated verification team that checks all properties for authenticity, ownership documents, and legal compliance before listing.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, credit cards, and mobile money through our secure payment gateway.'
    }
  ]

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
            Contact Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            We're here to help! Reach out to us for any questions or support
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon
              const colorClasses = {
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
                orange: 'from-orange-500 to-orange-600'
              }
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${colorClasses[info.color]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{info.title}</h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-gray-600 text-sm">{detail}</p>
                  ))}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-600 mb-8">
                Have a question or need assistance? Fill out the form below and we'll get back to you within 24 hours.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+251 11 123 4567"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Property Inquiry"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                
                {submitted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">Message sent successfully!</span>
                  </div>
                )}
              </form>
            </motion.div>

            {/* Map & Office Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-100 rounded-2xl overflow-hidden mb-6 h-64">
                <iframe
                  title="Office Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.442219037457!2d38.75728000000001!3d9.000000000000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b85cef5a40253%3A0x9e6a2a4e5e5e5e5e!2sAddis%20Ababa%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Connect With Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-600 transition">
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition">
                    <Linkedin className="w-5 h-5 text-white" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition">
                    <Youtube className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Offices Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Offices</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visit us at any of our locations across Ethiopia
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offices.map((office, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{office.city}</h3>
                <p className="text-gray-600 text-sm mb-3">{office.address}</p>
                <p className="text-gray-600 text-sm mb-1">📞 {office.phone}</p>
                <p className="text-gray-600 text-sm mb-3">✉️ {office.email}</p>
                <a href={office.map} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium hover:underline">
                  Get Directions →
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-1">
              View all FAQs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <Headphones className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">24/7 Customer Support</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Our dedicated support team is always ready to assist you
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition group"
          >
            Create Account
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default ContactPage