import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, profileAPI } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { data } = response.data; // Backend returns { success, data, message }
      
      const { user: backendUser, token: authToken } = data;
      
      const user: User = {
        id: backendUser.user_id.toString(),
        email: backendUser.email,
        name: backendUser.email.split('@')[0], // Will be updated when profile is loaded
        role: backendUser.role,
      };

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setToken(authToken);
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Invalid email or password';
      throw new Error(message);
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response = await authAPI.register(email, password);
      const { data } = response.data; // Backend returns { success, data, message }
      
      const { user: backendUser, token: authToken } = data;
      
      const user: User = {
        id: backendUser.user_id.toString(),
        email: backendUser.email,
        name: name, // Use provided name
        role: backendUser.role,
        phone,
      };

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      setToken(authToken);
      setUser(user);
      
      // Update profile with name and phone if provided
      if (name || phone) {
        try {
          await profileAPI.update({
            full_name: name,
            phone_number: phone,
          });
        } catch (profileError) {
          console.error('Profile update error:', profileError);
          // Continue anyway, user can update later
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint (optional, mainly for logging)
      try {
        await authAPI.logout();
      } catch (apiError) {
        console.error('API logout error:', apiError);
        // Continue with local logout even if API call fails
      }
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

