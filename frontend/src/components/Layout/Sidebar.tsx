import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Shield, AlertTriangle, Server,
  Search, Brain, FileText, Settings, LogOut,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useWebSocketStore } from '../../store/wsStore';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: Activity, label: 'Events' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/assets', icon: Server, label: 'Assets' },
  { to: '/ip-investigation', icon: Search, label: 'IP Investigation' },
  { to: '/ai-analyst', icon: Brain, label: 'AI Analyst' },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { connected } = useWebSocketStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-sentinel-surface border-r border-sentinel-border transition-all duration-300 relative z-20',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sentinel-border min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-sentinel-accent/20 border border-sentinel-accent/40 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-sentinel-accent" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sentinel-text font-bold text-sm leading-tight">SentinelX</div>
            <div className="text-sentinel-muted text-xs">SOC Platform</div>
          </div>
        )}
      </div>

      {/* Live indicator */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sentinel-border/50">
          <div className="flex items-center gap-2">
            <div className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-sentinel-green animate-pulse' : 'bg-sentinel-muted')} />
            <span className="text-xs text-sentinel-muted">
              {connected ? 'Live monitoring active' : 'Connecting...'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(isActive ? 'sidebar-link-active' : 'sidebar-link', collapsed && 'justify-center px-2')
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sentinel-border p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-sentinel-accent/20 border border-sentinel-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-sentinel-accent uppercase">
                {user.username[0]}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-xs font-medium text-sentinel-text truncate">{user.username}</div>
              <div className="text-xs text-sentinel-muted capitalize">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx('sidebar-link w-full text-sentinel-red hover:text-sentinel-red hover:bg-sentinel-red/10', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sentinel-card border border-sentinel-border flex items-center justify-center text-sentinel-muted hover:text-sentinel-accent transition-colors z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
};
