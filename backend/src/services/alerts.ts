import type { FastifyInstance } from "fastify";
import { recordNotification } from "./notifications";
import type { NotificationSource } from "./notifications";
import { getSystemStats } from "./system";
import { recordMetric } from "./metrics";

type AlertLevel = "ok" | "warning" | "critical";

const warningPercent = 80;
const criticalPercent = 95;

const systemPollIntervalMs = 30000;

// Tracks whether each metric is currently above (and at what level) its
// threshold, keyed by a caller-chosen id (e.g. "system:cpu",
// "proxmox:<cluster>:node:pve1:disk"). A notification only fires when this
// changes, otherwise every poll while a metric sits above the threshold
// would spam a new entry.
const alertLevels = new Map<string, AlertLevel>();

function levelForPercent(percent: number): AlertLevel {
  if (percent >= criticalPercent) {
    return "critical";
  }

  if (percent >= warningPercent) {
    return "warning";
  }

  return "ok";
}

export async function evaluateThreshold(
  key: string,
  source: NotificationSource,
  label: string,
  percent: number
): Promise<void> {
  const level = levelForPercent(percent);
  const previous = alertLevels.get(key) ?? "ok";

  if (level === previous) {
    return;
  }

  alertLevels.set(key, level);

  if (level === "ok") {
    await recordNotification({
      source,
      severity: "info",
      title: `${label} back to normal`,
      message: `${label} has dropped back to ${percent.toFixed(1)}%.`,
    });

    return;
  }

  await recordNotification({
    source,
    severity: level,
    title: `${label} is ${level === "critical" ? "critically high" : "high"}`,
    message: `${label} is at ${percent.toFixed(1)}%, above the ${
      level === "critical" ? criticalPercent : warningPercent
    }% threshold.`,
  });
}

async function pollSystem(): Promise<void> {
  const stats = getSystemStats();
  const cpuPercent = Math.min(
    100,
    (stats.cpu.load / stats.cpu.cores) * 100
  );

  await evaluateThreshold(
    "system:cpu",
    "system",
    "Backend host CPU usage",
    cpuPercent
  );
  await recordMetric("system:cpu", "Backend host CPU", cpuPercent);

  await evaluateThreshold(
    "system:memory",
    "system",
    "Backend host memory usage",
    stats.memory.percent
  );
  await recordMetric(
    "system:memory",
    "Backend host memory",
    stats.memory.percent
  );

  await evaluateThreshold(
    "system:disk",
    "system",
    "Backend host disk usage",
    stats.disk.percent
  );
  await recordMetric("system:disk", "Backend host disk", stats.disk.percent);
}

export function startSystemAlertWatcher(app: FastifyInstance): void {
  const tick = async () => {
    try {
      await pollSystem();
    } catch (error) {
      app.log.warn({ err: error }, "System alert watcher poll failed");
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), systemPollIntervalMs);

  app.addHook("onClose", () => {
    clearInterval(timer);
  });
}
