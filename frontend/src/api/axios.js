import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  // Use /api for production (relative) and localhost for development
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    // Standardizing the error message extraction
    const message = error.response?.data?.error || error.message || 'Server Error';
    
    // Don't show toast for 429 (Rate Limit) if you handle it in the component
    if (error.response?.status !== 429) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;