import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getNodeDetail, getOverview, type ProxmoxNodeDetail, type ProxmoxOverview } from "../api/proxmox";
import { getMetrics, type MetricsResponse } from "../api/metrics";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import MetricHistoryChart from "../components/MetricHistoryChart";
import colors from "../theme/colors";

const historyColors = {
  cpu: "#3987e5",
  memory: "#d95926",
  disk: "#199e70",
};

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "0 GB";
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return "-";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  return `${days}d ${hours}h`;
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

export default function NodeDetail() {
  const { cluster, node } = useParams<{ cluster: string; node: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ProxmoxNodeDetail | null>(null);
  const [overview, setOverview] = useState<ProxmoxOverview | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cluster || !node) return;

    try {
      const [detailData, overviewData] = await Promise.all([
        getNodeDetail(cluster, node),
        getOverview(),
      ]);

      setDetail(detailData);
      setOverview(overviewData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load node.");
    } finally {
      setLoading(false);
    }
  }, [cluster, node]);

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

  const historySeries = useMemo(() => {
    if (!cluster || !node) return [];

    const keys: Array<["cpu" | "memory" | "disk", string]> = [
      ["cpu", "CPU"],
      ["memory", "Memory"],
      ["disk", "Disk"],
    ];

    return keys
      .map(([metric, label]) => {
        const series = metrics[`proxmox:${cluster}:node:${node}:${metric}`];
        if (!series) return null;

        return {
          key: metric,
          label,
          color: historyColors[metric],
          points: series.points,
        };
      })
      .filter((series): series is NonNullable<typeof series> => Boolean(series));
  }, [metrics, cluster, node]);

  const guests = useMemo(() => {
    if (!overview || !cluster || !node) return [];

    return [
      ...overview.vms
        .filter((vm) => vm.cluster === cluster && vm.node === node)
        .map((vm) => ({ ...vm, kind: "qemu" as const })),
      ...overview.lxcs
        .filter((lxc) => lxc.cluster === cluster && lxc.node === node)
        .map((lxc) => ({ ...lxc, kind: "lxc" as const })),
    ];
  }, [overview, cluster, node]);

  if (loading) {
    return (
      <>
        <PageHeader title="Node" subtitle={`Loading ${node}...`} />
        <Spinner label="Loading" />
      </>
    );
  }

  if (error && !detail) {
    return (
      <>
        <PageHeader title="Node" subtitle={node ?? ""} />
        <Alert title="Unable to load" variant="danger">
          {error}
        </Alert>
      </>
    );
  }

  if (!detail) return null;

  const clusterName =
    overview?.clusters.find((c) => c.id === detail.cluster)?.name ??
    detail.cluster;
  const status = detail.status;
  const cpuPercent = Math.round((status.cpu ?? 0) * 100);
  const memPercent =
    status.memory?.total > 0
      ? Math.round((status.memory.used / status.memory.total) * 100)
      : 0;
  const diskPercent =
    status.rootfs?.total > 0
      ? Math.round((status.rootfs.used / status.rootfs.total) * 100)
      : 0;

  return (
    <>
      <PageHeader title={detail.node} subtitle={`Proxmox node · ${clusterName}`}>
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
        actions={<StatusBadge status="online" />}
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
                {formatBytes(status.memory?.used)} /{" "}
                {formatBytes(status.memory?.total)}
              </span>
            </div>
            <ProgressBar value={memPercent} color={colors.success} />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ color: colors.textSecondary }}>Root disk</span>
              <span>
                {formatBytes(status.rootfs?.used)} /{" "}
                {formatBytes(status.rootfs?.total)}
              </span>
            </div>
            <ProgressBar value={diskPercent} color={colors.warning} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            <Stat label="Uptime" value={formatUptime(status.uptime)} />
            <Stat
              label="Load average"
              value={
                Array.isArray(status.loadavg) ? status.loadavg.join(" / ") : "-"
              }
            />
            <Stat label="PVE version" value={status.pveversion ?? "-"} />
            <Stat
              label="Kernel"
              value={status["current-kernel"]?.release ?? "-"}
            />
          </div>
        </div>
      </Card>

      {historySeries.length > 0 && (
        <Card title="Resource History" padding={20} style={{ marginBottom: 20 }}>
          <MetricHistoryChart title="" series={historySeries} />
        </Card>
      )}

      <Card title="Storage" padding={20} style={{ marginBottom: 20 }}>
        {detail.storage.length === 0 ? (
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            No storage volumes reported.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {detail.storage.map((volume) => {
              const used = volume.used ?? 0;
              const total = volume.total ?? 0;
              const pct = total > 0 ? Math.round((used / total) * 100) : 0;

              return (
                <div
                  key={volume.storage}
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: colors.text, fontWeight: 600 }}>
                      {volume.storage} ({volume.type})
                    </span>
                    <span style={{ color: colors.textSecondary }}>
                      {formatBytes(used)} / {formatBytes(total)}
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Guests on this node" padding={20}>
        {guests.length === 0 ? (
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            No VMs or LXCs on this node.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {guests.map((guest) => (
              <Link
                key={`${guest.kind}-${guest.vmid}`}
                to={`/proxmox/${guest.kind === "qemu" ? "vms" : "lxc"}/${guest.cluster}/${guest.node}/${guest.vmid}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: colors.surfaceAlt,
                  fontSize: 14,
                }}
              >
                <span style={{ color: colors.text }}>
                  {guest.name} ({guest.kind === "qemu" ? "VM" : "LXC"} {guest.vmid})
                </span>
                <StatusBadge status={guest.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/proxmox" style={{ color: colors.primary, fontSize: 14 }}>
          ← Back to Proxmox overview
        </Link>
      </div>
    </>
  );
}
