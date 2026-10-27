// src/components/common/ResponsiveContainer.jsx
import React from 'react';

const ResponsiveContainer = ({ 
  children, 
  maxWidth = '1280px',
  padding = true,
  className = '' 
}) => {
  return (
    <div 
      className={`mx-auto w-full ${padding ? 'px-4 sm:px-6 lg:px-8' : ''} ${className}`}
      style={{ maxWidth }}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;