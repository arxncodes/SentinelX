import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { TopBar } from '../components/Layout/TopBar';
import { EmptyState, LoadingOverlay } from '../components/common/States';
import { getAuditLogs } from '../api/misc';
import type { AuditLog } from '../types';
import { FileText, RefreshCw } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  'user.login': 'text-sentinel-green',
  'user.logout': 'text-sentinel-muted',
  'incident.status_changed': 'text-sentinel-amber',
  'incident.assigned': 'text-sentinel-accent',
  'asset.created': 'text-sentinel-green',
  'asset.updated': 'text-sentinel-accent',
};

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ page, size: 50, action: actionFilter || undefined });
      setLogs(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Audit Logs" subtitle={`${total} total log entries`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-3 mb-5">
          <input
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            className="input w-64 text-xs"
          />
          <button onClick={fetchLogs} className="btn-ghost text-xs ml-auto">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? <LoadingOverlay /> : logs.length === 0 ? (
          <EmptyState title="No audit logs" icon={<FileText className="w-7 h-7 text-sentinel-muted" />} />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sentinel-border bg-sentinel-surface">
                  {['Timestamp','User','Action','Resource','Details','IP Address'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-sentinel-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="table-row">
                    <td className="px-4 py-2.5 text-xs font-mono text-sentinel-muted whitespace-nowrap">
                      {format(new Date(log.timestamp), 'MMM d HH:mm:ss')}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-sentinel-text">{log.username || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-mono ${ACTION_COLORS[log.action] || 'text-sentinel-text/80'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-muted">
                      {log.resource_type && <span>{log.resource_type} #{log.resource_id}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sentinel-muted max-w-xs">
                      {log.details ? <span className="truncate block font-mono">{JSON.stringify(log.details)}</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-sentinel-muted">{log.ip_address || '—'}</td>
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
