import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    const message = error.response?.data?.error || error.message || 'Server Error';
    if (error.response?.status !== 429) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;