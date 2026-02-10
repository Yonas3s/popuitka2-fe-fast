import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { useAuthStore } from '../../store/auth.store';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const path = window.location.pathname;
      const isPublicPath =
        path.startsWith('/signin') ||
        path.startsWith('/signup') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/verify-reset-code') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/p/');

      if (!isPublicPath) {
        useAuthStore.getState().logout();
        window.location.assign('/signin');
      }
    }

    return Promise.reject(error);
  },
);
