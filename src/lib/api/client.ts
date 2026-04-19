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
  // Bust the browser HTTP cache on every GET so a conditional request can't
  // replay a stale 304 body after a mutation. Cache-Control alone isn't
  // enough — the browser may still revalidate with If-None-Match and accept
  // an identical ETag from a buggy backend. A unique query param forces a
  // fresh request each time.
  if (config.method && config.method.toLowerCase() === 'get') {
    config.headers['Cache-Control'] = 'no-store';
    config.headers['Pragma'] = 'no-cache';
    config.params = { ...(config.params || {}), _: Date.now() };
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
        path.startsWith('/team-invite') ||
        path.startsWith('/p/');

      if (!isPublicPath) {
        useAuthStore.getState().logout();
        window.location.assign('/signin');
      }
    }

    return Promise.reject(error);
  },
);
