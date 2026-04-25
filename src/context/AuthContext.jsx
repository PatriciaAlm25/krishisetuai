import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Register a new user (mock with persistence)
  async function register(email, password, profileData) {
    const mockUser = { uid: `user-${Date.now()}`, email };
    const profile = { ...mockUser, ...profileData, createdAt: new Date().toISOString() };
    
    // Save to localStorage so login can find it
    const users = JSON.parse(localStorage.getItem('ks_mock_users') || '{}');
    users[email.toLowerCase()] = profile;
    localStorage.setItem('ks_mock_users', JSON.stringify(users));

    setCurrentUser(mockUser);
    setUserProfile(profile);
    return mockUser;
  }

  // Login (mock with persistence)
  async function login(email, password) {
    const users = JSON.parse(localStorage.getItem('ks_mock_users') || '{}');
    const savedProfile = users[email.toLowerCase()];

    if (savedProfile) {
      setCurrentUser({ uid: savedProfile.uid, email: savedProfile.email });
      setUserProfile(savedProfile);
      return savedProfile;
    }

    // Fallback for demo purposes if user wasn't found in localStorage
    const mockUser = { uid: 'demo-user', email };
    const isFarmer = !email.toLowerCase().includes('buyer');
    const mockProfile = { 
        role: isFarmer ? 'farmer' : 'buyer', 
        fullName: 'Demo User', 
        state: 'Maharashtra',
        city: 'Pune'
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
