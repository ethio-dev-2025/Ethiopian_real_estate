// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './index.css'

// ============ GOOGLE OAUTH CONFIGURATION ============
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '288319692601-adv9bogth1c99kp7599fkeeaqimd65if.apps.googleusercontent.com'

if (!GOOGLE_CLIENT_ID) {
  console.error('⚠️ Google Client ID is not defined in environment variables')
} else {
  console.log('✅ Google OAuth configured')
}

// ============ RENDER APPLICATION ============
ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);