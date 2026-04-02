import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Interceptor for error handling in the frontend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export const getDatasets = () => api.get('/datasets');
export const getDatasetById = (id) => api.get(`/datasets/${id}`);
export const uploadDataset = (formData) => api.post('/datasets/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const queryDataset = (id, options) => api.post(`/datasets/${id}/query`, options);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);

export default api;
