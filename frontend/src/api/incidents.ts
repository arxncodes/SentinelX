import apiClient from './client';
import type { Incident, IncidentListResponse, IncidentSeverity, IncidentStatus } from '../types';

export const incidentsApi = {
  list: async (params: {
    page?: number;
    size?: number;
    status?: string;
    severity?: string;
    source_ip?: string;
  } = {}) => {
    const res = await apiClient.get<IncidentListResponse>('/api/incidents', { params });
    return res.data;
  },

  get: async (id: number) => {
    const res = await apiClient.get<Incident>(`/api/incidents/${id}`);
    return res.data;
  },

  update: async (id: number, data: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    assigned_to?: number;
    title?: string;
    description?: string;
  }) => {
    const res = await apiClient.patch<Incident>(`/api/incidents/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/incidents/${id}`);
  },
};
