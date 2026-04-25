import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_TIMEOUT_MS = 12000;

// Resolve Metro host (for Expo Go) so API host matches the running dev machine IP
const getExpoMetroHost = () => {
  const hostUriFromExpoConfig = Constants?.expoConfig?.hostUri;
  if (hostUriFromExpoConfig) {
    return hostUriFromExpoConfig.split(':')[0];
  }

  const debuggerHostFromManifest = Constants?.manifest?.debuggerHost;
  if (debuggerHostFromManifest) {
    return debuggerHostFromManifest.split(':')[0];
  }

  const hostUriFromManifest2 = Constants?.manifest2?.extra?.expoClient?.hostUri;
  if (hostUriFromManifest2) {
    return hostUriFromManifest2.split(':')[0];
  }

  return null;
};

// Simple API URL generation without external dependencies
const generateApiBaseUrl = () => {
  const port = process.env.EXPO_PUBLIC_API_PORT || '3001';

  // In native dev (Expo Go), prefer Metro host to avoid stale hardcoded IPs.
  if (__DEV__ && Platform.OS !== 'web') {
    const metroHost = getExpoMetroHost();
    if (metroHost) {
      return `http://${metroHost}:${port}`;
    }
  }

  // Use environment variables set by setup-network.js
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const host = process.env.EXPO_PUBLIC_API_HOST || 'localhost';
  return `http://${host}:${port}`;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://edragfuoklcgdgtospuq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcmFnZnVva2xjZ2RndG9zcHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDE3MjMsImV4cCI6MjA3MjExNzcyM30.A58Ms03zTZC6J5OuhQbkkZQy-5uTxgu4vlLilrjPEwo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Dynamic API URL configuration for any device/network
const getApiBaseUrl = () => {
  return generateApiBaseUrl();
};

// API configuration - Works on any device
export const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API_BASE_URL configured as:', API_BASE_URL);
console.log('📡 Expo Metro host detected as:', getExpoMetroHost() || 'NOT_DETECTED');
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Development mode:', __DEV__);

export const apiClient = {
  // Base URL for constructing custom endpoints
  baseUrl: API_BASE_URL,

  // Health check endpoint
  health: `${API_BASE_URL}/health`,

  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    signup: `${API_BASE_URL}/api/auth/signup`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },
  // Complaint endpoints
  complaints: {
    all: `${API_BASE_URL}/api/complaints/all`,
    create: `${API_BASE_URL}/api/complaints/create`,
    submit: `${API_BASE_URL}/api/complaints/submit`,
    personalReports: `${API_BASE_URL}/api/complaints/personal-reports`,
  },
  // Admin endpoints
  admin: {
    dashboard: `${API_BASE_URL}/api/admin/dashboard`,
  },
  // Heatmap endpoints
  heatMap: {
    data: `${API_BASE_URL}/api/heat-map/data`,
    statistics: `${API_BASE_URL}/api/heat-map/statistics`,
  },
};

// Enhanced API call function with auto-discovery
export const makeApiCall = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    console.log('📡 Making API call to:', url);

    const token = await AsyncStorage.getItem('authToken');

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    console.log('📤 Request details:', {
      url,
      method: mergedOptions.method || 'GET',
      headers: mergedOptions.headers,
      body: mergedOptions.body ? 'DATA_PRESENT' : 'NO_BODY'
    });

    const response = await fetch(url, mergedOptions);
    console.log('📥 Response status:', response.status);

    const data = await response.json();
    console.log('📋 Response data:', data);

    if (!response.ok) {
      console.error('❌ API Error:', data);
      throw new Error(data.message || `HTTP ${response.status}: API call failed`);
    }

    return data;
  } catch (error) {
    console.error('🚨 API call error details:', {
      message: error.message,
      url,
      stack: error.stack
    });

    if (error.name === 'AbortError') {
      throw new Error('Server request timed out. Please check backend connectivity and try again.');
    }

    // Provide more specific error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Make sure the backend is running and accessible.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
