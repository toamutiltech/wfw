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

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
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
      const response = await client.post('/auth.php?action=login', { email, password });
      const data = response.data;
      
      // Check if API returns a token or just a success flag
      if (data.token || data.success) {
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
      console.error(error);
      return { success: false, message: error.response?.data?.message || 'Network error occurred' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await client.post('/auth.php?action=register', { 
        username: email.split('@')[0], // Automatically generate a username
        full_name: name, 
        email, 
        password 
      });
      const data = response.data;
      
      if (data.token || data.success) {
        const tokenToStore = data.token || `fake-token-${Date.now()}`;
        const userToStore = data.user || { name, email };
        
        setToken(tokenToStore);
        setUser(userToStore);
        
        await AsyncStorage.setItem('userToken', tokenToStore);
        await AsyncStorage.setItem('userData', JSON.stringify(userToStore));
        
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: error.response?.data?.message || 'Network error occurred' };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
