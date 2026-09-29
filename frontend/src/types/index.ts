// Core type definitions matching backend schemas

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// Events
export type EventType =
  | 'authentication_failure'
  | 'authentication_success'
  | 'port_scan'
  | 'suspicious_login'
  | 'privilege_escalation'
  | 'malware_detection'
  | 'firewall_event'
  | 'network_anomaly'
  | 'file_access'
  | 'process_execution';

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: number;
  source_ip: string;
  destination_ip: string | null;
  event_type: EventType;
  severity: EventSeverity;
  username: string | null;
  service: string | null;
  port: number | null;
  hostname: string | null;
  message: string | null;
  raw_data: Record<string, unknown> | null;
  processed: boolean;
  incident_id: number | null;
  timestamp: string;
  ingested_at: string;
}

export interface EventListResponse {
  items: SecurityEvent[];
  total: number;
  page: number;
  size: number;
}

// Incidents
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  risk_score: number;
  status: IncidentStatus;
  source_ip: string | null;
  target_asset: string | null;
  detection_rule: string | null;
  evidence: Record<string, unknown> | null;
  assigned_to: number | null;
  ai_analysis: AiAnalysis | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
}

export interface IncidentListResponse {
  items: Incident[];
  total: number;
  page: number;
  size: number;
}

// Assets
export type AssetStatus = 'online' | 'offline' | 'compromised' | 'unknown';

export interface Asset {
  id: number;
  hostname: string;
  ip_address: string;
  operating_system: string | null;
  services: string[] | null;
  status: AssetStatus;
  risk_score: number;
  description: string | null;
  owner: string | null;
  location: string | null;
  tags: string[] | null;
  last_seen: string;
  created_at: string;
}

// Dashboard
export interface DashboardStats {
  total_events: number;
  events_24h: number;
  total_incidents: number;
  open_incidents: number;
  investigating_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  total_assets: number;
  overall_risk_score: number;
  severity_distribution: Record<EventSeverity, number>;
}

export interface ActivityPoint {
  hour: string;
  count: number;
}

export interface TopSourceIP {
  ip: string;
  count: number;
}

// AI Analysis
export interface AiAnalysis {
  summary: string;
  likely_attack: string;
  severity_justification: string;
  suspicious_indicators: string[];
  potential_impact: string;
  investigation_steps: string[];
  remediation: string[];
  mitre_techniques: string[];
  confidence: 'high' | 'medium' | 'low';
  analyst_note: string;
}

// Audit Logs
export interface AuditLog {
  id: number;
  username: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  timestamp: string;
}

// WebSocket message types
export interface WsEvent {
  type: 'connected' | 'new_event' | 'new_incident' | 'incident_update' | 'pong';
  data?: SecurityEvent | Incident | Record<string, unknown>;
  connection_id?: string;
  message?: string;
  active_connections?: number;
}

// IP Investigation
export interface IpInvestigationReport {
  ip_address: string;
  found: boolean;
  message?: string;
  summary?: {
    total_events: number;
    total_incidents: number;
    open_incidents: number;
    first_seen: string | null;
    last_seen: string | null;
    risk_score: number;
  };
  event_type_breakdown?: Record<string, number>;
  severity_breakdown?: Record<string, number>;
  incidents?: Array<{
    id: number;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    risk_score: number;
    detection_rule: string | null;
    created_at: string;
  }>;
  recent_events?: Array<{
    id: number;
    event_type: EventType;
    severity: EventSeverity;
    username: string | null;
    service: string | null;
    message: string | null;
    timestamp: string;
  }>;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
