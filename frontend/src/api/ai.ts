import apiClient from './client';
import type { AiAnalysis } from '../types';

interface AiAnalysisResponse {
  incident_id: number;
  cached: boolean;
  analysis: AiAnalysis;
}

export const aiApi = {
  analyze: async (incidentId: number) => {
    const res = await apiClient.post<AiAnalysisResponse>(`/api/ai/analyze/${incidentId}`);
    return res.data;
  },

  clearCache: async (incidentId: number) => {
    await apiClient.delete(`/api/ai/analyze/${incidentId}/cache`);
  },
};
