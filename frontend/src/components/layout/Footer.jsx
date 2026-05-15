import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const Footer = ({ language }) => {
  const currentYear = new Date().getFullYear()

  const t = (key) => {
    if (language === 'en') return key
    
    const translations = {
      'About Us': 'ስለእኛ',
      'About RealEstate Pro': 'ስለ ሪል እስቴት ፕሮ',
      'Our mission is to help Ethiopians find their dream properties with ease and security.': 'ተልዕኮአችን ኢትዮጵያውያን በቀላሉ እና በደህንነት ህልማቸውን ንብረቶች እንዲያገኙ መርዳት ነው።',
      'Quick Links': 'ፈጣን አገናኞች',
      'Properties': 'ንብረቶች',
      'Sell Property': 'ንብረት ሽጥ',
      'Rent Property': 'ንብረት ኪራይ',
      'Contact Us': 'አግኙን',
      'Follow Us': 'ተከተሉን',
      'All rights reserved.': 'ሁሉም መብቶች የተጠበቁ ናቸው።',
      'Privacy Policy': 'የግላዊነት ፖሊሲ',
      'Terms of Service': 'የአገልግሎት ውሎች'
    }
    return translations[key] || key
  }

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">RealEstate Pro</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {t('Our mission is to help Ethiopians find their dream properties with ease and security.')}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('Quick Links')}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">{t('Home')}</Link></li>
              <li><Link to="/properties" className="text-gray-400 hover:text-white transition-colors">{t('Properties')}</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">{t('About Us')}</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">{t('Contact Us')}</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('For Users')}</h3>
            <ul className="space-y-2">
              <li><Link to="/create-listing" className="text-gray-400 hover:text-white transition-colors">{t('Sell Property')}</Link></li>
              <li><Link to="/add-property" className="text-gray-400 hover:text-white transition-colors">{t('Rent Property')}</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/messages" className="text-gray-400 hover:text-white transition-colors">Messages</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('Contact Us')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5" />
                <span>+251 11 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5" />
                <span>info@realestatepro.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} RealEstate Pro. {t('All rights reserved.')}
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">
              {t('Privacy Policy')}
            </Link>
            <Link to="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">
              {t('Terms of Service')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer