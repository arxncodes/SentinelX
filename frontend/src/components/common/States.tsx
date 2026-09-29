import React from 'react';
import { ShieldX, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'Nothing to display here yet.',
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-sentinel-surface border border-sentinel-border flex items-center justify-center mb-4">
      {icon || <Inbox className="w-7 h-7 text-sentinel-muted" />}
    </div>
    <h3 className="text-sentinel-text font-medium mb-1">{title}</h3>
    <p className="text-sentinel-muted text-sm max-w-xs">{description}</p>
  </div>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-sentinel-red/10 border border-sentinel-red/30 flex items-center justify-center mb-4">
      <ShieldX className="w-7 h-7 text-sentinel-red" />
    </div>
    <h3 className="text-sentinel-text font-medium mb-1">{title}</h3>
    <p className="text-sentinel-muted text-sm max-w-xs mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-ghost text-xs">
        Try Again
      </button>
    )}
  </div>
);

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    className={`animate-spin text-sentinel-accent ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const LoadingOverlay: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <Spinner size={32} />
  </div>
);
