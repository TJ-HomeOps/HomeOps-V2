import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getLxcDetail,
  getVmDetail,
  restartLXC,
  restartVM,
  startLXC,
  startVM,
  stopLXC,
  stopVM,
  type ProxmoxGuestDetail,
} from "../api/proxmox";
import { getMetrics, type MetricsResponse } from "../api/metrics";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import PowerButtons from "../components/PowerButtons";
import MetricHistoryChart from "../components/MetricHistoryChart";
import colors from "../theme/colors";

interface GuestDetailProps {
  kind: "qemu" | "lxc";
}

const historyColors = {
  cpu: "#3987e5",
  memory: "#d95926",
};

const excludedConfigKeys = new Set(["digest", "description"]);

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "0 GB";
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return "-";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;

  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ color: colors.textMuted, fontSize: 12 }}>{label}</div>
      <div
        style={{
          color: colors.text,
          fontWeight: 700,
          fontSize: 16,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function GuestDetail({ kind }: GuestDetailProps) {
  const { cluster, node, vmid } = useParams<{
    cluster: string;
    node: string;
    vmid: string;
  }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ProxmoxGuestDetail | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const getDetail = kind === "qemu" ? getVmDetail : getLxcDetail;
  const kindLabel = kind === "qemu" ? "Virtual Machine" : "LXC Container";

  const load = useCallback(async () => {
    if (!cluster || !node || !vmid) return;

    try {
      const data = await getDetail(cluster, node, vmid);
      setDetail(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to load ${kindLabel.toLowerCase()}.`
      );
    } finally {
      setLoading(false);
    }
    // getDetail depends only on `kind`, which is a static prop per route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster, node, vmid, kind]);

  useEffect(() => {
    void load();

    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    void getMetrics()
      .then(setMetrics)
      .catch(() => undefined);
  }, []);

  const runAction = async (action: "start" | "stop" | "restart") => {
    if (!cluster || !node || !vmid) return;

    if (
      action !== "start" &&
      !confirm(`Are you sure you want to ${action} this ${kindLabel.toLowerCase()}?`)
    ) {
      return;
    }

    const handlers =
      kind === "qemu"
        ? { start: startVM, stop: stopVM, restart: restartVM }
        : { start: startLXC, stop: stopLXC, restart: restartLXC };

    try {
      setActionPending(true);
      await handlers[action](cluster, node, Number(vmid));
      setTimeout(load, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to perform action.");
    } finally {
      setActionPending(false);
    }
  };

  const historySeries = useMemo(() => {
    if (!cluster || !vmid) return [];

    const cpuKey = `proxmox:${cluster}:${kind}:${vmid}:cpu`;
    const memoryKey = `proxmox:${cluster}:${kind}:${vmid}:memory`;

    return [
      metrics[cpuKey] && {
        key: "cpu",
        label: "CPU",
        color: historyColors.cpu,
        points: metrics[cpuKey].points,
      },
      metrics[memoryKey] && {
        key: "memory",
        label: "Memory",
        color: historyColors.memory,
        points: metrics[memoryKey].points,
      },
    ].filter((series): series is NonNullable<typeof series> => Boolean(series));
  }, [metrics, cluster, kind, vmid]);

  const configEntries = useMemo(() => {
    if (!detail) return [];

    return Object.entries(detail.config)
      .filter(([key]) => !excludedConfigKeys.has(key))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [detail]);

  if (loading) {
    return (
      <>
        <PageHeader title={kindLabel} subtitle={`Loading ${vmid}...`} />
        <Spinner label="Loading" />
      </>
    );
  }

  if (error && !detail) {
    return (
      <>
        <PageHeader title={kindLabel} subtitle={vmid ?? ""} />
        <Alert title="Unable to load" variant="danger">
          {error}
        </Alert>
      </>
    );
  }

  if (!detail) return null;

  const status = detail.status;
  const cpuPercent = Math.round((status.cpu ?? 0) * 100);
  const memPercent =
    status.maxmem > 0 ? Math.round((status.mem / status.maxmem) * 100) : 0;
  const diskPercent =
    status.maxdisk > 0 ? Math.round((status.disk / status.maxdisk) * 100) : 0;
  const name = detail.config.name ?? detail.config.hostname ?? `#${vmid}`;

  return (
    <>
      <PageHeader title={name} subtitle={`${kindLabel} ${vmid} on ${node}`}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => void load()}
        >
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <Alert title="Error" variant="danger" style={{ marginBottom: 20 }}>
          {error}
        </Alert>
      )}

      <Card
        title="Status"
        actions={<StatusBadge status={status.status ?? "unknown"} />}
        padding={20}
        style={{ marginBottom: 20 }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ color: colors.textSecondary }}>CPU</span>
              <span>{cpuPercent}%</span>
            </div>
            <ProgressBar value={cpuPercent} />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ color: colors.textSecondary }}>Memory</span>
              <span>
                {formatBytes(status.mem)} / {formatBytes(status.maxmem)}
              </span>
            </div>
            <ProgressBar value={memPercent} color={colors.success} />
          </div>

          {status.maxdisk > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ color: colors.textSecondary }}>Disk</span>
                <span>
                  {formatBytes(status.disk)} / {formatBytes(status.maxdisk)}
                </span>
              </div>
              <ProgressBar value={diskPercent} color={colors.warning} />
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
            }}
          >
            <Stat label="Uptime" value={formatUptime(status.uptime)} />
            <Stat label="Cores" value={detail.config.cores ?? status.cpus ?? "-"} />
            <Stat label="OS type" value={detail.config.ostype ?? "-"} />
            {status.pid && <Stat label="PID" value={status.pid} />}
          </div>

          <PowerButtons
            onStart={async () => runAction("start")}
            onRestart={async () => runAction("restart")}
            onStop={async () => runAction("stop")}
          />

          {actionPending && (
            <div style={{ color: colors.textMuted, fontSize: 13 }}>
              Working…
            </div>
          )}
        </div>
      </Card>

      {historySeries.length > 0 && (
        <Card title="Resource History" padding={20} style={{ marginBottom: 20 }}>
          <MetricHistoryChart title="" series={historySeries} />
        </Card>
      )}

      <Card title="Configuration" subtitle="Raw Proxmox config" padding={20}>
        <div style={{ display: "grid", gap: 8 }}>
          {configEntries.map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                gap: 16,
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border}`,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  color: colors.textMuted,
                  minWidth: 120,
                  flexShrink: 0,
                  fontFamily: "monospace",
                }}
              >
                {key}
              </div>
              <div
                style={{
                  color: colors.textSecondary,
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}
              >
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/proxmox" style={{ color: colors.primary, fontSize: 14 }}>
          ← Back to Proxmox overview
        </Link>
      </div>
    </>
  );
}
