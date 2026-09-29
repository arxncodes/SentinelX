import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Activity } from 'lucide-react';
import { useWebSocketStore } from '../../store/wsStore';

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-sentinel-red',
  high: 'bg-orange-500',
  medium: 'bg-sentinel-amber',
  low: 'bg-blue-500',
  info: 'bg-sentinel-muted',
};

export const LiveFeed: React.FC = () => {
  const { liveEvents, connected } = useWebSocketStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveEvents]);

  return (
    <div className="card flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-sentinel-text">Live Event Feed</h2>
          {connected && <div className="live-dot" />}
        </div>
        <span className="text-xs text-sentinel-muted">{liveEvents.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
        {liveEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-sentinel-muted gap-2">
            <Activity className="w-6 h-6 opacity-40" />
            <span>Waiting for events...</span>
            <span className="text-xs opacity-60">Run the simulator to see live events</span>
          </div>
        ) : (
          [...liveEvents].reverse().map((le) => {
            const isIncident = le.type === 'incident';
            const data = le.data as any;

            return (
              <div
                key={le.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded ${
                  isIncident
                    ? 'bg-sentinel-red/10 border border-sentinel-red/20 animate-slide-in-right'
                    : 'hover:bg-sentinel-surface/50'
                }`}
              >
                <span className="text-sentinel-muted flex-shrink-0">
                  {format(le.timestamp, 'HH:mm:ss')}
                </span>
                {isIncident ? (
                  <AlertTriangle className="w-3 h-3 text-sentinel-red flex-shrink-0 mt-0.5" />
                ) : (
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                      SEVERITY_DOT[data.severity] || 'bg-sentinel-muted'
                    }`}
                  />
                )}
                <span className={isIncident ? 'text-sentinel-red font-medium' : 'text-sentinel-text/80'}>
                  {isIncident
                    ? `🔴 Incident: ${data.title || data.detection_rule}`
                    : data.event_type?.replace(/_/g, ' ')}
                </span>
                {!isIncident && data.source_ip && (
                  <span className="text-sentinel-muted ml-auto flex-shrink-0">{data.source_ip}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
