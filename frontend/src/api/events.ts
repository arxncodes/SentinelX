import apiClient from './client';
import type { SecurityEvent, EventListResponse } from '../types';

interface EventFilters {
  page?: number;
  size?: number;
  event_type?: string;
  severity?: string;
  source_ip?: string;
}

export const eventsApi = {
  list: async (filters: EventFilters = {}) => {
    const res = await apiClient.get<EventListResponse>('/api/events', { params: filters });
    return res.data;
  },

  get: async (id: number) => {
    const res = await apiClient.get<SecurityEvent>(`/api/events/${id}`);
    return res.data;
  },

  ingest: async (event: {
    source_ip: string;
    event_type: string;
    severity?: string;
    username?: string;
    service?: string;
    port?: number;
    hostname?: string;
    message?: string;
    timestamp?: string;
  }) => {
    const res = await apiClient.post<SecurityEvent>('/api/events', event);
    return res.data;
  },
};
