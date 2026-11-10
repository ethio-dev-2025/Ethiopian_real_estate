// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { PresenceProvider } from './context/PresenceContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  return <AppRoutes />;
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <PresenceProvider>
                <ThemeProvider>
                  <NotificationProvider>
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        success: {
                          duration: 3000,
                          style: {
                            background: '#4caf50',
                            color: 'white',
                          },
                        },
                        error: {
                          duration: 4000,
                          style: {
                            background: '#f44336',
                            color: 'white',
                          },
                        },
                      }}
                    />
                    <AppContent />
                  </NotificationProvider>
                </ThemeProvider>
              </PresenceProvider>
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;