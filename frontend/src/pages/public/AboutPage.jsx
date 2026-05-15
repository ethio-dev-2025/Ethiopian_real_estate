import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../../components/layout/Header'
import { 
  Building2, Users, Award, Globe, Shield, Clock, 
  CheckCircle, TrendingUp, Heart, Star, Briefcase,
  MapPin, Phone, Mail, MessageCircle, Facebook, Twitter, 
  Linkedin, Instagram, Youtube, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'

const AboutPage = () => {
  const { t, language } = useLanguage()

  const stats = [
    { value: '10,000+', label: 'Happy Customers', icon: Users },
    { value: '5,000+', label: 'Properties Sold', icon: Building2 },
    { value: '98%', label: 'Satisfaction Rate', icon: Star },
    { value: '24/7', label: 'Customer Support', icon: Clock },
  ]

  const values = [
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'We believe in complete transparency in all our dealings, ensuring our clients have all the information they need to make informed decisions.'
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Our clients are at the heart of everything we do. We go above and beyond to ensure their satisfaction and success.'
    },
    {
      icon: TrendingUp,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service, from property listings to customer support.'
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'We maintain international standards while understanding local Ethiopian market dynamics.'
    }
  ]

  const team = [
    {
      name: 'Melkamu Abebe',
      role: 'CEO & Founder',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: '15+ years in real estate industry'
    },
    {
      name: 'Selam Tesfaye',
      role: 'Head of Sales',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      bio: 'Expert in luxury properties'
    },
    {
      name: 'Dawit Mekonnen',
      role: 'Operations Manager',
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
      bio: 'Ensuring smooth transactions'
    },
    {
      name: 'Helen Assefa',
      role: 'Customer Relations',
      image: 'https://randomuser.me/api/portraits/women/4.jpg',
      bio: 'Dedicated to client satisfaction'
    }
  ]

  const milestones = [
    { year: '2015', title: 'Company Founded', description: 'Started with a vision to transform Ethiopian real estate' },
    { year: '2017', title: 'First 1000 Properties', description: 'Reached milestone of 1000 successful transactions' },
    { year: '2019', title: 'Expanded Nationwide', description: 'Opened offices in major Ethiopian cities' },
    { year: '2021', title: 'Digital Platform Launch', description: 'Launched our advanced online platform' },
    { year: '2024', title: 'Industry Leaders', description: 'Recognized as Ethiopia\'s leading real estate platform' }
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
            About RealEstate Pro
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Ethiopia's most trusted real estate platform, connecting buyers, sellers, and renters since 2015
          </motion.p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
              <div className="w-20 h-1 bg-blue-600 mb-6"></div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Founded in 2015, RealEstate Pro was born from a vision to revolutionize the Ethiopian real estate market. 
                We recognized the need for a transparent, efficient, and trustworthy platform that connects property seekers 
                with verified listings and professional agents.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Over the years, we've grown from a small team of passionate real estate enthusiasts to one of Ethiopia's 
                leading property platforms, facilitating thousands of successful transactions across the country.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we continue to innovate and improve, leveraging technology to make property transactions 
                smoother, faster, and more accessible for everyone.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffc?w=600"
                alt="Our Story"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-5 -right-5 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="font-bold text-gray-900">Best Real Estate</p>
                    <p className="text-sm text-gray-500">Platform 2024</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-500">{stat.label}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Mission & Vision */}
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
                <Globe className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To simplify real estate transactions in Ethiopia by providing a transparent, 
                efficient, and trustworthy platform that connects property seekers with their 
                dream properties and property owners with the right buyers or tenants.
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
                <Star className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become Ethiopia's most innovative and trusted real estate ecosystem, 
                empowering individuals and businesses to make confident property decisions 
                through technology, expertise, and exceptional service.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Key milestones in our journey to transform Ethiopian real estate
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200 hidden md:block"></div>
            <div className="space-y-8 md:space-y-0">
              {milestones.map((milestone, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`md:flex items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} mb-8`}
                >
                  <div className="flex-1 md:text-right">
                    <div className={`bg-white rounded-2xl shadow-lg p-6 ${idx % 2 === 0 ? 'md:mr-8' : 'md:ml-8'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {milestone.year.slice(-2)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:block w-4 h-4 bg-blue-600 rounded-full relative z-10"></div>
                  <div className="flex-1"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Leadership Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dedicated professionals committed to your success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-500 text-sm">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Property?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect property with us
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition group"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default AboutPage