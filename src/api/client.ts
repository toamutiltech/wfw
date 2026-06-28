import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logToServer } from '../utils/logger';

// Since we are running on localhost, use the appropriate IP for the emulator
// For Android Emulator, it's typically 10.0.2.2
// For iOS Simulator, it's 127.0.0.1 or localhost
const BASE_URL = 'https://wfw.toamultitech.tech';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;

// Add a response interceptor to log API errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    };
    logToServer(error, errorInfo, 'ERROR');
    return Promise.reject(error);
  }
);
