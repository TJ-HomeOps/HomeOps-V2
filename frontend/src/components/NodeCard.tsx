import React from "react";
import Card from "./common/Card";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import Button from "./common/Button";
import colors from "../theme/colors";

export interface NodeCardProps {
  node: string;

  status: "online" | "offline";

  cpu: number;
  memory: number;
  storage: number;

  vmCount: number;
  lxcCount: number;

  uptime: string;

  loadAverage?: string;

  onOverview?: () => void;
  onShell?: () => void;
  onRestart?: () => void;
}

export default function NodeCard({
  node,
  status,

  cpu,
  memory,
  storage,

  vmCount,
  lxcCount,

  uptime,
  loadAverage,

  onOverview,
  onShell,
  onRestart,
}: NodeCardProps) {
  return (
    <Card
      hoverable
      title={node}
      actions={
        <StatusBadge
          status={status}
        />
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* CPU */}

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: colors.textSecondary }}>
              CPU
            </span>

            <span>{cpu}%</span>
          </div>

          <ProgressBar value={cpu} />
        </div>

        {/* Memory */}

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: colors.textSecondary }}>
              Memory
            </span>

            <span>{memory}%</span>
          </div>

          <ProgressBar
            value={memory}
            color={colors.success}
          />
        </div>

        {/* Storage */}

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ color: colors.textSecondary }}>
              Storage
            </span>

            <span>{storage}%</span>
          </div>

          <ProgressBar
            value={storage}
            color={colors.warning}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
            marginTop: 8,
          }}
        >
          <Stat
            label="VMs"
            value={vmCount}
          />

          <Stat
            label="LXCs"
            value={lxcCount}
          />

          <Stat
            label="Uptime"
            value={uptime}
          />

          <Stat
            label="Load"
            value={loadAverage ?? "-"}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 8,
          }}
        >
          <Button
            size="sm"
            fullWidth
            onClick={onOverview}
          >
            Overview
          </Button>

          <Button
            size="sm"
            variant="secondary"
            fullWidth
            onClick={onShell}
          >
            Shell
          </Button>

          <Button
            size="sm"
            variant="warning"
            fullWidth
            onClick={onRestart}
          >
            Restart
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface StatProps {
  label: string;
  value: React.ReactNode;
}

function Stat({
  label,
  value,
}: StatProps) {
  return (
    <div
      style={{
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          color: colors.textMuted,
          fontSize: 12,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: colors.text,
          fontWeight: 700,
          fontSize: 18,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
