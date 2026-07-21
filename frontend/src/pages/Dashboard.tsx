import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ReactNode
} from "react";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import NodeCard from "../components/NodeCard";
import HealthCard from "../components/HealthCard";
import Button from "../components/common/Button";
import colors from "../theme/colors";
import {
    getOverview,
    type ProxmoxOverview,
    type ProxmoxResource
} from "../api/proxmox";
import {
    getDockerInfo,
    type DockerInfo
} from "../api/docker";
import {
    getSystemInfo,
    formatBytes,
    formatUptime,
    type SystemInfo
} from "../api/system";
type DashboardData = {
    overview: ProxmoxOverview;
    docker: DockerInfo;
    system: SystemInfo;
    updatedAt: Date;
};
const pageStyle: CSSProperties = {
    background: colors.background,
    color: colors.text,
    minHeight: "100%",
    padding: "24px"
};
const sectionStyle: CSSProperties = {
    marginTop: "24px"
};
const cardStyle: CSSProperties = {
    background: colors.surface,
    border: "1px solid" + colors.border,
    borderRadius: "14px",
    padding: "20px"
};
const headingStyle: CSSProperties = {
    color: colors.text,
    fontSize: "16px",
    margin: "0 0 18px"
};
const statLabelStyle: CSSProperties = {
    color: colors.textMuted,
    fontSize: "12px",
    marginBottom: "6px"
};
const statValueStyle: CSSProperties = {
    color: colors.text,
    fontSize: "18px",
    fontWeight: 700
};
const percent = (value: number | null | undefined = 0) => {
    const safeValue = value ?? 0;
    const result = safeValue <= 1  ? safeValue * 100 : safeValue;
    return Math.round(result);
};
const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
const loadDashboard = useCallback(async (initialLoad = false) => {
    if (initialLoad) {
        setLoading(true);
    } else {
        setRefreshing(true);
    }

    try {
        const [overview, docker, system] = await Promise.all([
            getOverview(),
            getDockerInfo(),
            getSystemInfo()
        ]);

        setDashboardData({
            overview,
            docker,
            system,
            updatedAt: new Date()
        });
        setError(null);
    } catch (requestError) {
        setError(
            requestError instanceof Error
                ? requestError.message
                : "Unable to load dashboard data."
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}, []);

const handleOverview = useCallback(() => undefined, []);
const handleShell = useCallback(() => undefined, []);
const handleRestart = useCallback(() => undefined, []);

useEffect(() => {
    void loadDashboard(true);

    const refreshInterval = window.setInterval(() => {
        void loadDashboard();
    }, 10_000);

    return () => window.clearInterval(refreshInterval);
}, [loadDashboard]);

const nodes = dashboardData?.overview.nodes ?? [];
const vms = dashboardData?.overview.vms ?? [];
const lxcs = dashboardData?.overview.lxcs ?? [];
const docker = dashboardData?.docker;
const system = dashboardData?.system;

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
        : dashboardData
            ? "Connected"
            : "Unavailable";
const applicationStatusColor = loading
    ? colors.warning
    : error || !dashboardData
        ? colors.danger
        : colors.success;

const runningVms = useMemo(
    () => vms.filter((vm) => vm.status === "running"),
    [vms]
);

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
        return {
            cpu: 0,
            memory: memoryUsage,
            storage: storageUsage
        };
    }

    return {
        cpu: nodes.reduce((total, node) => total + percent(node.cpu), 0) / nodes.length,
        memory: nodes.reduce(
            (total, node) => total + percent(node.maxmem > 0 ? node.mem / node.maxmem : 0),
            0
        ) / nodes.length,
        storage: nodes.reduce(
            (total, node) => total + percent(node.maxdisk > 0 ? node.disk / node.maxdisk : 0),
            0
        ) / nodes.length
    };
}, [memoryUsage, nodes, storageUsage]);

