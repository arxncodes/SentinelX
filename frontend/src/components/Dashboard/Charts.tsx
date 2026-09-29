import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ActivityPoint, DashboardStats } from '../../types';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff3b5c',
  high: '#f97316',
  medium: '#ffb340',
  low: '#60a5fa',
  info: '#64748b',
};

interface ActivityChartProps {
  data: ActivityPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-sentinel-card border border-sentinel-border rounded-lg p-3 shadow-card">
        <p className="text-xs text-sentinel-muted mb-1">{label}</p>
        <p className="text-sm font-semibold text-sentinel-accent">{payload[0].value} events</p>
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    time: format(parseISO(d.hour), 'HH:mm'),
    count: d.count,
  }));

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-sentinel-text mb-4">Event Activity (24h)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#activityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SeverityChartProps {
  distribution: DashboardStats['severity_distribution'];
}

export const SeverityChart: React.FC<SeverityChartProps> = ({ distribution }) => {
  const data = Object.entries(distribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-[220px]">
        <p className="text-sentinel-muted text-sm">No events yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-sentinel-text mb-4">Severity Distribution</h2>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map(({ name }) => (
              <Cell key={name} fill={SEVERITY_COLORS[name] || '#64748b'} />
            ))}
          </Pie>
          <Legend
            formatter={(value) => (
              <span className="text-xs text-sentinel-muted capitalize">{value}</span>
            )}
          />
          <Tooltip
            contentStyle={{ background: '#141e35', border: '1px solid #1e2d4a', borderRadius: '8px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
