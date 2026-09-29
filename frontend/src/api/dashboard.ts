import apiClient from './client';
import type { DashboardStats, ActivityPoint, TopSourceIP, Incident } from '../types';

export const dashboardApi = {
  getStats: async () => {
    const res = await apiClient.get<DashboardStats>('/api/dashboard/stats');
    return res.data;
  },

  getActivity: async (hours = 24) => {
    const res = await apiClient.get<ActivityPoint[]>('/api/dashboard/activity', { params: { hours } });
    return res.data;
  },

  getTopSourceIPs: async (limit = 10, hours = 24) => {
    const res = await apiClient.get<TopSourceIP[]>('/api/dashboard/top-source-ips', { params: { limit, hours } });
    return res.data;
  },

  getRecentIncidents: async (limit = 10) => {
    const res = await apiClient.get<Incident[]>('/api/dashboard/recent-incidents', { params: { limit } });
    return res.data;
  },
};
