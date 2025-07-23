import { Position, Option, Transaction, User, Contract } from '@/types';

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cliente HTTP básico
const apiClient = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  post: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  put: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
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

  update: async (id: string, updates: Partial<Position>): Promise<Position> => {
    const response = await apiClient.put(`/positions/${id}`, updates);
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

  update: async (id: string, updates: Partial<Option>): Promise<Option> => {
    const response = await apiClient.put(`/options/${id}`, updates);
    return response.data;
  },

  exercise: async (id: string): Promise<Option> => {
    const response = await apiClient.put(`/options/${id}/exercise`, {});
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/options/${id}`);
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  create: async (user: Omit<User, 'id'>): Promise<User> => {
    const response = await apiClient.post('/users', user);
    return response.data;
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// Contracts API
export const contractsAPI = {
  getAll: async (): Promise<Contract[]> => {
    const response = await apiClient.get('/contracts');
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