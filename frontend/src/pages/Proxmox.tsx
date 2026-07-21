import { useEffect, useState } from "react";
import {
  getOverview,
  startVM,
  stopVM,
  restartVM,
  startLXC,
  stopLXC,
  restartLXC,
} from "../api/proxmox";
import type { ProxmoxOverview } from "../api/proxmox";

import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import PowerButtons from "../components/PowerButtons";

export default function Proxmox() {
  const [overview, setOverview] = useState<ProxmoxOverview | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);
  }, []);

  const gb = (bytes: number) =>
    (bytes / 1024 / 1024 / 1024).toFixed(1);

  const percent = (used: number, total: number) =>
    total === 0 ? 0 : Math.round((used / total) * 100);

  async function vmAction(
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
          await startVM(node, vmid);
          break;

        case "stop":
          await stopVM(node, vmid);
          break;

        case "restart":
          await restartVM(node, vmid);
          break;
      }

      setTimeout(load, 1500);
    } catch (err) {
      console.error(err);
      alert("Unable to perform VM action.");
    }
  }

  async function lxcAction(
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
          await startLXC(node, vmid);
          break;

        case "stop":
          await stopLXC(node, vmid);
          break;

        case "restart":
          await restartLXC(node, vmid);
          break;
      }

      setTimeout(load, 1500);
    } catch (err) {
      console.error(err);
      alert("Unable to perform container action.");
    }
  }

  if (loading) {
    return (
      <PageHeader
        title="Proxmox Cluster"
        subtitle="Loading cluster..."
      />
    );
  }

  if (!overview) {
    return (
      <PageHeader
        title="Proxmox Cluster"
        subtitle="Unable to connect."
      />
    );
  }

  const runningVMs = overview.vms.filter(
    (vm) => vm.status === "running"
  ).length;

  const runningLXCs = overview.lxcs.filter(
    (lxc) => lxc.status === "running"
  ).length;

  const avgCPU =
    overview.nodes.length === 0
      ? 0
      : Math.round(
          overview.nodes.reduce((a, b) => a + b.cpu * 100, 0) /
            overview.nodes.length
        );

  const ramUsed = overview.nodes.reduce((a, b) => a + b.mem, 0);
  const ramTotal = overview.nodes.reduce((a, b) => a + b.maxmem, 0);

  return (
    <>
      <PageHeader
        title="Proxmox Cluster"
        subtitle="Live infrastructure overview"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        <StatCard
          title="Nodes"
          value={overview.nodes.length}
          subtitle="Connected"
        />

        <StatCard
          title="Running VMs"
          value={runningVMs}
          subtitle={`${overview.vms.length} total`}
          color="#22c55e"
        />

        <StatCard
          title="Running Containers"
          value={runningLXCs}
          subtitle={`${overview.lxcs.length} total`}
          color="#22c55e"
        />

        <StatCard
          title="Average CPU"
          value={`${avgCPU}%`}
          subtitle="Cluster"
          color="#f59e0b"
        />

        <StatCard
          title="RAM"
          value={`${gb(ramUsed)} GB`}
          subtitle={`of ${gb(ramTotal)} GB`}
          color="#8b5cf6"
        />
      </div>

      <h2 style={{ color: "#fff", marginBottom: 20 }}>
        Virtual Machines
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(380px,1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {overview.vms.map((vm) => (
          <div
            key={vm.id}
            style={{
              background: "#182232",
              border: "1px solid #27364b",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {vm.name}
                </h3>

                <div
                  style={{
                    color: "#94a3b8",
                  }}
                >
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
                value={percent(vm.mem, vm.maxmem)}
                color="#22c55e"
              />
            </div>

            <PowerButtons
              onStart={() => vmAction(vm.node, vm.vmid, "start")}
              onRestart={() => vmAction(vm.node, vm.vmid, "restart")}
              onStop={() => vmAction(vm.node, vm.vmid, "stop")}
            />
          </div>
        ))}
      </div>

      <h2 style={{ color: "#fff", marginBottom: 20 }}>
        Containers
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(380px,1fr))",
          gap: 20,
        }}
      >
        {overview.lxcs.map((lxc) => (
          <div
            key={lxc.id}
            style={{
              background: "#182232",
              border: "1px solid #27364b",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {lxc.name}
                </h3>

                <div
                  style={{
                    color: "#94a3b8",
                  }}
                >
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
                value={percent(lxc.mem, lxc.maxmem)}
                color="#22c55e"
              />
            </div>

            <PowerButtons
              onStart={() => lxcAction(lxc.node, lxc.vmid, "start")}
              onRestart={() => lxcAction(lxc.node, lxc.vmid, "restart")}
              onStop={() => lxcAction(lxc.node, lxc.vmid, "stop")}
            />
          </div>
        ))}
      </div>
    </>
  );
}
