// src/components/layout/Layout.jsx
import React from 'react'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Add padding-top to account for fixed header */}
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout