import React from 'react';
import { Shield, AlertTriangle, Activity, Server } from 'lucide-react';
import type { DashboardStats } from '../../types';
import { RiskScore } from '../common/Badges';

interface StatsCardsProps {
  stats: DashboardStats;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  glow?: boolean;
}> = ({ icon, label, value, sub, color = 'text-sentinel-accent', glow }) => (
  <div className={`stat-card ${glow ? 'border-sentinel-red/40' : ''}`}>
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-lg bg-sentinel-surface border border-sentinel-border ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-sentinel-text">{value}</div>
      <div className="text-xs text-sentinel-muted mt-0.5">{label}</div>
      {sub && <div className="text-xs text-sentinel-muted/60 mt-1">{sub}</div>}
    </div>
  </div>
);

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const hasCritical = stats.critical_incidents > 0;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Open Incidents"
        value={stats.open_incidents}
        sub={`${stats.critical_incidents} critical · ${stats.high_incidents} high`}
        color="text-sentinel-red"
        glow={hasCritical}
      />
      <StatCard
        icon={<Activity className="w-5 h-5" />}
        label="Events (24h)"
        value={stats.events_24h.toLocaleString()}
        sub={`${stats.total_events.toLocaleString()} total`}
        color="text-sentinel-accent"
      />
      <StatCard
        icon={<Shield className="w-5 h-5" />}
        label="Overall Risk Score"
        value={<RiskScore score={stats.overall_risk_score} />}
        sub="Based on open incidents"
        color={stats.overall_risk_score >= 70 ? 'text-sentinel-red' : stats.overall_risk_score >= 40 ? 'text-sentinel-amber' : 'text-sentinel-green'}
      />
      <StatCard
        icon={<Server className="w-5 h-5" />}
        label="Total Assets"
        value={stats.total_assets}
        sub={`${stats.investigating_incidents} investigating`}
        color="text-sentinel-purple"
      />
    </div>
  );
};
