import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { TopBar } from '../components/Layout/TopBar';
import { SeverityBadge, StatusBadge, RiskScore } from '../components/common/Badges';
import { LoadingOverlay } from '../components/common/States';
import { investigateIP } from '../api/misc';
import type { IpInvestigationReport } from '../types';
import { Search, Shield, Clock } from 'lucide-react';

export const IPInvestigation: React.FC = () => {
  const [ip, setIp] = useState('');
  const [report, setReport] = useState<IpInvestigationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await investigateIP(ip.trim());
      setReport(data);
    } catch {
      setError('Failed to fetch investigation data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="IP Investigation" subtitle="Threat intelligence and event correlation by IP" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sentinel-muted" />
            <input
              id="ip-search"
              value={ip}
              onChange={e => setIp(e.target.value)}
              placeholder="Enter IP address (e.g. 185.220.101.47)"
              className="input pl-9 font-mono"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !ip.trim()}>
            {loading ? 'Investigating...' : 'Investigate'}
          </button>
        </form>

        {error && <p className="text-sentinel-red text-sm mb-4">{error}</p>}

        {loading ? (
          <LoadingOverlay />
        ) : report && !report.found ? (
          <div className="card text-center py-12">
            <Shield className="w-12 h-12 text-sentinel-green mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold text-sentinel-text mb-2">No Activity Found</h3>
            <p className="text-sentinel-muted">{report.message}</p>
          </div>
        ) : report && report.summary ? (
          <div className="space-y-5 animate-fade-in">
            {/* IP Header */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Investigating</div>
                  <h2 className="text-3xl font-bold font-mono text-sentinel-accent mb-2">{report.ip_address}</h2>
                  <div className="flex items-center gap-4 text-sm text-sentinel-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      First: {report.summary.first_seen ? format(new Date(report.summary.first_seen), 'MMM d, HH:mm') : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Last: {report.summary.last_seen ? format(new Date(report.summary.last_seen), 'MMM d, HH:mm') : '—'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold"><RiskScore score={report.summary.risk_score} /></div>
                  <div className="text-xs text-sentinel-muted">Risk Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-sentinel-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sentinel-text">{report.summary.total_events}</div>
                  <div className="text-xs text-sentinel-muted">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sentinel-text">{report.summary.total_incidents}</div>
                  <div className="text-xs text-sentinel-muted">Incidents</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${report.summary.open_incidents > 0 ? 'text-sentinel-red' : 'text-sentinel-green'}`}>
                    {report.summary.open_incidents}
                  </div>
                  <div className="text-xs text-sentinel-muted">Open</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Event type breakdown */}
              {report.event_type_breakdown && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-sentinel-text mb-3">Event Types</h3>
                  <div className="space-y-2">
                    {Object.entries(report.event_type_breakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const max = Math.max(...Object.values(report.event_type_breakdown!));
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-sentinel-text">{type.replace(/_/g, ' ')}</span>
                              <span className="text-sentinel-muted">{count}</span>
                            </div>
                            <div className="h-1.5 bg-sentinel-border rounded-full">
                              <div className="h-full bg-sentinel-accent/60 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Incidents */}
              {report.incidents && report.incidents.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-sentinel-text mb-3">Incidents ({report.incidents.length})</h3>
                  <div className="space-y-2">
                    {report.incidents.map(i => (
                      <button
                        key={i.id}
                        onClick={() => navigate(`/incidents/${i.id}`)}
                        className="w-full text-left p-2 rounded-lg border border-sentinel-border/50 hover:bg-sentinel-surface/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <SeverityBadge severity={i.severity} />
                          <StatusBadge status={i.status} />
                          <RiskScore score={i.risk_score} className="text-xs ml-auto" />
                        </div>
                        <p className="text-xs text-sentinel-text truncate">{i.title}</p>
                        <p className="text-xs text-sentinel-muted">{i.detection_rule}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent events */}
            {report.recent_events && report.recent_events.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-sentinel-text mb-3">Recent Events</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-sentinel-border">
                        {['Time','Type','Severity','Username','Service','Message'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-sentinel-muted font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.recent_events.map(e => (
                        <tr key={e.id} className="border-b border-sentinel-border/30 hover:bg-sentinel-surface/30">
                          <td className="px-3 py-2 text-sentinel-muted whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                          <td className="px-3 py-2 text-sentinel-text">{e.event_type.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2"><SeverityBadge severity={e.severity} /></td>
                          <td className="px-3 py-2 text-sentinel-text">{e.username || '—'}</td>
                          <td className="px-3 py-2 text-sentinel-muted">{e.service || '—'}</td>
                          <td className="px-3 py-2 text-sentinel-muted max-w-xs"><span className="truncate block">{e.message || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
