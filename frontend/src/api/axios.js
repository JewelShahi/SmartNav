import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    const message = error.response?.data?.error || error.message || 'Server Error';
    
    // Silent handling for AbortController or intentional Rate Limit ignores
    if (error.code !== 'ERR_CANCELED' && error.response?.status !== 429) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
