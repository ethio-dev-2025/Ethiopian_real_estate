// src/contexts/RoleContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setRole(savedRole);
      setHasSelectedRole(true);
    }
  }, []);

  const selectRole = (newRole) => {
    setRole(newRole);
    setHasSelectedRole(true);
    localStorage.setItem('userRole', newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: selectRole, hasSelectedRole }}>
      {children}
    </RoleContext.Provider>
  );
};