// src/components/layout/Footer.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-primary-900 to-primary-800 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/assets/images/image.png" 
                alt="BetFinder" 
                className="w-12 h-12 object-contain rounded-xl shadow-md"
              />
              <span className="text-xl font-bold">BetFinder</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              {t('Our mission is to help Ethiopians find their dream properties with ease and security.')}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-secondary-500 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('Quick Links')}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('Home')}</Link></li>
              <li><Link to="/properties" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('Properties')}</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('About Us')}</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('Contact Us')}</Link></li>
              <li><Link to="/faq" className="text-gray-300 hover:text-secondary-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('For Users')}</h3>
            <ul className="space-y-2">
              <li><Link to="/create-listing" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('Sell Property')}</Link></li>
              <li><Link to="/add-property" className="text-gray-300 hover:text-secondary-500 transition-colors">{t('Rent Property')}</Link></li>
              <li><Link to="/dashboard" className="text-gray-300 hover:text-secondary-500 transition-colors">Dashboard</Link></li>
              <li><Link to="/messages" className="text-gray-300 hover:text-secondary-500 transition-colors">Messages</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('Contact Us')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-secondary-500" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-secondary-500" />
                <span>+251 11 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-secondary-500" />
                <span>info@betfinder.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} BetFinder. {t('All rights reserved.')}
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 text-sm hover:text-secondary-500 transition-colors">
              {t('Privacy Policy')}
            </Link>
            <Link to="/terms" className="text-gray-400 text-sm hover:text-secondary-500 transition-colors">
              {t('Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer