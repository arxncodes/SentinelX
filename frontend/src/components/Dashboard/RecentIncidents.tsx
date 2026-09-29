import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import type { Incident } from '../../types';
import { SeverityBadge, StatusBadge, RiskScore } from '../common/Badges';

interface RecentIncidentsProps {
  incidents: Incident[];
}

export const RecentIncidents: React.FC<RecentIncidentsProps> = ({ incidents }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-sentinel-text">Recent Incidents</h2>
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs text-sentinel-accent hover:text-sentinel-accent/80 flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-8 text-sentinel-muted text-sm">
          No incidents yet — system is clean ✓
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((incident) => (
            <button
              key={incident.id}
              onClick={() => navigate(`/incidents/${incident.id}`)}
              className="w-full text-left p-3 rounded-lg border border-sentinel-border/50 hover:border-sentinel-accent/30 hover:bg-sentinel-surface/50 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                  <p className="text-sm text-sentinel-text font-medium truncate">{incident.title}</p>
                  <p className="text-xs text-sentinel-muted mt-0.5">
                    {incident.source_ip && <span className="font-mono">{incident.source_ip} · </span>}
                    {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <RiskScore score={incident.risk_score} className="text-sm" />
                  <span className="text-xs text-sentinel-muted">risk</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
