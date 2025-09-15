import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SearchResponse, AuthResponse, LoginRequest, RegisterRequest, User, FavoritesResponse } from '../types';
import { navigationService } from './navigationService';

const API_BASE_URL = 'http://localhost:8000'; 

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        
        
        // Only attempt refresh if:
        // 1. Status is 401 (Unauthorized)
        // 2. Request hasn't been retried yet
        // 3. This is not already a refresh request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/refresh')) {
              
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const newToken = await SecureStore.getItemAsync('access_token');
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed, redirecting to login:', refreshError);
            await this.logout();
            navigationService.navigateToLogin();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post('/auth/login', credentials);
    await SecureStore.setItemAsync('access_token', response.data.access_token);
    await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
    await SecureStore.setItemAsync('user_name', response.data.user_name);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post('/auth/register', userData);
    await SecureStore.setItemAsync('access_token', response.data.access_token);
    await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
    await SecureStore.setItemAsync('user_name', response.data.user_name);
    return response.data;
  }

  async logout(navigateToLogin: boolean = false): Promise<void> {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_name');
      
      if (navigateToLogin) {
        navigationService.navigateToLogin();
      } 
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.axiosInstance.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) {
      console.error('No refresh token available');
      throw new Error('No refresh token available');
    }
    
    const response = await this.axiosInstance.post('/auth/refresh', {
      refresh_token: refreshToken
    });
    
    await SecureStore.setItemAsync('access_token', response.data.access_token);
    await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
    await SecureStore.setItemAsync('user_name', response.data.user_name);
    
    return response.data;
  }

  // Cafe endpoints
  async searchCafes(query: string): Promise<SearchResponse> {
    const response = await this.axiosInstance.post('/search', {
      query
    });
    return response.data;
  }

  async getTopPlaces(): Promise<SearchResponse> {
    const response = await this.axiosInstance.get('/search/top-places');
    return response.data;
  }

  // Favorites endpoints
  async getFavorites(): Promise<FavoritesResponse> {
    const response = await this.axiosInstance.get('/favorites/');
    return response.data;
  }

  async toggleFavorite(placeId: string): Promise<boolean> {
    const response = await this.axiosInstance.post(`/favorites/toggle?place_id=${placeId}`);
    return response.data;
  }

  async isFavorite(placeId: string): Promise<boolean> {
    const response = await this.axiosInstance.get(`/favorites/check?place_id=${placeId}`);
    return response.data;
  }

  async checkToken(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return false;
      
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
