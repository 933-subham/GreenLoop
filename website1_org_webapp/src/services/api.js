import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Will be proxied by Vite or run on same domain
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        // Ideally get token from global state/local storage
        const token = localStorage.getItem('ecocity_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Prevent strictly-cached GET requests
        if (config.method === 'get') {
            config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            config.headers['Pragma'] = 'no-cache';
            config.headers['Expires'] = '0';
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
