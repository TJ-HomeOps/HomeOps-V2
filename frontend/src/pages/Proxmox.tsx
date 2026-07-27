import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import NodeCard from "../components/NodeCard";
import HealthCard from "../components/HealthCard";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import PowerButtons from "../components/PowerButtons";
import Button from "../components/common/Button";
import MetricHistoryChart, {
  type MetricChartSeries,
} from "../components/MetricHistoryChart";
import colors from "../theme/colors";
import {
  getOverview,
  startVM,
  stopVM,
  restartVM,
  startLXC,
  stopLXC,
  restartLXC,
  type ProxmoxOverview,
} from "../api/proxmox";
import { getDockerInfo, type DockerInfo } from "../api/docker";
import {
  getSystemInfo,
  formatBytes,
  formatUptime,
  type SystemInfo,
} from "../api/system";
import { getMetrics, type MetricsResponse } from "../api/metrics";
import { subscribeToLiveUpdates } from "../api/ws";

// Validated dark-mode categorical slots 1-3 (blue/orange/aqua) from the
// dataviz palette — these three clear the CVD/contrast gates as a set for
// small multiples, unlike an arbitrary hue choice.
const historyColors = {
  cpu: "#3987e5",
  memory: "#d95926",
  disk: "#199e70",
};

type ClusterData = {
  overview: ProxmoxOverview;
  docker: DockerInfo;
  system: SystemInfo;
  updatedAt: Date;
};

const cardStyle: CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: 20,
};

const headingStyle: CSSProperties = {
  color: colors.text,
  fontSize: 16,
  margin: "0 0 18px",
};

const statLabelStyle: CSSProperties = {
  color: colors.textMuted,
  fontSize: 12,
  marginBottom: 6,
};

const statValueStyle: CSSProperties = {
  color: colors.text,
  fontSize: 18,
  fontWeight: 700,
};

const percent = (value: number | null | undefined = 0) => {
  const safeValue = value ?? 0;
  const result = safeValue <= 1 ? safeValue * 100 : safeValue;
  return Math.round(result);
};

const gb = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(1);

