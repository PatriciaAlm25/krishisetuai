import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Register a new user (mock)
  async function register(email, password, profileData) {
    // Mock user creation without Firebase
    const mockUser = { uid: 'mock-user-123', email };
    const profile = { ...mockUser, ...profileData, createdAt: new Date().toISOString() };
    
    setCurrentUser(mockUser);
    setUserProfile(profile);
    return mockUser;
  }

  // Login (mock)
  async function login(email, password) {
    // Basic mock login - defaults to farmer unless 'buyer' is in the email
    const mockUser = { uid: 'mock-user-123', email };
    const isFarmer = !email.toLowerCase().includes('buyer');
    
    const mockProfile = { 
        role: isFarmer ? 'farmer' : 'buyer', 
        fullName: 'Demo User', 
        state: 'Maharashtra',
        city: 'Pune',
        landSize: '5'
    };
    
    setCurrentUser(mockUser);
    setUserProfile(mockProfile);
    return mockUser;
  }

  // Logout
  async function logout() {
    setCurrentUser(null);
    setUserProfile(null);
  }

  const value = { currentUser, userProfile, register, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
