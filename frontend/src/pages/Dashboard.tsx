import React, { useEffect, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { StatsCards } from '../components/Dashboard/StatsCards';
import { ActivityChart, SeverityChart } from '../components/Dashboard/Charts';
import { RecentIncidents } from '../components/Dashboard/RecentIncidents';
import { LiveFeed } from '../components/Dashboard/LiveFeed';
import { dashboardApi } from '../api/dashboard';
import { LoadingOverlay, ErrorState } from '../components/common/States';
import type { DashboardStats, ActivityPoint, Incident, TopSourceIP } from '../types';
import { RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [topIPs, setTopIPs] = useState<TopSourceIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, activityData, incidentsData, ipsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivity(24),
        dashboardApi.getRecentIncidents(8),
        dashboardApi.getTopSourceIPs(8),
      ]);
      setStats(statsData);
      setActivity(activityData);
      setRecentIncidents(incidentsData as unknown as Incident[]);
      setTopIPs(ipsData);
    } catch (e) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="SOC Dashboard"
        subtitle="Security Operations Overview"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sentinel-green animate-pulse" />
            <span className="text-xs text-sentinel-muted">Auto-refreshing every 30s</span>
          </div>
          <button onClick={fetchData} className="btn-ghost text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading && !stats ? (
          <LoadingOverlay />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : stats ? (
          <>
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <ActivityChart data={activity} />
              </div>
              <SeverityChart distribution={stats.severity_distribution} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <RecentIncidents incidents={recentIncidents} />
              </div>
              <div className="space-y-5">
                {/* Top IPs */}
                <div className="card">
                  <h2 className="text-sm font-semibold text-sentinel-text mb-3">Top Source IPs</h2>
                  {topIPs.length === 0 ? (
                    <p className="text-xs text-sentinel-muted">No activity yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topIPs.map((ip) => {
                        const maxCount = topIPs[0]?.count || 1;
                        const pct = (ip.count / maxCount) * 100;
                        return (
                          <div key={ip.ip}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-mono text-sentinel-accent">{ip.ip}</span>
                              <span className="text-sentinel-muted">{ip.count}</span>
                            </div>
                            <div className="h-1 bg-sentinel-border rounded-full">
                              <div
                                className="h-full bg-sentinel-accent/60 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Feed - full width */}
            <LiveFeed />
          </>
        ) : null}
      </div>
    </div>
  );
};
