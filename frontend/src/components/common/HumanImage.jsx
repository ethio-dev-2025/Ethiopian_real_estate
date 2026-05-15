import React from 'react'

const HumanImage = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-800 to-purple-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
        <p className="text-lg text-blue-100">Sign in to access your real estate dashboard and manage properties.</p>
        <div className="mt-8 flex gap-4">
          <div className="text-center"><div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div><p className="text-sm">Find Properties</p></div>
          <div className="text-center"><div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p className="text-sm">Secure Payments</p></div>
          <div className="text-center"><div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div><p className="text-sm">Trusted Platform</p></div>
        </div>
      </div>
    </div>
  )
}

export default HumanImage