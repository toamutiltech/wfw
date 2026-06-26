import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const refreshUser = async (userId: string | number) => {
    try {
      const response = await client.get(`/users.php?id=${userId}`);
      if (response.data && response.data.success && response.data.user) {
        const freshUser = response.data.user;
        setUser(freshUser);
        await AsyncStorage.setItem('userData', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.log('Failed to refresh user data from server', error);
    }
  };

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Silently fetch the latest data from the backend so it's not stuck on the saved state
          if (parsedUser && parsedUser.id) {
            refreshUser(parsedUser.id);
          }
        }
      }
    } catch (e) {
      console.log('Error loading token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await client.post('/auth.php?action=login', { email, password });
      console.log('Login response:', response.data);
      const data = response.data;
      
      // The backend returns a 200 on success and a user object
      if (response.status === 200 || data.token || data.success) {
        const tokenToStore = data.token || `fake-token-${Date.now()}`;
        const userToStore = data.user || { email };
        
        setToken(tokenToStore);
        setUser(userToStore);
        
        await AsyncStorage.setItem('userToken', tokenToStore);
        await AsyncStorage.setItem('userData', JSON.stringify(userToStore));
        
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login Error Details:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Network error occurred' };
    }
  };

  const register = async (name: string, username: string, email: string, password: string) => {
    try {
      console.log('Attempting registration for:', email);
      const response = await client.post('/auth.php?action=register', { 
        username: username,
        full_name: name, 
        email, 
        password 
      });
      console.log('Registration response:', response.data);
      const data = response.data;
      
      // The backend returns a 201 on success
      if (response.status === 201 || data.token || data.success) {
        const tokenToStore = data.token || `fake-token-${Date.now()}`;
        const userToStore = data.user || { name, username, email };
        
        setToken(tokenToStore);
        setUser(userToStore);
        
        await AsyncStorage.setItem('userToken', tokenToStore);
        await AsyncStorage.setItem('userData', JSON.stringify(userToStore));
        
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration Error Details:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || error.message || 'Network error occurred' };
    }
  };

  const updateUser = async (newUserData: any) => {
    setUser(newUserData);
    await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
