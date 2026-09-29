import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { TopBar } from '../components/Layout/TopBar';
import { SeverityBadge, StatusBadge, RiskScore } from '../components/common/Badges';
import { EmptyState, LoadingOverlay, ErrorState } from '../components/common/States';
import { incidentsApi } from '../api/incidents';
import type { Incident } from '../types';
import { RefreshCw, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False Positive' },
];

const SEVERITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await incidentsApi.list({
        page,
        size: 25,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setIncidents(res.items);
      setTotal(res.total);
    } catch {
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [page, statusFilter, severityFilter]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Incidents" subtitle={`${total} total incidents`} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto text-xs"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="input w-auto text-xs"
          >
            {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={fetchIncidents} className="btn-ghost text-xs ml-auto">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingOverlay />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchIncidents} />
        ) : incidents.length === 0 ? (
          <EmptyState title="No incidents found" description="No incidents match the current filters." />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sentinel-border bg-sentinel-surface">
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Severity</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Risk</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Source IP</th>
                  <th className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    <td className="px-4 py-3 text-sentinel-muted font-mono">#{incident.id}</td>
                    <td className="px-4 py-3 text-sentinel-text font-medium max-w-xs">
                      <span className="truncate block">{incident.title}</span>
                      {incident.detection_rule && (
                        <span className="text-xs text-sentinel-muted">{incident.detection_rule.replace(/_/g, ' ')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={incident.status} /></td>
                    <td className="px-4 py-3"><RiskScore score={incident.risk_score} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-sentinel-accent">{incident.source_ip || '—'}</td>
                    <td className="px-4 py-3 text-xs text-sentinel-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-sentinel-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-40">
              Previous
            </button>
            <span className="text-xs text-sentinel-muted">Page {page} of {Math.ceil(total / 25)}</span>
            <button disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
