import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Table from "../components/common/Table";
import type { TableColumn } from "../components/common/Table";
import ConfirmDialog from "../components/ConfirmDialog";
import colors from "../theme/colors";
import { applyUpdate, getUpdates } from "../api/updates";
import type { ContainerUpdate } from "../types/updates";

const WUD_DASHBOARD_URL = "http://192.168.0.20:3009";

const diffColor: Record<string, string> = {
  major: colors.danger,
  minor: colors.warning,
  patch: colors.success,
};

function UpdateBadge({ container }: { container: ContainerUpdate }) {
  if (!container.updateAvailable) {
    return (
      <span style={{ color: colors.textMuted, fontSize: 13 }}>
        Up to date
      </span>
    );
  }

  const color = container.semverDiff
    ? diffColor[container.semverDiff] ?? colors.warning
    : colors.warning;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color,
        background: `${color}22`,
      }}
    >
      {container.semverDiff ? container.semverDiff.toUpperCase() : "UPDATE"}
    </span>
  );
}

export default function Watchtower() {
  const [data, setData] = useState<{
    containers: ContainerUpdate[];
    updateCount: number;
    watchedCount: number;
  } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingConfirm, setPendingConfirm] =
    useState<ContainerUpdate | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function load() {
    try {
      setData(await getUpdates());
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => setMessage(null), 8000);

    return () => clearTimeout(timeout);
  }, [message]);

  const affectedByProject = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const c of data?.containers ?? []) {
      if (!c.composeProject) continue;

      const list = map.get(c.composeProject) ?? [];
      list.push(c.name);
      map.set(c.composeProject, list);
    }

    return map;
  }, [data]);

  async function confirmUpdate() {
    if (!pendingConfirm) return;

    const container = pendingConfirm;
    setPendingConfirm(null);
    setUpdatingId(container.id);

    try {
      await applyUpdate(container.id);
      setMessage({
        type: "success",
        text: `${container.composeProject ?? container.name} updated.`,
      });
      await load();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : `Failed to update ${container.name}.`,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const columns: TableColumn<ContainerUpdate>[] = [
    {
      key: "name",
      title: "Container",
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.name}</span>
      ),
    },
    {
      key: "image",
      title: "Image",
      render: (row) => (
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>
          {row.image}
        </span>
      ),
    },
    {
      key: "currentVersion",
      title: "Current",
      render: (row) => row.currentVersion || "—",
    },
    {
      key: "newVersion",
      title: "Latest",
      render: (row) => row.newVersion || "—",
    },
    {
      key: "updateAvailable",
      title: "Status",
      render: (row) => <UpdateBadge container={row} />,
    },
    {
      key: "actions",
      title: "",
      align: "right",
      render: (row) => {
        if (!row.updateAvailable) return null;

        if (!row.composeWorkingDir) {
          return (
            <span style={{ color: colors.textMuted, fontSize: 12 }}>
              Manual only
            </span>
          );
        }

        const isUpdating = updatingId === row.id;

        return (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => setPendingConfirm(row)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: colors.white,
              background: isUpdating ? colors.textMuted : colors.primary,
              cursor: isUpdating ? "default" : "pointer",
            }}
          >
            <RefreshCw
              size={13}
              className={isUpdating ? "spin" : undefined}
            />
            {isUpdating ? "Updating..." : "Update"}
          </button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <PageHeader
          title="Watchtower"
          subtitle="Loading update status..."
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Watchtower"
        subtitle="Update availability across all containers — checked nightly, nothing applies automatically."
      >
        <a
          href={WUD_DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: colors.primary,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Open full dashboard <ExternalLink size={14} />
        </a>
      </PageHeader>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 14,
            color:
              message.type === "success" ? colors.success : colors.danger,
            background:
              message.type === "success"
                ? `${colors.success}18`
                : `${colors.danger}18`,
            border: `1px solid ${
              message.type === "success" ? colors.success : colors.danger
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      {error || !data ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: colors.surface,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h2>Unable to load update status</h2>
          <p style={{ color: colors.textSecondary }}>
            What's Up Docker could not be reached at {WUD_DASHBOARD_URL}.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard title="Watched containers" value={data.watchedCount} />

            <StatCard
              title="Updates available"
              value={data.updateCount}
              color={data.updateCount > 0 ? colors.warning : colors.success}
            />

            <StatCard
              title="Up to date"
              value={data.watchedCount - data.updateCount}
              color={colors.success}
            />
          </div>

          <Table
            columns={columns}
            data={[...data.containers].sort(
              (a, b) =>
                Number(b.updateAvailable) - Number(a.updateAvailable) ||
                a.name.localeCompare(b.name)
            )}
            rowKey="id"
            striped
            emptyText="No watched containers."
          />
        </>
      )}

      <ConfirmDialog
        open={pendingConfirm !== null}
        title="Apply update?"
        message={
          pendingConfirm
            ? `This runs "docker compose pull && up -d" in the "${
                pendingConfirm.composeProject
              }" project, updating: ${
                affectedByProject
                  .get(pendingConfirm.composeProject ?? "")
                  ?.join(", ") ?? pendingConfirm.name
              }. Affected services will restart.`
            : ""
        }
        confirmText="Update"
        onConfirm={confirmUpdate}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
