export interface PublicApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

export interface PublicApiKeysListResponse {
  items: PublicApiKeyItem[];
}

export interface PublicApiMetricsTotals {
  total_requests: number;
  successful_requests: number;
  client_errors: number;
  server_errors: number;
  success_rate: number;
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
}

export interface PublicApiMetricsResponse {
  window_days: number;
  bucket: "hour" | "day";
  from: string;
  to: string;
  totals: PublicApiMetricsTotals;
  by_status_code: Array<{
    status_code: number;
    request_count: number;
    percentage: number;
  }>;
  top_endpoints: Array<{
    method: string;
    path: string;
    request_count: number;
    error_count: number;
    error_rate: number;
    p95_duration_ms: number;
  }>;
  timeseries: Array<{
    bucket_start: string;
    request_count: number;
    error_count: number;
    avg_duration_ms: number;
  }>;
  error_codes: Array<{
    code: string;
    request_count: number;
  }>;
  top_keys: Array<{
    key_id: string;
    name: string;
    key_prefix: string;
    request_count: number;
  }>;
}
