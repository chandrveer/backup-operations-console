const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function qs(params: Record<string, string | number | undefined | null>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const api = {
  dashboard: {
    summary: () => request<import("../types").DashboardSummary>("/dashboard/summary"),
    platformHealth: () => request<import("../types").PlatformHealth[]>("/dashboard/platform-health"),
    trend: (days = 14) => request<import("../types").TrendPoint[]>(`/dashboard/trend${qs({ days })}`),
  },
  jobs: {
    list: (params: Record<string, string | number | undefined>) =>
      request<import("../types").Paginated<import("../types").Job>>(`/jobs${qs(params)}`),
  },
  assets: {
    list: (params: Record<string, string | number | undefined>) =>
      request<import("../types").Paginated<import("../types").Asset>>(`/assets${qs(params)}`),
    lineage: (id: string) =>
      request<{ asset: import("../types").Asset; recent_jobs: import("../types").Job[]; open_alerts: import("../types").Alert[] }>(
        `/assets/${id}`
      ),
  },
  applications: {
    list: () => request<import("../types").ApplicationSummary[]>("/applications"),
  },
  platforms: {
    list: () => request<any[]>("/platforms"),
    catalog: () => request<{ vendor_key: string; display_name: string }[]>("/platforms/catalog"),
  },
  sla: {
    policies: () => request<import("../types").SlaPolicy[]>("/sla/policies"),
  },
  alerts: {
    list: (params: Record<string, string | undefined>) => request<import("../types").Alert[]>(`/alerts${qs(params)}`),
    byType: () => request<{ alert_type: string; count: number }[]>("/alerts/summary/by-type"),
    acknowledge: (id: string) => request(`/alerts/${id}/acknowledge`, { method: "POST" }),
    resolve: (id: string) => request(`/alerts/${id}/resolve`, { method: "POST" }),
  },
  reports: {
    complianceByApplication: () => request<any[]>("/reports/compliance-by-application"),
    platformSummary: () => request<import("../types").PlatformHealth[]>("/reports/platform-summary"),
    failureReasons: () => request<{ reason: string; count: number }[]>("/reports/failure-reasons"),
  },
  integrations: {
    status: () => request<import("../types").IntegrationStatus[]>("/integrations/status"),
    sync: (vendorKey: string) => request(`/integrations/${vendorKey}/sync`, { method: "POST" }),
  },
  search: {
    global: (q: string) => request<{ query: string; results: import("../types").Asset[] }>(`/search${qs({ q })}`),
  },
};
