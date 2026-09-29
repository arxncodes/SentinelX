import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useWebSocketStore } from '../../store/wsStore';
import { useAuthStore } from '../../store/authStore';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { connected } = useWebSocketStore();
  const { user } = useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-sentinel-border bg-sentinel-surface/50 backdrop-blur-sm flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-sentinel-text">{title}</h1>
        {subtitle && <p className="text-xs text-sentinel-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sentinel-bg border border-sentinel-border">
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-sentinel-green" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-sentinel-muted" />
          )}
          <span className={`text-xs ${connected ? 'text-sentinel-green' : 'text-sentinel-muted'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sentinel-accent/20 border border-sentinel-accent/30 flex items-center justify-center">
              <span className="text-xs font-bold text-sentinel-accent uppercase">{user.username[0]}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
