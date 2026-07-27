import { useCallback, useEffect, useState } from "react";
import { Box, ListChecks, RefreshCw, Server } from "lucide-react";
import { getAuditLog } from "../api/audit";
import type { AuditEntry } from "../api/audit";
import { subscribeToLiveUpdates } from "../api/ws";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import colors from "../theme/colors";

const pollIntervalMs = 15000;

const entityLabels: Record<string, string> = {
  container: "Container",
  qemu: "VM",
  lxc: "LXC",
};

function describeAction(action: string): { entity: string; verb: string } {
  const [entityKey, verbKey] = action.split(".");
  const entity = entityLabels[entityKey] ?? entityKey;
  const verb = verbKey
    ? verbKey.charAt(0).toUpperCase() + verbKey.slice(1)
    : action;

  return { entity, verb };
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getAuditLog();
      setEntries(data);
      setError(null);
    } catch {
      setError("Unable to load the audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();

    const timer = setInterval(() => {
      void loadEntries();
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [loadEntries]);

  useEffect(() => {
    return subscribeToLiveUpdates((message) => {
      if (message.type !== "audit.created") {
        return;
      }

      const entry = message.data as AuditEntry;

      setEntries((current) =>
        current.some((item) => item.id === entry.id)
          ? current
          : [entry, ...current]
      );
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Start, stop, and restart actions taken from HomeOps"
      >
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => {
            void loadEntries();
          }}
        >
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <Alert
          title="Audit log unavailable"
          variant="danger"
          style={{ marginBottom: 20 }}
        >
          {error}
        </Alert>
      )}

      <Card
        title="Recent actions"
        subtitle="Most recent first"
        actions={<ListChecks size={20} color={colors.primary} />}
        padding={20}
      >
        {loading && (
          <div style={{ padding: "48px 0" }}>
            <Spinner label="Loading audit log" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: colors.textSecondary,
            }}
          >
            No actions have been taken yet.
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {entries.map((entry) => {
              const { entity, verb } = describeAction(entry.action);
              const isFailure = entry.result === "failure";
              const accentColor = isFailure ? colors.danger : colors.success;
              const Icon = entity === "Container" ? Box : Server;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: 14,
                    borderRadius: 10,
                    background: colors.surface,
                    borderLeft: `4px solid ${accentColor}`,
                  }}
                >
                  <div style={{ color: accentColor, marginTop: 2 }}>
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ color: colors.text, fontWeight: 700 }}>
                        {verb} {entity} {entry.target}
                      </div>

                      <div style={{ color: colors.textMuted, fontSize: 12 }}>
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div
                      style={{
                        color: isFailure ? colors.danger : colors.textSecondary,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      {isFailure
                        ? entry.detail ?? "Action failed."
                        : "Completed successfully."}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
