import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FastifyInstance } from "fastify";
import { getProxmoxClusters } from "./proxmox";
import { evaluateThreshold } from "./alerts";
import { recordMetric } from "./metrics";

const execFileAsync = promisify(execFile);

// Temperatures don't need 15s granularity, and every reading costs a fresh
// SSH handshake against the node — much cheaper to poll slowly.
const pollIntervalMs = 60000;
const sshTimeoutMs = 10000;

// The node's authorized_keys forces this exact command regardless of what's
// sent, so this is only for documentation/self-consistency, not enforcement.
const sshUser = "root";
const sshCommand = "sensors -j";

const warningCelsius = 75;
const criticalCelsius = 90;

export interface SensorReading {
  chip: string;
  label: string;
  celsius: number;
}

export interface NodeSensorSnapshot {
  readings: SensorReading[];
  cpuTemperature: number | undefined;
  updatedAt: string;
}

function parseSensorsOutput(raw: string): SensorReading[] {
  let parsed: Record<string, Record<string, unknown>>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const readings: SensorReading[] = [];

  for (const [chip, features] of Object.entries(parsed)) {
    if (typeof features !== "object" || features === null) {
      continue;
    }

    for (const [label, values] of Object.entries(features)) {
      if (
        label === "Adapter" ||
        typeof values !== "object" ||
        values === null
      ) {
        continue;
      }

      for (const [key, value] of Object.entries(
        values as Record<string, unknown>
      )) {
        if (key.endsWith("_input") && typeof value === "number") {
          readings.push({ chip, label, celsius: value });
        }
      }
    }
  }

  return readings;
}

// Matches the sensor chip drivers lm-sensors uses for on-die CPU
// temperature: coretemp (Intel), k10temp/zenpower (AMD).
const cpuChipPattern = /^(coretemp|k10temp|zenpower)/i;
const cpuPackageLabelPattern = /package|tdie|tctl/i;

function extractCpuTemperature(
  readings: SensorReading[]
): number | undefined {
  const cpuReadings = readings.filter((r) => cpuChipPattern.test(r.chip));
  const packageReadings = cpuReadings.filter((r) =>
    cpuPackageLabelPattern.test(r.label)
  );
  const candidates = packageReadings.length > 0 ? packageReadings : cpuReadings;

  if (candidates.length === 0) {
    return undefined;
  }

  return Math.max(...candidates.map((r) => r.celsius));
}

async function fetchSensors(host: string): Promise<SensorReading[]> {
  const { stdout } = await execFileAsync(
    "ssh",
    [
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=5",
      "-o",
      "StrictHostKeyChecking=accept-new",
      `${sshUser}@${host}`,
      sshCommand,
    ],
    { timeout: sshTimeoutMs }
  );

  return parseSensorsOutput(stdout);
}

const snapshots = new Map<string, NodeSensorSnapshot>();

function snapshotKey(clusterId: string, node: string): string {
  return `${clusterId}:${node}`;
}

export function getCachedSensors(
  clusterId: string,
  node: string
): NodeSensorSnapshot | undefined {
  return snapshots.get(snapshotKey(clusterId, node));
}

interface ClusterStatusNode {
  type: string;
  name: string;
  online?: number;
  ip?: string;
}

async function pollCluster(
  app: FastifyInstance,
  clusterId: string,
  clusterName: string,
  showClusterLabel: boolean
): Promise<void> {
  const cluster = getProxmoxClusters().find((c) => c.id === clusterId);

  if (!cluster) {
    return;
  }

  const { data } = await cluster.client.get("/cluster/status");
  const nodes = (data.data as ClusterStatusNode[]).filter(
    (entry) => entry.type === "node" && entry.online && entry.ip
  );

  await Promise.all(
    nodes.map(async (node) => {
      try {
        const readings = await fetchSensors(node.ip!);
        const cpuTemperature = extractCpuTemperature(readings);

        snapshots.set(snapshotKey(clusterId, node.name), {
          readings,
          cpuTemperature,
          updatedAt: new Date().toISOString(),
        });

        if (cpuTemperature === undefined) {
          return;
        }

        const label = showClusterLabel
          ? `${node.name} (${clusterName})`
          : node.name;
        const key = `proxmox:${clusterId}:node:${node.name}:temp`;

        await recordMetric(key, `Node ${label} CPU temperature`, cpuTemperature);

        await evaluateThreshold(
          key,
          "proxmox",
          `Node ${label} CPU temperature`,
          cpuTemperature,
          { warning: warningCelsius, critical: criticalCelsius, unit: "°C" }
        );
      } catch (error) {
        // Node unreachable over SSH, sensors not installed, or the command
        // failed — leave the last-known snapshot in place and retry next
        // poll rather than erroring the whole cluster's pass.
        app.log.warn(
          { err: error, cluster: clusterId, node: node.name },
          "Unable to read sensors for node"
        );
      }
    })
  );
}

async function pollSensors(app: FastifyInstance): Promise<void> {
  const clusters = getProxmoxClusters();
  const showClusterLabel = clusters.length > 1;

  await Promise.all(
    clusters.map((cluster) =>
      pollCluster(app, cluster.id, cluster.name, showClusterLabel)
    )
  );
}

export function startSensorWatcher(app: FastifyInstance): void {
  const tick = async () => {
    try {
      await pollSensors(app);
    } catch (error) {
      app.log.warn({ err: error }, "Sensor watcher poll failed");
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), pollIntervalMs);

  app.addHook("onClose", () => {
    clearInterval(timer);
  });
}
