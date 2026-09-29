import apiClient from './client';
import type { Token, User } from '../types';

export const authApi = {
  register: async (data: { username: string; email: string; password: string; full_name?: string }) => {
    const res = await apiClient.post<User>('/api/auth/register', data);
    return res.data;
  },

  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post<Token>('/api/auth/login', credentials);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get<User>('/api/auth/me');
    return res.data;
  },
};
