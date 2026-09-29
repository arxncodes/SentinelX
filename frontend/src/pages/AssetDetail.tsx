import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { TopBar } from '../components/Layout/TopBar';
import { AssetStatusBadge, RiskScore } from '../components/common/Badges';
import { LoadingOverlay, ErrorState } from '../components/common/States';
import { assetsApi } from '../api/assets';
import { eventsApi } from '../api/events';
import { incidentsApi } from '../api/incidents';
import type { Asset, SecurityEvent, Incident } from '../types';
import { ArrowLeft, Server } from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../components/common/Badges';

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const a = await assetsApi.get(Number(id));
        setAsset(a);
        const [evRes, incRes] = await Promise.all([
          eventsApi.list({ source_ip: a.ip_address, size: 20 }),
          incidentsApi.list({ source_ip: a.ip_address }),
        ]);
        setEvents(evRes.items);
        setIncidents(incRes.items);
      } catch {
        setError('Asset not found');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Asset Detail" />
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => navigate('/assets')} className="flex items-center gap-2 text-sentinel-muted hover:text-sentinel-text text-sm mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to assets
        </button>

        {loading ? <LoadingOverlay /> : error ? <ErrorState message={error} /> : asset && (
          <div className="space-y-5 animate-fade-in">
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-sentinel-surface border border-sentinel-border flex items-center justify-center">
                  <Server className="w-7 h-7 text-sentinel-accent/70" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-sentinel-text">{asset.hostname}</h2>
                    <AssetStatusBadge status={asset.status} />
                  </div>
                  <p className="font-mono text-sentinel-accent">{asset.ip_address}</p>
                  {asset.operating_system && <p className="text-sm text-sentinel-muted mt-1">{asset.operating_system}</p>}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold"><RiskScore score={asset.risk_score} /></div>
                  <div className="text-xs text-sentinel-muted">Risk Score</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-sentinel-border">
                <div><div className="text-xs text-sentinel-muted mb-1">Owner</div><div className="text-sm">{asset.owner || '—'}</div></div>
                <div><div className="text-xs text-sentinel-muted mb-1">Location</div><div className="text-sm">{asset.location || '—'}</div></div>
                <div><div className="text-xs text-sentinel-muted mb-1">Last Seen</div><div className="text-sm">{format(new Date(asset.last_seen), 'MMM d HH:mm')}</div></div>
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Services</div>
                  <div className="flex flex-wrap gap-1">
                    {asset.services?.map(s => <span key={s} className="badge bg-sentinel-surface border border-sentinel-border text-sentinel-muted text-xs">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="card">
                <h3 className="text-sm font-semibold text-sentinel-text mb-3">Related Incidents ({incidents.length})</h3>
                {incidents.length === 0 ? <p className="text-sm text-sentinel-muted">No incidents</p> : (
                  <div className="space-y-2">
                    {incidents.slice(0, 10).map(i => (
                      <button key={i.id} onClick={() => navigate(`/incidents/${i.id}`)} className="w-full text-left p-2 rounded-lg border border-sentinel-border/50 hover:bg-sentinel-surface/50 transition-colors">
                        <div className="flex items-center gap-2 mb-0.5">
                          <SeverityBadge severity={i.severity} />
                          <StatusBadge status={i.status} />
                        </div>
                        <p className="text-xs text-sentinel-text truncate">{i.title}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-sentinel-text mb-3">Recent Events ({events.length})</h3>
                {events.length === 0 ? <p className="text-sm text-sentinel-muted">No events</p> : (
                  <div className="space-y-1 font-mono text-xs">
                    {events.map(e => (
                      <div key={e.id} className="flex items-center gap-2 py-1 border-b border-sentinel-border/30">
                        <SeverityBadge severity={e.severity} />
                        <span className="text-sentinel-text/80 flex-1 truncate">{e.event_type.replace(/_/g, ' ')}</span>
                        <span className="text-sentinel-muted">{new Date(e.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
