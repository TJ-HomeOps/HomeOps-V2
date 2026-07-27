import { api } from "./client";

export interface MetricPoint {
  t: string;
  v: number;
}

export interface MetricSeriesData {
  label: string;
  points: MetricPoint[];
}

export type MetricsResponse = Record<string, MetricSeriesData>;

export function getMetrics(): Promise<MetricsResponse> {
  return api.get<MetricsResponse>("/api/metrics");
}
