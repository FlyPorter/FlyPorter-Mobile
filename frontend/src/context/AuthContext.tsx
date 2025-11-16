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
      // Silent fail - user will need to login again
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Backend returns { success, data, message } format
      // axios response structure: response.data = { success, data, message }
      const responseData = response.data;
      
      // Check if response has success field
      if (responseData?.success === false) {
        throw new Error(responseData?.error || responseData?.message || 'Login failed');
      }
      
      // Extract data - could be responseData.data or responseData directly
      const backendData = responseData?.data || responseData;
      
      const { user: backendUser, token: authToken } = backendData;
      
      if (!backendUser || !authToken) {
        throw new Error('Invalid response from server');
      }
      
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
      // Extract user-friendly error message
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Invalid email or password';
      throw new Error(message);
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const response = await authAPI.register(email, password);
      
      // Backend returns { success, data, message } format
      const responseData = response.data;
      
      // Check if response has success field
      if (responseData?.success === false) {
        throw new Error(responseData?.error || responseData?.message || 'Registration failed');
      }
      
      // Extract data - could be responseData.data or responseData directly
      const backendData = responseData?.data || responseData;
      
      const { user: backendUser, token: authToken } = backendData;
      
      if (!backendUser || !authToken) {
        throw new Error('Invalid response from server');
      }
      
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
            phone: phone,
          });
        } catch (profileError) {
          // Continue anyway, user can update later
        }
      }
    } catch (error: any) {
      // Extract user-friendly error message
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint (optional, mainly for logging)
      try {
        await authAPI.logout();
      } catch (apiError) {
        // Continue with local logout even if API call fails
      }
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      // Silent fail - logout should always succeed locally
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

