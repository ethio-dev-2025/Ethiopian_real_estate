// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
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
                <AppRoutes />
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;