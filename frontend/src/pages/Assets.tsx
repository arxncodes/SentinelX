import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { TopBar } from '../components/Layout/TopBar';
import { AssetStatusBadge, RiskScore } from '../components/common/Badges';
import { EmptyState, LoadingOverlay, ErrorState } from '../components/common/States';
import { assetsApi } from '../api/assets';
import type { Asset } from '../types';
import { Server, RefreshCw } from 'lucide-react';

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.list();
      setAssets(data);
    } catch {
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Assets" subtitle={`${assets.length} managed assets`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div />
          <button onClick={fetchAssets} className="btn-ghost text-xs">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <LoadingOverlay />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAssets} />
        ) : assets.length === 0 ? (
          <EmptyState
            title="No assets found"
            description="Assets are added automatically as events are ingested or can be added manually."
            icon={<Server className="w-7 h-7 text-sentinel-muted" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="card-hover text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sentinel-surface border border-sentinel-border flex items-center justify-center">
                    <Server className="w-5 h-5 text-sentinel-accent/70" />
                  </div>
                  <AssetStatusBadge status={asset.status} />
                </div>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-sentinel-text group-hover:text-sentinel-accent transition-colors">
                    {asset.hostname}
                  </h3>
                  <p className="font-mono text-xs text-sentinel-muted mt-0.5">{asset.ip_address}</p>
                  {asset.operating_system && (
                    <p className="text-xs text-sentinel-muted mt-0.5">{asset.operating_system}</p>
                  )}
                </div>
                {asset.services && asset.services.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {asset.services.slice(0, 4).map(s => (
                      <span key={s} className="badge bg-sentinel-surface border border-sentinel-border text-sentinel-muted text-xs">{s}</span>
                    ))}
                    {asset.services.length > 4 && (
                      <span className="text-xs text-sentinel-muted">+{asset.services.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-sentinel-border/50">
                  <div>
                    <span className="text-xs text-sentinel-muted">Risk: </span>
                    <RiskScore score={asset.risk_score} className="text-xs" />
                  </div>
                  <span className="text-xs text-sentinel-muted">
                    {formatDistanceToNow(new Date(asset.last_seen), { addSuffix: true })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
