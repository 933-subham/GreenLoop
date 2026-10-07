import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../services/api';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('ecocity_user');
      const savedToken = await AsyncStorage.getItem('ecocity_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const data = res.data;
      setUser(data);
      setToken(data.token);
      await AsyncStorage.setItem('ecocity_user', JSON.stringify(data));
      await AsyncStorage.setItem('ecocity_token', data.token);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      throw new Error(msg);
    }
  };

  const registerCitizen = async (name, email, password, cityId) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register-citizen`, { name, email, password, cityId });
      const data = res.data;
      setUser(data);
      setToken(data.token);
      await AsyncStorage.setItem('ecocity_user', JSON.stringify(data));
      await AsyncStorage.setItem('ecocity_token', data.token);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const registerPartner = async (name, email, password, cityId) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register-partner`, { name, email, password, cityId });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Partner registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('ecocity_user');
    await AsyncStorage.removeItem('ecocity_token');
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data) {
        setUser((prev) => ({ ...prev, ...res.data }));
        await AsyncStorage.setItem('ecocity_user', JSON.stringify({ ...user, ...res.data }));
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerCitizen, registerPartner, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
