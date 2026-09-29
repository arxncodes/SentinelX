import apiClient from './client';
import type { Asset } from '../types';

export const assetsApi = {
  list: async (status?: string) => {
    const res = await apiClient.get<Asset[]>('/api/assets', { params: status ? { status } : {} });
    return res.data;
  },

  get: async (id: number) => {
    const res = await apiClient.get<Asset>(`/api/assets/${id}`);
    return res.data;
  },

  create: async (data: Partial<Asset>) => {
    const res = await apiClient.post<Asset>('/api/assets', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Asset>) => {
    const res = await apiClient.patch<Asset>(`/api/assets/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/assets/${id}`);
  },
};
