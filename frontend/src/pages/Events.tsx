import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { SeverityBadge } from '../components/common/Badges';
import { EmptyState, LoadingOverlay, ErrorState } from '../components/common/States';
import { eventsApi } from '../api/events';
import type { SecurityEvent } from '../types';
import { RefreshCw } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<string, string> = {
  authentication_failure: 'Auth Failure',
  authentication_success: 'Auth Success',
  port_scan: 'Port Scan',
  suspicious_login: 'Suspicious Login',
  privilege_escalation: 'Priv Escalation',
  malware_detection: 'Malware',
  firewall_event: 'Firewall',
  network_anomaly: 'Network Anomaly',
  file_access: 'File Access',
  process_execution: 'Process Exec',
};

export const Events: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventsApi.list({
        page, size: 50,
        event_type: typeFilter || undefined,
        severity: severityFilter || undefined,
      });
      setEvents(res.items);
      setTotal(res.total);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [page, typeFilter, severityFilter]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Security Events" subtitle={`${total.toLocaleString()} total events`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="input w-auto text-xs">
            <option value="">All Event Types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }} className="input w-auto text-xs">
            <option value="">All Severities</option>
            {['critical','high','medium','low','info'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button onClick={fetchEvents} className="btn-ghost text-xs ml-auto">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingOverlay />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <EmptyState title="No events found" description="No security events match the current filters." />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sentinel-border bg-sentinel-surface">
                  {['ID','Timestamp','Type','Severity','Source IP','Username','Service','Message'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="table-row">
                    <td className="px-4 py-2.5 text-sentinel-muted font-mono text-xs">{event.id}</td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-muted whitespace-nowrap font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-text">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </td>
                    <td className="px-4 py-2.5"><SeverityBadge severity={event.severity} /></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-sentinel-accent">{event.source_ip}</td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-text">{event.username || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-muted">{event.service || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-muted max-w-xs">
                      <span className="truncate block">{event.message || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 50 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-xs disabled:opacity-40">Previous</button>
            <span className="text-xs text-sentinel-muted">Page {page} of {Math.ceil(total / 50)}</span>
            <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-xs disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};
