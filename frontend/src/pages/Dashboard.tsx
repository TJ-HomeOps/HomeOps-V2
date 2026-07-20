import { useEffect, useState } from "react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

const API = "http://192.168.0.20:3000";

interface DockerInfo {
  containers: number;
  running: number;
  stopped: number;
  images: number;
  cpu: number;
  memory: number;
}

interface SystemInfo {
  hostname: string;
  uptime: number;
  memory: {
    total: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    percent: number;
  };
}

export default function Dashboard() {
  const [docker, setDocker] = useState<DockerInfo | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);

  async function load() {
    try {
      const [dockerRes, systemRes] = await Promise.all([
        fetch(`${API}/api/docker`),
        fetch(`${API}/api/system`)
      ]);

      setDocker(await dockerRes.json());
      setSystem(await systemRes.json());
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 10000);

    return () => clearInterval(timer);
  }, []);

  if (!docker || !system) {
    return (
      <div className="page">
        <PageHeader
          title="Dashboard"
          subtitle="Loading..."
        />
      </div>
    );
  }

  return (
    <div className="page">

      <PageHeader
        title="Dashboard"
        subtitle="HomeOps Infrastructure Overview"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 20,
        }}
      >
        <StatCard
          title="Containers"
          value={docker.containers}
          subtitle={`${docker.running} running • ${docker.stopped} stopped`}
          icon="📦"
        />

        <StatCard
          title="Docker Images"
          value={docker.images}
          subtitle="Installed"
          icon="🐳"
        />

        <StatCard
          title="Memory Usage"
          value={`${system.memory.percent}%`}
          subtitle={`${(
            system.memory.used /
            1024 /
            1024 /
            1024
          ).toFixed(1)} GB Used`}
          icon="💾"
        />

        <StatCard
          title="Disk Usage"
          value={`${system.disk.percent}%`}
          subtitle={`${(
            system.disk.used /
            1024 /
            1024 /
            1024
          ).toFixed(0)} GB Used`}
          icon="🗄️"
        />
      </div>

      <div
        style={{
          marginTop: 30,
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <h2
          style={{
            marginBottom: 20,
          }}
        >
          Server Information
        </h2>

        <p>
          <strong>Hostname:</strong> {system.hostname}
        </p>

        <p>
          <strong>Docker Containers:</strong> {docker.containers}
        </p>

        <p>
          <strong>Running:</strong> {docker.running}
        </p>

        <p>
          <strong>Stopped:</strong> {docker.stopped}
        </p>

        <p>
          <strong>CPU Cores:</strong> {docker.cpu}
        </p>
      </div>

    </div>
  );
}
