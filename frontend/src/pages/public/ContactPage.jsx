// src/pages/public/ContactPage.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/layout/Header'
import { 
  Building2, Phone, Mail, MapPin, Clock, Send, 
  User, MessageCircle, CheckCircle,
  Sparkles, ArrowRight, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const ContactPage = () => {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)

  const contactInfo = {
    address: 'Bole, Addis Ababa, Ethiopia',
    phone: '+251-960724272',
    email: 'info@estatehub.com',
    supportEmail: 'support@estatehub.com',
    salesEmail: 'sales@estatehub.com',
    workingHours: 'Monday - Friday: 9:00 AM - 6:00 PM',
    weekendHours: 'Saturday: 10:00 AM - 2:00 PM',
    emergency: '+251-911-234567'
  }

  const offices = [
    {
      city: 'Addis Ababa',
      address: 'Bole Road, Dembel City Center, 4th Floor',
      phone: '+251-960724272',
      email: 'addis@estatehub.com',
      mapUrl: 'https://maps.google.com/?q=Bole+Addis+Ababa+Ethiopia'
    },
    {
      city: 'Adama',
      address: 'Megenagna, Adama City, 2nd Floor',
      phone: '+251-221-123456',
      email: 'adama@estatehub.com',
      mapUrl: 'https://maps.google.com/?q=Adama+Ethiopia'
    },
    {
      city: 'Bahir Dar',
      address: 'Tana Mall, Bahir Dar, 3rd Floor',
      phone: '+251-581-123456',
      email: 'bahirdar@estatehub.com',
      mapUrl: 'https://maps.google.com/?q=Bahir+Dar+Ethiopia'
    }
  ]

  const faqs = [
    {
      question: 'How do I list my property on EstateHub?',
      answer: 'To list your property, you need to register as a seller or landlord, complete document verification, subscribe to a plan, and then you can create your property listing from your dashboard.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept payments through Chapa payment gateway, which supports Telebirr, CBE Birr, credit cards, and bank transfers.'
    },
    {
      question: 'How long does document verification take?',
      answer: 'Document verification typically takes 24-48 hours. Our admin team reviews all documents to ensure authenticity and compliance.'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel your subscription at any time from your dashboard. Your subscription will remain active until the end of the paid period.'
    },
    {
      question: 'Is there a free plan?',
      answer: 'Buyers can use the platform for free. Sellers and landlords need to subscribe to one of our paid plans after document verification.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach us via phone at +251-960724272, email at info@estatehub.com, or through the contact form below. Our support team is available Monday-Friday 9AM-6PM.'
    }
  ]

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`${API_URL}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSubmitted(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
        toast.success(data.message || 'Message sent successfully! We will get back to you soon.')
        
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        toast.error(data.detail || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index)
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
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-300">Us</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto"
          >
            Have questions? We're here to help. Reach out to us anytime.
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">{contactInfo.phone}</p>
              <p className="text-sm text-gray-400 mt-2">Emergency: {contactInfo.emergency}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">{contactInfo.email}</p>
              <p className="text-sm text-gray-400 mt-2">Support: {contactInfo.supportEmail}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600">{contactInfo.address}</p>
              <p className="text-sm text-gray-400 mt-2">Ethiopia</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-700 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Working Hours</h3>
              <p className="text-gray-600 text-sm">{contactInfo.workingHours}</p>
              <p className="text-sm text-gray-400 mt-2">{contactInfo.weekendHours}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Form and FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-500 mb-6">Fill out the form and we'll get back to you within 24 hours</p>
              
              {submitted && (
                <div className="mb-6 p-4 bg-success/10 rounded-xl flex items-center gap-3 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span>Message sent successfully! We'll contact you soon.</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="+251-XXX-XXXXXX"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        placeholder="Property Inquiry"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
                <p className="text-gray-500">Find answers to common questions about our platform</p>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full bg-white p-4 text-left flex justify-between items-center hover:bg-gray-50 transition-all duration-300"
                    >
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${faqOpen === index ? 'rotate-90' : ''}`} />
                    </button>
                    {faqOpen === index && (
                      <div className="bg-gray-50 p-4 text-gray-600 border-t border-gray-100">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Office Locations</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visit us at one of our offices across Ethiopia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offices.map((office, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-primary-700 to-primary-800 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{office.city}</h3>
                <p className="text-gray-500 text-sm mb-3">{office.address}</p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 text-primary-600" /> {office.phone}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4 text-primary-600" /> {office.email}
                  </p>
                </div>
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

export default ContactPage