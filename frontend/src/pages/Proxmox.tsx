import { useEffect, useState } from "react";
import { getOverview } from "../api/proxmox";
import type { ProxmoxOverview } from "../api/proxmox";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function Proxmox() {
  const [overview, setOverview] = useState<ProxmoxOverview | null>(null);

  const load = async () => {
    try {
      const data = await getOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!overview) {
    return (
      <PageHeader
        title="Proxmox"
        subtitle="Loading cluster..."
      />
    );
  }

  const gb = (bytes: number) =>
    (bytes / 1024 / 1024 / 1024).toFixed(1);

  const percent = (used: number, total: number) =>
    total === 0 ? 0 : Math.round((used / total) * 100);

  return (
    <>
      <PageHeader
        title="Proxmox Cluster"
        subtitle="Live infrastructure overview"
      />

      {/* Nodes */}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: "#fff", marginBottom: 20 }}>
          Nodes
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: 20,
          }}
        >
          {overview.nodes.map((node) => (
            <div
              key={node.id}
              style={{
                background: "#182232",
                borderRadius: 16,
                padding: 24,
                border: "1px solid #27364b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#fff",
                    }}
                  >
                    {node.node.toUpperCase()}
                  </h3>

                  <div
                    style={{
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    {node.maxcpu} CPU cores
                  </div>
                </div>

                <StatusBadge status={node.status} />
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  lineHeight: 2,
                }}
              >
                <div>
                  CPU: {Math.round(node.cpu * 100)}%
                </div>

                <div>
                  Memory: {gb(node.mem)} /{" "}
                  {gb(node.maxmem)} GB
                </div>

                <div>
                  Disk: {gb(node.disk)} /{" "}
                  {gb(node.maxdisk)} GB
                </div>

                <div>
                  Uptime:{" "}
                  {Math.floor(node.uptime / 86400)} days
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Virtual Machines */}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: "#fff", marginBottom: 20 }}>
          Virtual Machines ({overview.vms.length})
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: 20,
          }}
        >
          {overview.vms.map((vm) => (
            <div
              key={vm.id}
              style={{
                background: "#182232",
                borderRadius: 16,
                padding: 24,
                border: "1px solid #27364b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#fff",
                    }}
                  >
                    {vm.name}
                  </h3>

                  <div
                    style={{
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    VM {vm.vmid} • {vm.node}
                  </div>
                </div>

                <StatusBadge status={vm.status} />
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  lineHeight: 2,
                  marginTop: 18,
                }}
              >
                <div>
                  CPU: {Math.round(vm.cpu * 100)}%
                </div>

                <div>
                  Memory: {gb(vm.mem)} /{" "}
                  {gb(vm.maxmem)} GB
                </div>

                <div>
                  Usage: {percent(vm.mem, vm.maxmem)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Containers */}

      <section>
        <h2 style={{ color: "#fff", marginBottom: 20 }}>
          Containers ({overview.lxcs.length})
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: 20,
          }}
        >
          {overview.lxcs.map((lxc) => (
            <div
              key={lxc.id}
              style={{
                background: "#182232",
                borderRadius: 16,
                padding: 24,
                border: "1px solid #27364b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#fff",
                    }}
                  >
                    {lxc.name}
                  </h3>

                  <div
                    style={{
                      color: "#94a3b8",
                      marginTop: 4,
                    }}
                  >
                    CT {lxc.vmid} • {lxc.node}
                  </div>
                </div>

                <StatusBadge status={lxc.status} />
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  lineHeight: 2,
                  marginTop: 18,
                }}
              >
                <div>
                  CPU: {Math.round(lxc.cpu * 100)}%
                </div>

                <div>
                  Memory: {gb(lxc.mem)} /{" "}
                  {gb(lxc.maxmem)} GB
                </div>

                <div>
                  Usage: {percent(lxc.mem, lxc.maxmem)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
