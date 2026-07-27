import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import colors from "../theme/colors";
import { getOverview, getNodeSensors, type ProxmoxNode } from "../api/proxmox";
import { getDockerInfo, type DockerInfo } from "../api/docker";

interface NodeStatus {
  node: ProxmoxNode;
  clusterName: string;
  cpuTemperature: number | undefined;
}

const pollIntervalMs = 10_000;

function temperatureColor(celsius: number | undefined): string {
  if (celsius === undefined) return colors.textMuted;
  if (celsius >= 90) return colors.danger;
  if (celsius >= 75) return colors.warning;
  return colors.text;
}

function percentColor(percent: number): string {
  if (percent >= 90) return colors.danger;
  if (percent >= 75) return colors.warning;
  return colors.success;
}

function NodeTile({ status }: { status: NodeStatus }) {
  const navigate = useNavigate();
  const { node, clusterName, cpuTemperature } = status;
  const online = node.status === "online";
  const memPercent = node.maxmem > 0 ? Math.round((node.mem / node.maxmem) * 100) : 0;
  const diskPercent =
    node.maxdisk > 0 ? Math.round((node.disk / node.maxdisk) * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/proxmox/nodes/${node.cluster}/${node.node}`)}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        transition: "border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ color: colors.text, fontSize: 20, fontWeight: 700 }}>
            {node.node}
          </div>
          {clusterName && (
            <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
              {clusterName}
            </div>
          )}
        </div>

        <StatusBadge status={online ? "online" : "offline"} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: online ? 20 : 0,
        }}
      >
        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            CPU Temp
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: temperatureColor(cpuTemperature),
            }}
          >
            {cpuTemperature !== undefined ? `${Math.round(cpuTemperature)}°C` : "—"}
          </div>
        </div>

        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            RAM
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: online ? percentColor(memPercent) : colors.textMuted,
            }}
          >
            {online ? `${memPercent}%` : "—"}
          </div>
        </div>

        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            Storage
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: online ? percentColor(diskPercent) : colors.textMuted,
            }}
          >
            {online ? `${diskPercent}%` : "—"}
          </div>
        </div>
      </div>

      {online && (
        <div style={{ display: "grid", gap: 10 }}>
          <ProgressBar value={memPercent} color={colors.success} />
          <ProgressBar value={diskPercent} color={colors.warning} />
        </div>
      )}
    </div>
  );
}

function DockerTile({ docker }: { docker: DockerInfo }) {
  const navigate = useNavigate();
  const allRunning = docker.running === docker.containers;

  return (
    <div
      onClick={() => navigate("/containers")}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        transition: "border-color .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ color: colors.text, fontSize: 20, fontWeight: 700 }}>
          Docker
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 13,
            background: allRunning ? "#0f2f1c" : "#3b2e16",
            color: allRunning ? colors.success : colors.warning,
          }}
        >
          {docker.running}/{docker.containers} running
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            Running
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: colors.success }}>
            {docker.running}
          </div>
        </div>

        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            Stopped
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: colors.textMuted }}>
            {docker.stopped}
          </div>
        </div>

        <div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>
            Paused
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: colors.warning }}>
            {docker.paused}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [statuses, setStatuses] = useState<NodeStatus[]>([]);
  const [dockerInfo, setDockerInfo] = useState<DockerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    void getDockerInfo()
      .then(setDockerInfo)
      .catch(() => undefined);

    try {
      const overview = await getOverview();
      const clusterNames = new Map(
        overview.clusters.map((cluster) => [cluster.id, cluster.name])
      );
      const showClusterLabel = overview.clusters.length > 1;

      const sensors = await Promise.all(
        overview.nodes.map((node) =>
          getNodeSensors(node.cluster, node.node).catch(() => null)
        )
      );

      setStatuses(
        overview.nodes.map((node, index) => ({
          node,
          clusterName: showClusterLabel
            ? clusterNames.get(node.cluster) ?? node.cluster
            : "",
          cpuTemperature: sensors[index]?.cpuTemperature,
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load nodes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const timer = setInterval(() => void load(), pollIntervalMs);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <PageHeader title="HomeOps" subtitle="At a glance" />

      {error && (
        <div
          role="alert"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.danger}`,
            borderRadius: 10,
            color: colors.danger,
            marginBottom: 20,
            padding: "12px 14px",
          }}
        >
          {error}
        </div>
      )}

      {loading && statuses.length === 0 && (
        <div style={{ color: colors.textMuted }}>Loading…</div>
      )}

      {!loading && statuses.length === 0 && !error && (
        <div style={{ color: colors.textMuted }}>No Proxmox nodes found.</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {statuses.map((status) => (
          <NodeTile key={`${status.node.cluster}-${status.node.node}`} status={status} />
        ))}
      </div>

      {dockerInfo && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginTop: 20,
          }}
        >
          <DockerTile docker={dockerInfo} />
        </div>
      )}
    </>
  );
}
