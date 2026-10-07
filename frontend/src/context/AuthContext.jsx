import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('ecocity_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('ecocity_token') || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configured axios instance with auto-token injection
    const authAxios = axios.create({ baseURL: API_URL });
    authAxios.interceptors.request.use((config) => {
        if (token) config.headers.Authorization = `Bearer ${token}`;
        // Prevent strictly-cached GET requests that break dashboard tab routing
        if (config.method === 'get') {
            config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            config.headers['Pragma'] = 'no-cache';
            config.headers['Expires'] = '0';
        }
        return config;
    });

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
            setUser(data);
            setToken(data.token);
            localStorage.setItem('ecocity_user', JSON.stringify(data));
            localStorage.setItem('ecocity_token', data.token);
            return data; // caller uses role to redirect
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const registerCitizen = async (name, email, password, cityId) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/auth/register-citizen`, { name, email, password, cityId });
            setUser(data);
            setToken(data.token);
            localStorage.setItem('ecocity_user', JSON.stringify(data));
            localStorage.setItem('ecocity_token', data.token);
            return data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const registerPartner = async (name, email, password, cityId) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/auth/register-partner`, { name, email, password, cityId });
            return data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('ecocity_user');
        localStorage.removeItem('ecocity_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, registerCitizen, registerPartner, logout, authAxios }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
