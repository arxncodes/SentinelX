import React from 'react';
import clsx from 'clsx';
import type { EventSeverity, IncidentSeverity, IncidentStatus, AssetStatus } from '../../types';

interface SeverityBadgeProps {
  severity: EventSeverity | IncidentSeverity;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  return (
    <span className={clsx(`badge-${severity}`, className)}>
      {severity.toUpperCase()}
    </span>
  );
};

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const label: Record<IncidentStatus, string> = {
    open: 'OPEN',
    investigating: 'INVESTIGATING',
    resolved: 'RESOLVED',
    false_positive: 'FALSE POSITIVE',
  };
  return (
    <span className={clsx(`badge-${status}`, className)}>
      {label[status]}
    </span>
  );
};

interface AssetStatusBadgeProps {
  status: AssetStatus;
}

export const AssetStatusBadge: React.FC<AssetStatusBadgeProps> = ({ status }) => {
  return <span className={`badge-${status}`}>{status.toUpperCase()}</span>;
};

interface RiskScoreProps {
  score: number;
  className?: string;
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, className }) => {
  const cls =
    score >= 75 ? 'risk-score-high' :
    score >= 40 ? 'risk-score-medium' :
    'risk-score-low';
  return <span className={clsx(cls, className)}>{score.toFixed(0)}</span>;
};
