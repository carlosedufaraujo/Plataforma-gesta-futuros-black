import axios from 'axios';
import { Position, Option, Transaction, User, Contract } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Configuração do Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Positions API
export const positionsAPI = {
  getAll: async (): Promise<Position[]> => {
    const response = await apiClient.get('/positions');
    return response.data;
  },

  create: async (position: Omit<Position, 'id'>): Promise<Position> => {
    const response = await apiClient.post('/positions', position);
    return response.data;
  },

  update: async (id: string, position: Partial<Position>): Promise<Position> => {
    const response = await apiClient.put(`/positions/${id}`, position);
    return response.data;
  },

  close: async (id: string, closePrice: number): Promise<Position> => {
    const response = await apiClient.put(`/positions/${id}/close`, { closePrice });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/positions/${id}`);
  },
};

// Options API
export const optionsAPI = {
  getAll: async (): Promise<Option[]> => {
    const response = await apiClient.get('/options');
    return response.data;
  },

  create: async (option: Omit<Option, 'id'>): Promise<Option> => {
    const response = await apiClient.post('/options', option);
    return response.data;
  },

  update: async (id: string, option: Partial<Option>): Promise<Option> => {
    const response = await apiClient.put(`/options/${id}`, option);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/options/${id}`);
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (filters?: { startDate?: string; endDate?: string }): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/transactions?${params.toString()}`);
    return response.data;
  },
};

// Contracts API
export const contractsAPI = {
  getAll: async (): Promise<Contract[]> => {
    const response = await apiClient.get('/contracts');
    return response.data;
  },

  getCurrentPrices: async (): Promise<Record<string, number>> => {
    const response = await apiClient.get('/prices/current');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getRentability: async (): Promise<{
    totalPnL: number;
    roi: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    capitalEvolution: Array<{ date: string; value: number }>;
  }> => {
    const response = await apiClient.get('/analytics/rentability');
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  get: async (): Promise<any> => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  update: async (settings: any): Promise<any> => {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  },
};

export default apiClient; 