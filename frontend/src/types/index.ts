export type JobStatus = "Success" | "Failed" | "Running" | "Skipped" | "Warning";
export type AlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Open" | "Acknowledged" | "Resolved";
export type ConnectionStatus = "Healthy" | "Degraded" | "Down" | "Not Configured";
export type AlertType =
  | "Backup Failure"
  | "SLA Violation"
  | "RPO Violation"
  | "Missing Backup"
  | "Connector/API Failure"
  | "Repository/Storage Issue";

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  environment: string;
  application_name: string | null;
  platform_name: string | null;
  policy_name: string | null;
  sla_name: string | null;
  rpo_hours: number;
  rto_hours: number;
  retention_days: number;
  replication_enabled: boolean;
  replication_target: string | null;
  last_successful_backup_at: string | null;
  last_backup_status: JobStatus;
  owner: string | null;
  tags: string | null;
}

export interface Job {
  id: string;
  job_name: string;
  asset_id: string | null;
  asset_name: string | null;
  application_name: string | null;
  platform_name: string | null;
  policy_name: string | null;
  start_time: string;
  end_time: string | null;
  status: JobStatus;
  failure_reason: string | null;
  rpo_hours: number;
  owner: string | null;
  duration_seconds: number;
  bytes_transferred_gb: number;
  last_successful_backup_at: string | null;
}

export interface Alert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  asset_name: string | null;
  platform_name: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface DashboardSummary {
  total_assets: number;
  successful_backups_24h: number;
  failed_backups_24h: number;
  running_backups: number;
  skipped_backups_24h: number;
  sla_breaches: number;
  rpo_breaches: number;
  assets_without_recent_backup: number;
  open_alerts: number;
  critical_alerts: number;
}

export interface PlatformHealth {
  platform_id: string;
  platform_name: string;
  vendor_key: string;
  connection_status: ConnectionStatus;
  total_assets: number;
  success_rate_pct: number;
  failed_jobs_24h: number;
  sla_breaches: number;
  last_sync_at: string | null;
  api_latency_ms: number;
}

export interface TrendPoint {
  date: string;
  success: number;
  failed: number;
  skipped: number;
}

export interface ApplicationSummary {
  id: string;
  name: string;
  owner: string | null;
  criticality: string;
  total_assets: number;
  assets_with_failures: number;
  open_alerts: number;
}

export interface SlaPolicy {
  sla_name: string;
  asset_count: number;
  avg_rpo_hours: number;
  avg_rto_hours: number;
  open_breaches: number;
}

export interface IntegrationStatus {
  vendor_key: string;
  display_name: string;
  configured: boolean;
  connection_status: ConnectionStatus;
  last_sync_at: string | null;
  api_latency_ms: number | null;
  error_message: string | null;
  is_mock: boolean;
}

export interface Paginated<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}
