import React from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { useAuthStore } from '../store/authStore';
import { Shield, User, Key, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-sentinel-accent" />
            <h2 className="text-sm font-semibold">Profile</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-sentinel-muted block mb-1">Username</label>
              <input value={user?.username || ''} readOnly className="input text-sentinel-muted" />
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1">Email</label>
              <input value={user?.email || ''} readOnly className="input text-sentinel-muted" />
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1">Full Name</label>
              <input value={user?.full_name || ''} readOnly className="input text-sentinel-muted" />
            </div>
            <div>
              <label className="text-xs text-sentinel-muted block mb-1">Role</label>
              <input value={user?.role || ''} readOnly className="input text-sentinel-muted capitalize" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-sentinel-accent" />
            <h2 className="text-sm font-semibold">System Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Platform', 'SentinelX SOC v1.0.0'],
              ['Backend', 'FastAPI (Python 3.11)'],
              ['Frontend', 'React + Vite + Tailwind CSS'],
              ['Database', 'PostgreSQL 16'],
              ['Real-time', 'WebSockets'],
              ['AI Provider', 'OpenAI-compatible API'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-sentinel-border/50">
                <span className="text-sentinel-muted">{k}</span>
                <span className="text-sentinel-text">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-sentinel-accent" />
            <h2 className="text-sm font-semibold">API Access</h2>
          </div>
          <p className="text-sm text-sentinel-muted mb-3">
            The SentinelX REST API is documented via OpenAPI (Swagger UI).
          </p>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            <Shield className="w-4 h-4" /> Open API Docs
          </a>
        </div>
      </div>
    </div>
  );
};
