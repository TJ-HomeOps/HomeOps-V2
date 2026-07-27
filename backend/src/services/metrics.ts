import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { broadcast } from "./broadcast";

export interface MetricPoint {
  t: string;
  v: number;
}

export interface MetricSeriesData {
  label: string;
  points: MetricPoint[];
}

const dataDirectory = join(process.cwd(), "data");
const storePath = join(dataDirectory, "metrics.json");

// Callers poll on their own cadence (15s for Proxmox, 30s for the backend
// host); this floor decouples the stored resolution from that so switching
// either poll interval doesn't reshape the history.
const minSampleIntervalMs = 55000;

// 24h of roughly one-minute samples per series.
const maxPointsPerSeries = 1440;

let series: Record<string, MetricSeriesData> = {};
let loaded = false;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<void> {
  if (loaded) {
    return;
  }

  loaded = true;

  try {
    const raw = await readFile(storePath, "utf8");
    series = JSON.parse(raw) as Record<string, MetricSeriesData>;
  } catch {
    series = {};
  }
}

function persist(): void {
  writeQueue = writeQueue
    .then(async () => {
      await mkdir(dataDirectory, { recursive: true });
      await writeFile(storePath, JSON.stringify(series));
    })
    .catch((error: unknown) => {
      console.error("Unable to persist metrics", error);
    });
}

export async function recordMetric(
  key: string,
  label: string,
  value: number
): Promise<void> {
  await load();

  const existing = series[key] ?? { label, points: [] };
  existing.label = label;

  const points = existing.points;
  const last = points[points.length - 1];
  const now = Date.now();

  if (last && now - new Date(last.t).getTime() < minSampleIntervalMs) {
    return;
  }

  const point = { t: new Date(now).toISOString(), v: Number(value.toFixed(2)) };
  points.push(point);

  if (points.length > maxPointsPerSeries) {
    points.splice(0, points.length - maxPointsPerSeries);
  }

  series[key] = existing;
  persist();
  broadcast({ type: "metric.point", key, label, point });
}

export async function listMetrics(): Promise<Record<string, MetricSeriesData>> {
  await load();

  return series;
}