const filteredVms = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return runningVms.filter((vm) =>
        !query || `${vm.vmid} ${vm.name} ${vm.node}`.toLowerCase().includes(query)
    );
}, [runningVms, searchText]);

const filteredLxcs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return runningLxcs.filter((lxc) =>
        !query || `${lxc.vmid} ${lxc.name} ${lxc.node}`.toLowerCase().includes(query)
    );
}, [runningLxcs, searchText]);

const renderGuestTable = (
    title: string,
    guests: ProxmoxResource[],
    emptyMessage: string
): ReactNode => (
    <div style={cardStyle}>
        <h2 style={headingStyle}>{title}</h2>
        {guests.length === 0 ? (
            <p style={{ color: colors.textMuted, margin: 0 }}>{emptyMessage}</p>
        ) : (
            <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>VMID</th>
                            <th>Name</th>
                            <th>Node</th>
                            <th>Status</th>
                            <th>CPU</th>
                            <th>Memory</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guests.map((guest) => (
                            <tr key={`${guest.node}-${guest.vmid}`}>
                                <td>{guest.vmid}</td>
                                <td>{guest.name}</td>
                                <td>{guest.node}</td>
                                <td style={{ color: colors.success }}>{guest.status}</td>
                                <td>{Math.round(percent(guest.cpu))}%</td>
                                <td>
                                    {Math.round(
                                        percent(
                                            guest.maxmem > 0
                                                ? guest.mem / guest.maxmem
                                                : 0
                                        )
                                    )}
                                    %
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

if (loading && !dashboardData) {
    return (
        <main style={pageStyle}>
            <PageHeader title="HomeOps" subtitle="Operations Center" />
            <div
                style={{
                    ...cardStyle,
                    color: colors.textMuted,
                    marginTop: "24px"
                }}
            >
                Loading operations data…
            </div>
        </main>
    );
}

return (
    <main style={pageStyle}>
        <style>{`
            .dashboard-grid { display: grid; gap: 18px; }
            .metrics-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
            .nodes-grid { grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
            .two-column-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .dashboard-table-wrap { overflow-x: auto; }
            .dashboard-table { border-collapse: collapse; min-width: 620px; width: 100%; }
            .dashboard-table th { color: ${colors.textMuted}; font-size: 11px; letter-spacing: .08em; padding: 0 12px 12px; text-align: left; text-transform: uppercase; }
            .dashboard-table td { border-top: 1px solid ${colors.border}; color: ${colors.textSecondary}; font-size: 13px; padding: 13px 12px; }
            .stats-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 720px) {
                .metrics-grid, .two-column-grid, .stats-grid { grid-template-columns: 1fr; }
            }
        `}</style>

        <PageHeader title="HomeOps" subtitle="Operations Center">
            <div
                style={{
                    alignItems: "center",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px"
                }}
            >
                <Button onClick={() => void loadDashboard()} disabled={refreshing}>
                    {refreshing ? "Refreshing…" : "Refresh"}
                </Button>
                <input
                    aria-label="Search running guests"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search VMs and LXCs"
                    style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "8px",
                        color: colors.text,
                        outline: "none",
                        padding: "9px 12px",
                        width: "220px"
                    }}
                />
                <span style={{ color: colors.textMuted, fontSize: "12px" }}>
                    Last updated: {dashboardData?.updatedAt.toLocaleTimeString() ?? "—"}
                </span>
            </div>
        </PageHeader>

        {error && (
            <div
                role="alert"
                style={{
                    background: colors.surface,
                    border: `1px solid ${colors.danger}`,
                    borderRadius: "10px",
                    color: colors.danger,
                    marginTop: "20px",
                    padding: "12px 14px"
                }}
            >
                {error}
            </div>
        )}

        <section className="dashboard-grid metrics-grid" style={sectionStyle}>
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

        <section style={sectionStyle}>
            <HealthCard
                title="Cluster Health"
                loading={loading}
                metrics={[
                    {
                        label: "Average CPU",
                        value: clusterMetrics.cpu,
                        suffix: "%",
                        color: colors.primary
                    },
                    {
                        label: "Memory",
                        value: clusterMetrics.memory,
                        suffix: "%",
                        color: colors.warning
                    },
                    {
                        label: "Disk",
                        value: clusterMetrics.storage,
                        suffix: "%",
                        color: colors.danger
                    },
                    {
                        label: "Node Health",
                        value: nodes.length ? (onlineNodes / nodes.length) * 100 : 0,
                        suffix: "%",
                        color: onlineNodes === nodes.length
                            ? colors.success
                            : colors.warning
                    }
                ]}
            />
        </section>

        <section style={sectionStyle}>
            <h2 style={{ ...headingStyle, marginBottom: "16px" }}>Nodes</h2>
            <div className="dashboard-grid nodes-grid">
                {nodes.map((node) => (
                    <NodeCard
                        key={node.id}
                        node={node.node}
                        status={node.status === "online" ? "online" : "offline"}
                        cpu={percent(node.cpu)}
                        memory={percent(
                            node.maxmem > 0 ? node.mem / node.maxmem : 0
                        )}
                        storage={percent(
                            node.maxdisk > 0 ? node.disk / node.maxdisk : 0
                        )}
                        vmCount={guestCounts[node.node]?.vms ?? 0}
                        lxcCount={guestCounts[node.node]?.lxcs ?? 0}
                        uptime={formatUptime(node.uptime)}
                        onOverview={handleOverview}
                        onShell={handleShell}
                        onRestart={handleRestart}
                    />
                ))}
            </div>
        </section>

        <section style={sectionStyle}>
            <div style={cardStyle}>
                <h2 style={headingStyle}>Activity</h2>
                <div className="stats-grid">
                    <div>
                        <div style={statLabelStyle}>Last refresh</div>
                        <div style={statValueStyle}>
                            {dashboardData?.updatedAt.toLocaleTimeString() ?? "—"}
                        </div>
                    </div>
                    <div>
                        <div style={statLabelStyle}>API status</div>
                        <div
                            style={{
                                ...statValueStyle,
                                color: applicationStatusColor
                            }}
                        >
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
                        <div
                            style={{
                                ...statValueStyle,
                                color: applicationStatusColor
                            }}
                        >
                            {applicationStatus}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="dashboard-grid two-column-grid" style={sectionStyle}>
            {renderGuestTable(
                "Running VMs",
                filteredVms,
                "No running virtual machines."
            )}
            {renderGuestTable(
                "Running LXCs",
                filteredLxcs,
                "No running LXCs."
            )}

            <div style={cardStyle}>
                <h2 style={headingStyle}>Docker Overview</h2>
                <div className="stats-grid">
                    <div>
                        <div style={statLabelStyle}>Server Version</div>
                        <div style={statValueStyle}>
                            {docker?.serverVersion ?? "—"}
                        </div>
                    </div>
                    <div>
                        <div style={statLabelStyle}>Operating System</div>
                        <div style={statValueStyle}>
                            {docker?.operatingSystem ?? "—"}
                        </div>
                    </div>
                    <div>
                        <div style={statLabelStyle}>Images</div>
                        <div style={statValueStyle}>{docker?.images ?? 0}</div>
                    </div>
                    <div>
                        <div style={statLabelStyle}>Containers</div>
                        <div style={statValueStyle}>
                            {docker?.containers ?? 0}
                        </div>
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
                        <div style={statValueStyle}>
                            {system?.hostname ?? "—"}
                        </div>
                    </div>
                    <div>
                        <div style={statLabelStyle}>Uptime</div>
                        <div style={statValueStyle}>
                            {formatUptime(system?.uptime ?? 0)}
                        </div>
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

        <section style={sectionStyle}>
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
    </main>
  );
};

export default Dashboard;
