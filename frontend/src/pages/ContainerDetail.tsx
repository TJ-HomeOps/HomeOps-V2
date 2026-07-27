import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getContainer,
  getContainerLogs,
  restartContainer,
  startContainer,
  stopContainer,
} from "../api/docker";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import StatusBadge from "../components/StatusBadge";
import PowerButtons from "../components/PowerButtons";
import colors from "../theme/colors";

interface ContainerInspect {
  Id: string;
  Name: string;
  Image: string;
  Created: string;
  RestartCount: number;
  State: {
    Status: string;
    Running: boolean;
    Pid: number;
    StartedAt: string;
    ExitCode: number;
  };
  Config: {
    Env?: string[];
  };
  NetworkSettings: {
    Ports?: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
  };
  Mounts?: Array<{
    Source: string;
    Destination: string;
    Mode: string;
    Type: string;
  }>;
}

export default function ContainerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [container, setContainer] = useState<ContainerInspect | null>(null);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const data = await getContainer(id);
      setContainer(data as ContainerInspect);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load container.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLogs = useCallback(async () => {
    if (!id) return;

    try {
      setLogs(await getContainerLogs(id));
    } catch {
      // Logs are a secondary panel; a failure here shouldn't blank the page.
    }
  }, [id]);

  useEffect(() => {
    void load();
    void loadLogs();

    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, [load, loadLogs]);

  const runAction = async (action: "start" | "stop" | "restart") => {
    if (!id) return;

    if (
      action !== "start" &&
      !confirm(`Are you sure you want to ${action} this container?`)
    ) {
      return;
    }

    const handlers = { start: startContainer, stop: stopContainer, restart: restartContainer };

    try {
      setActionPending(true);
      await handlers[action](id);
      setTimeout(load, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to perform action.");
    } finally {
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Container" subtitle="Loading..." />
        <Spinner label="Loading" />
      </>
    );
  }

  if (error && !container) {
    return (
      <>
        <PageHeader title="Container" subtitle={id ?? ""} />
        <Alert title="Unable to load" variant="danger">
          {error}
        </Alert>
      </>
    );
  }

  if (!container) return null;

  const name = container.Name.replace(/^\//, "");
  const ports = Object.entries(container.NetworkSettings.Ports ?? {}).filter(
    ([, bindings]) => bindings && bindings.length > 0
  );

  return (
    <>
      <PageHeader title={name} subtitle={container.Image}>
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
          onClick={() => {
            void load();
            void loadLogs();
          }}
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
        actions={
          <StatusBadge state={container.State.Status} status={container.State.Status} />
        }
        padding={20}
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Stat
            label="Started"
            value={
              container.State.Running
                ? new Date(container.State.StartedAt).toLocaleString()
                : "-"
            }
          />
          <Stat label="PID" value={container.State.Running ? container.State.Pid : "-"} />
          <Stat label="Restart count" value={container.RestartCount} />
          <Stat label="Exit code" value={container.State.ExitCode} />
        </div>

        <PowerButtons
          onStart={async () => runAction("start")}
          onRestart={async () => runAction("restart")}
          onStop={async () => runAction("stop")}
        />

        {actionPending && (
          <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 12 }}>
            Working…
          </div>
        )}
      </Card>

      {ports.length > 0 && (
        <Card title="Ports" padding={20} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {ports.map(([containerPort, bindings]) => (
              <div
                key={containerPort}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  padding: "6px 0",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ color: colors.text, fontFamily: "monospace" }}>
                  {containerPort}
                </span>
                <span style={{ color: colors.textSecondary, fontFamily: "monospace" }}>
                  {bindings?.map((b) => `${b.HostIp || "0.0.0.0"}:${b.HostPort}`).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(container.Mounts?.length ?? 0) > 0 && (
        <Card title="Mounts" padding={20} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {container.Mounts!.map((mount, index) => (
              <div
                key={index}
                style={{
                  fontSize: 13,
                  padding: "6px 0",
                  borderBottom: `1px solid ${colors.border}`,
                  fontFamily: "monospace",
                  color: colors.textSecondary,
                  wordBreak: "break-all",
                }}
              >
                {mount.Source} → {mount.Destination} ({mount.Mode || "rw"})
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Logs" subtitle="Last 200 lines" padding={20} style={{ marginBottom: 20 }}>
        <pre
          style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: 16,
            maxHeight: 400,
            overflow: "auto",
            fontSize: 12,
            color: colors.textSecondary,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {logs || "No logs available."}
        </pre>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/containers" style={{ color: colors.primary, fontSize: 14 }}>
          ← Back to containers
        </Link>
      </div>
    </>
  );
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