export default function Proxmox() {
  const navigate = useNavigate();
  const [data, setData] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [metrics, setMetrics] = useState<MetricsResponse>({});

  const load = useCallback(async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [overview, docker, system] = await Promise.all([
        getOverview(),
        getDockerInfo(),
        getSystemInfo(),
      ]);

      setData({ overview, docker, system, updatedAt: new Date() });
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Proxmox data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);

    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const loadMetrics = () => {
      void getMetrics()
        .then(setMetrics)
        .catch(() => undefined);
    };

    loadMetrics();

    const timer = window.setInterval(loadMetrics, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return subscribeToLiveUpdates((message) => {
      if (message.type !== "metric.point") {
        return;
      }

      setMetrics((current) => {
        const existing = current[message.key];
        const points = existing
          ? [...existing.points, message.point]
          : [message.point];

        return {
          ...current,
          [message.key]: { label: message.label, points },
        };
      });
    });
  }, []);

  async function vmAction(
    cluster: string,
    node: string,
    vmid: number,
    action: "start" | "stop" | "restart"
  ) {
    try {
      if (
        action !== "start" &&
        !confirm(`Are you sure you want to ${action} VM ${vmid}?`)
      ) {
        return;
      }

      switch (action) {
        case "start":
          await startVM(cluster, node, vmid);
          break;
        case "stop":
          await stopVM(cluster, node, vmid);
          break;
        case "restart":
          await restartVM(cluster, node, vmid);
          break;
      }

      setTimeout(() => void load(), 1500);
    } catch (err) {
      console.error(err);
      alert("Unable to perform VM action.");
    }
  }

  async function lxcAction(
    cluster: string,
    node: string,
    vmid: number,
    action: "start" | "stop" | "restart"
  ) {
    try {
      if (
        action !== "start" &&
        !confirm(`Are you sure you want to ${action} container ${vmid}?`)
      ) {
        return;
      }

      switch (action) {
        case "start":
          await startLXC(cluster, node, vmid);
          break;
        case "stop":
          await stopLXC(cluster, node, vmid);
          break;
        case "restart":
          await restartLXC(cluster, node, vmid);
          break;
      }

      setTimeout(() => void load(), 1500);
    } catch (err) {
      console.error(err);
      alert("Unable to perform container action.");
    }
  }

  const overview = data?.overview;
  const nodes = overview?.nodes ?? [];
  const vms = overview?.vms ?? [];
  const lxcs = overview?.lxcs ?? [];
  const docker = data?.docker;
  const system = data?.system;

  const onlineNodes = nodes.filter((node) => node.status === "online").length;
  const memoryTotal = system?.memory.total ?? 0;
  const memoryUsed = system?.memory.used ?? 0;
  const diskTotal = system?.disk.total ?? 0;
  const diskUsed = system?.disk.used ?? 0;
  const memoryUsage = percent(memoryTotal > 0 ? memoryUsed / memoryTotal : 0);
  const storageUsage = percent(diskTotal > 0 ? diskUsed / diskTotal : 0);
  const applicationStatus = loading
    ? "Loading"
    : error
      ? "Unavailable"
      : data
        ? "Connected"
        : "Unavailable";
  const applicationStatusColor = loading
    ? colors.warning
    : error || !data
      ? colors.danger
      : colors.success;

  const runningVms = useMemo(() => vms.filter((vm) => vm.status === "running"), [vms]);
  const runningLxcs = useMemo(
    () => lxcs.filter((lxc) => lxc.status === "running"),
    [lxcs]
  );

  const guestCounts = useMemo(() => {
    const counts: Record<string, { vms: number; lxcs: number }> = {};

    for (const vm of vms) {
      const nodeCounts = counts[vm.node] ?? { vms: 0, lxcs: 0 };
      nodeCounts.vms += 1;
      counts[vm.node] = nodeCounts;
    }

    for (const lxc of lxcs) {
      const nodeCounts = counts[lxc.node] ?? { vms: 0, lxcs: 0 };
      nodeCounts.lxcs += 1;
      counts[lxc.node] = nodeCounts;
    }

    return counts;
  }, [lxcs, vms]);

  const clusterMetrics = useMemo(() => {
    if (nodes.length === 0) {
      return { cpu: 0, memory: memoryUsage, storage: storageUsage };
    }

    return {
      cpu: nodes.reduce((total, node) => total + percent(node.cpu), 0) / nodes.length,
      memory:
        nodes.reduce(
          (total, node) => total + percent(node.maxmem > 0 ? node.mem / node.maxmem : 0),
          0
        ) / nodes.length,
      storage:
        nodes.reduce(
          (total, node) =>
            total + percent(node.maxdisk > 0 ? node.disk / node.maxdisk : 0),
          0
        ) / nodes.length,
    };
  }, [memoryUsage, nodes, storageUsage]);

  const historyCharts = useMemo(() => {
    const groups = new Map<string, { title: string; series: MetricChartSeries[] }>();

    const metricLabels: Record<string, string> = {
      cpu: "CPU",
      memory: "Memory",
      disk: "Disk",
    };

    for (const [key, series] of Object.entries(metrics)) {
      let entityKey: string;
      let entityTitle: string;
      let metric: string;

      if (key.startsWith("proxmox:")) {
        // proxmox:<cluster>:node:<name>:<metric>
        const parts = key.split(":");

        if (parts.length !== 5 || parts[2] !== "node") {
          continue;
        }

        const nodeName = parts[3];
        metric = parts[4]!;
        entityKey = `proxmox:${parts[1]}:node:${nodeName}`;
        entityTitle = `Node ${nodeName}`;
      } else {
        continue;
      }

      const color = historyColors[metric as keyof typeof historyColors];

      if (!color) {
        continue;
      }

      const group = groups.get(entityKey) ?? { title: entityTitle, series: [] };

      group.series.push({
        key: metric,
        label: metricLabels[metric] ?? metric,
        color,
        points: series.points,
      });

      groups.set(entityKey, group);
    }

    const order = ["cpu", "memory", "disk"];

    return Array.from(groups.values()).map((group) => ({
      ...group,
      series: [...group.series].sort(
        (a, b) => order.indexOf(a.key) - order.indexOf(b.key)
      ),
    }));
  }, [metrics]);

  const filteredVms = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return vms.filter(
      (vm) => !query || `${vm.vmid} ${vm.name} ${vm.node}`.toLowerCase().includes(query)
    );
  }, [vms, searchText]);

  const filteredLxcs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return lxcs.filter(
      (lxc) =>
        !query || `${lxc.vmid} ${lxc.name} ${lxc.node}`.toLowerCase().includes(query)
    );
  }, [lxcs, searchText]);

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Proxmox Cluster" subtitle="Loading cluster..." />
        <div style={{ ...cardStyle, color: colors.textMuted }}>
          Loading infrastructure data…
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .proxmox-grid { display: grid; gap: 18px; }
        .metrics-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        .nodes-grid { grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
        .guests-grid { grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); }
        .two-column-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .stats-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .metrics-grid, .two-column-grid, .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <PageHeader title="Proxmox Cluster" subtitle="Live infrastructure overview">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Button onClick={() => void load()} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <input
            aria-label="Search VMs and LXCs"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search VMs and LXCs"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              color: colors.text,
              outline: "none",
              padding: "9px 12px",
              width: 220,
            }}
          />
          <span style={{ color: colors.textMuted, fontSize: 12 }}>
            Last updated: {data?.updatedAt.toLocaleTimeString() ?? "—"}
          </span>
        </div>
      </PageHeader>

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

      <section className="proxmox-grid metrics-grid">
        <MetricCard
          title="Nodes Online"
          value={`${onlineNodes}/${nodes.length}`}
          color={colors.success}
          loading={loading}
        />
        <MetricCard
          title="Running VMs"
          value={runningVms.length}
          color={colors.primary}
          loading={loading}
        />
        <MetricCard
          title="Running LXCs"
          value={runningLxcs.length}
          color={colors.primary}
          loading={loading}
        />
        <MetricCard
          title="Docker Containers"
          value={docker?.containers ?? 0}
          color={colors.warning}
          loading={loading}
        />
        <MetricCard
          title="Memory Usage"
          value={`${Math.round(memoryUsage)}%`}
          color={colors.warning}
          loading={loading}
        />
        <MetricCard
          title="Storage Usage"
          value={`${Math.round(storageUsage)}%`}
          color={colors.danger}
          loading={loading}
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <HealthCard
          title="Cluster Health"
          loading={loading}
          metrics={[
            { label: "Average CPU", value: clusterMetrics.cpu, suffix: "%", color: colors.primary },
            { label: "Memory", value: clusterMetrics.memory, suffix: "%", color: colors.warning },
            { label: "Disk", value: clusterMetrics.storage, suffix: "%", color: colors.danger },
            {
              label: "Node Health",
              value: nodes.length ? (onlineNodes / nodes.length) * 100 : 0,
              suffix: "%",
              color: onlineNodes === nodes.length ? colors.success : colors.warning,
            },
          ]}
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ ...headingStyle, marginBottom: 16 }}>Nodes</h2>
        <div className="proxmox-grid nodes-grid">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node.node}
              status={node.status === "online" ? "online" : "offline"}
              cpu={percent(node.cpu)}
              memory={percent(node.maxmem > 0 ? node.mem / node.maxmem : 0)}
              storage={percent(node.maxdisk > 0 ? node.disk / node.maxdisk : 0)}
              vmCount={guestCounts[node.node]?.vms ?? 0}
              lxcCount={guestCounts[node.node]?.lxcs ?? 0}
              uptime={formatUptime(node.uptime)}
              onOverview={() => navigate(`/proxmox/nodes/${node.cluster}/${node.node}`)}
            />
          ))}
        </div>
      </section>

      {historyCharts.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ ...headingStyle, marginBottom: 16 }}>Resource History</h2>
          <div className="proxmox-grid nodes-grid" style={{ gap: 16 }}>
            {historyCharts.map((chart) => (
              <div key={chart.title} style={cardStyle}>
                <MetricHistoryChart title={chart.title} series={chart.series} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>Activity</h2>
          <div className="stats-grid">
            <div>
              <div style={statLabelStyle}>Last refresh</div>
              <div style={statValueStyle}>
                {data?.updatedAt.toLocaleTimeString() ?? "—"}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>API status</div>
              <div style={{ ...statValueStyle, color: applicationStatusColor }}>
                {applicationStatus}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>Node count</div>
              <div style={statValueStyle}>{nodes.length}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Running guests</div>
              <div style={statValueStyle}>
                {runningVms.length + runningLxcs.length}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>Docker status</div>
              <div style={{ ...statValueStyle, color: applicationStatusColor }}>
                {applicationStatus}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ ...headingStyle, marginBottom: 16 }}>Virtual Machines</h2>
        <div className="proxmox-grid guests-grid">
          {filteredVms.length === 0 ? (
            <div style={{ ...cardStyle, color: colors.textMuted }}>
              No virtual machines match.
            </div>
          ) : (
            filteredVms.map((vm) => (
              <div key={vm.id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <Link
                      to={`/proxmox/vms/${vm.cluster}/${vm.node}/${vm.vmid}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h3 style={{ color: colors.text, margin: 0 }}>{vm.name}</h3>
                    </Link>
                    <div style={{ color: colors.textSecondary }}>
                      VM {vm.vmid} • {vm.node}
                    </div>
                  </div>

                  <StatusBadge status={vm.status} />
                </div>

                <div style={{ marginBottom: 15 }}>
                  CPU {Math.round(vm.cpu * 100)}%
                  <ProgressBar value={Math.round(vm.cpu * 100)} />
                </div>

                <div>
                  RAM {gb(vm.mem)} / {gb(vm.maxmem)} GB
                  <ProgressBar
                    value={vm.maxmem > 0 ? Math.round((vm.mem / vm.maxmem) * 100) : 0}
                    color={colors.success}
                  />
                </div>

                <PowerButtons
                  onStart={() => vmAction(vm.cluster, vm.node, vm.vmid, "start")}
                  onRestart={() => vmAction(vm.cluster, vm.node, vm.vmid, "restart")}
                  onStop={() => vmAction(vm.cluster, vm.node, vm.vmid, "stop")}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ ...headingStyle, marginBottom: 16 }}>Containers</h2>
        <div className="proxmox-grid guests-grid">
          {filteredLxcs.length === 0 ? (
            <div style={{ ...cardStyle, color: colors.textMuted }}>
              No LXCs match.
            </div>
          ) : (
            filteredLxcs.map((lxc) => (
              <div key={lxc.id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <Link
                      to={`/proxmox/lxc/${lxc.cluster}/${lxc.node}/${lxc.vmid}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h3 style={{ color: colors.text, margin: 0 }}>{lxc.name}</h3>
                    </Link>
                    <div style={{ color: colors.textSecondary }}>
                      CT {lxc.vmid} • {lxc.node}
                    </div>
                  </div>

                  <StatusBadge status={lxc.status} />
                </div>

                <div style={{ marginBottom: 15 }}>
                  CPU {Math.round(lxc.cpu * 100)}%
                  <ProgressBar value={Math.round(lxc.cpu * 100)} />
                </div>

                <div>
                  RAM {gb(lxc.mem)} / {gb(lxc.maxmem)} GB
                  <ProgressBar
                    value={lxc.maxmem > 0 ? Math.round((lxc.mem / lxc.maxmem) * 100) : 0}
                    color={colors.success}
                  />
                </div>

                <PowerButtons
                  onStart={() => lxcAction(lxc.cluster, lxc.node, lxc.vmid, "start")}
                  onRestart={() => lxcAction(lxc.cluster, lxc.node, lxc.vmid, "restart")}
                  onStop={() => lxcAction(lxc.cluster, lxc.node, lxc.vmid, "stop")}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="proxmox-grid two-column-grid" style={{ marginTop: 24 }}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>Docker Overview</h2>
          <div className="stats-grid">
            <div>
              <div style={statLabelStyle}>Server Version</div>
              <div style={statValueStyle}>{docker?.serverVersion ?? "—"}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Operating System</div>
              <div style={statValueStyle}>{docker?.operatingSystem ?? "—"}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Images</div>
              <div style={statValueStyle}>{docker?.images ?? 0}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Containers</div>
              <div style={statValueStyle}>{docker?.containers ?? 0}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Running</div>
              <div style={{ ...statValueStyle, color: colors.success }}>
                {docker?.running ?? 0}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>Stopped</div>
              <div style={{ ...statValueStyle, color: colors.textMuted }}>
                {docker?.stopped ?? 0}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>Paused</div>
              <div style={{ ...statValueStyle, color: colors.warning }}>
                {docker?.paused ?? 0}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>CPU</div>
              <div style={statValueStyle}>{docker?.cpu ?? 0}</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={headingStyle}>System Overview</h2>
          <div className="stats-grid">
            <div>
              <div style={statLabelStyle}>Hostname</div>
              <div style={statValueStyle}>{system?.hostname ?? "—"}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Uptime</div>
              <div style={statValueStyle}>{formatUptime(system?.uptime ?? 0)}</div>
            </div>
            <div>
              <div style={statLabelStyle}>RAM</div>
              <div style={statValueStyle}>
                {formatBytes(memoryUsed)} / {formatBytes(memoryTotal)}
              </div>
            </div>
            <div>
              <div style={statLabelStyle}>Disk</div>
              <div style={statValueStyle}>
                {formatBytes(diskUsed)} / {formatBytes(diskTotal)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>Storage Summary</h2>
          <div className="stats-grid">
            <div>
              <div style={statLabelStyle}>Total RAM</div>
              <div style={statValueStyle}>{formatBytes(memoryTotal)}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Used RAM</div>
              <div style={statValueStyle}>{formatBytes(memoryUsed)}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Total Disk</div>
              <div style={statValueStyle}>{formatBytes(diskTotal)}</div>
            </div>
            <div>
              <div style={statLabelStyle}>Used Disk</div>
              <div style={statValueStyle}>{formatBytes(diskUsed)}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
