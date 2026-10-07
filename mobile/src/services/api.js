import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In development, when testing on a physical phone via Expo Go,
// replace with your computer's local Wi-Fi IP address (e.g. 10.45.227.178 or 192.168.x.x)
export const BASE_URL = 'http://10.45.227.178:5000';
export const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('ecocity_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
