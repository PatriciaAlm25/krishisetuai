import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ks_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const mapped = { ...parsed, fullName: parsed.fullName || parsed.full_name };
      setCurrentUser({ id: mapped.id, uid: mapped.id, email: mapped.email });
      setUserProfile(mapped);
    }
    setLoading(false);
  }, []);


  // Register a new user in the custom 'users' table
  async function register(email, password, profileData) {
    const { role, fullName, mobile, ...metadata } = profileData;
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password: password,
        role: role,
        full_name: fullName,
        mobile: mobile,
        metadata: metadata
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Email already registered');
      throw error;
    }

    const mappedData = { ...data, fullName: data.full_name, ...data.metadata };
    const user = { id: data.id, uid: data.id, email: data.email };
    setCurrentUser(user);
    setUserProfile(mappedData);
    localStorage.setItem('ks_user', JSON.stringify(mappedData));
    return mappedData;
  }

  // Login by checking the custom 'users' table
  async function login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    const mappedData = { ...data, fullName: data.full_name, ...data.metadata };
    const user = { id: data.id, uid: data.id, email: data.email };
    setCurrentUser(user);
    setUserProfile(mappedData);
    localStorage.setItem('ks_user', JSON.stringify(mappedData));
    return mappedData;
  }



  // Logout
  async function logout() {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('ks_user');
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

