import apiClient from './client';
import type { IpInvestigationReport, AuditLog } from '../types';

export const investigateIP = async (ip: string): Promise<IpInvestigationReport> => {
  const res = await apiClient.get<IpInvestigationReport>(`/api/ip/${ip}`);
  return res.data;
};

export const getAuditLogs = async (params: {
  page?: number;
  size?: number;
  action?: string;
  username?: string;
} = {}) => {
  const res = await apiClient.get<{ items: AuditLog[]; total: number; page: number; size: number }>(
    '/api/audit-logs',
    { params }
  );
  return res.data;
};
