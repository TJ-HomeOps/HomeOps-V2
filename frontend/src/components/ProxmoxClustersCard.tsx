import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "./common/Button";
import Card from "./common/Card";
import Input from "./common/Input";
import colors from "../theme/colors";
import type {
  ProxmoxClusterEntry,
  ProxmoxClusterInput,
} from "../types/integrations";

const emptyEntry = (): ProxmoxClusterInput => ({
  name: "",
  url: "",
  tokenId: "",
  tokenSecret: "",
});

export default function ProxmoxClustersCard({
  clusters,
  onSave,
}: {
  clusters: ProxmoxClusterEntry[];
  onSave: (
    entries: ProxmoxClusterInput[]
  ) => Promise<{ success: boolean }>;
}) {
  const [entries, setEntries] = useState<ProxmoxClusterInput[]>([]);
  const [secretSet, setSecretSet] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setEntries(
      clusters.map((c) => ({
        name: c.name,
        url: c.url,
        tokenId: c.tokenId,
        tokenSecret: "",
      }))
    );
    setSecretSet(clusters.map((c) => c.tokenSecretSet));
  }, [clusters]);

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => setMessage(null), 6000);

    return () => clearTimeout(timeout);
  }, [message]);

  function updateEntry(
    index: number,
    field: keyof ProxmoxClusterInput,
    value: string
  ) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
    setSecretSet((prev) => [...prev, false]);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setSecretSet((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      setSaving(true);
      await onSave(entries);
      setMessage({ type: "success", text: "Saved." });
      setEntries((prev) => prev.map((entry) => ({ ...entry, tokenSecret: "" })));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Unable to save.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Proxmox (additional clusters)"
      subtitle="Optional — beyond the primary cluster above, merged into the same dashboard."
      padding={20}
      style={{ marginBottom: 20 }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        {entries.map((entry, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gap: 12,
              padding: 16,
              background: colors.surfaceAlt,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                Cluster {index + 1}
              </span>

              <button
                type="button"
                onClick={() => removeEntry(index)}
                aria-label="Remove cluster"
                style={{
                  background: "none",
                  border: "none",
                  color: colors.danger,
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <Input
              label="Display name"
              value={entry.name}
              onChange={(v) => updateEntry(index, "name", v)}
            />

            <Input
              label="URL"
              value={entry.url}
              onChange={(v) => updateEntry(index, "url", v)}
            />

            <Input
              label="Token ID"
              value={entry.tokenId}
              onChange={(v) => updateEntry(index, "tokenId", v)}
            />

            <Input
              type="password"
              label="Token Secret"
              value={entry.tokenSecret}
              onChange={(v) => updateEntry(index, "tokenSecret", v)}
              placeholder={
                secretSet[index]
                  ? "•••••••• (set — leave blank to keep)"
                  : "Not set"
              }
            />
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={addEntry}
        >
          Add cluster
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button onClick={handleSave} loading={saving} size="sm">
            Save
          </Button>

          {message && (
            <span
              style={{
                fontSize: 13,
                color:
                  message.type === "success"
                    ? colors.success
                    : colors.danger,
              }}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
