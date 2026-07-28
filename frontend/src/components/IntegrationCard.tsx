import { useEffect, useState } from "react";
import Button from "./common/Button";
import Card from "./common/Card";
import Input from "./common/Input";
import colors from "../theme/colors";
import type { Integration } from "../types/integrations";

export default function IntegrationCard({
  integration,
  onSave,
}: {
  integration: Integration;
  onSave: (
    key: string,
    values: Record<string, string>
  ) => Promise<{ success: boolean }>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};

    for (const field of integration.fields) {
      initial[field.name] = field.secret ? "" : field.value ?? "";
    }

    setValues(initial);
  }, [integration]);

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => setMessage(null), 6000);

    return () => clearTimeout(timeout);
  }, [message]);

  async function handleSave() {
    try {
      setSaving(true);
      await onSave(integration.key, values);
      setMessage({ type: "success", text: "Saved." });

      // Secret inputs go blank again after a save — they never round-trip
      // back from the server, so there is nothing to re-populate them with.
      setValues((prev) => {
        const next = { ...prev };

        for (const field of integration.fields) {
          if (field.secret) next[field.name] = "";
        }

        return next;
      });
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
      title={integration.label}
      subtitle={integration.description}
      padding={20}
      style={{ marginBottom: 20 }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        {integration.fields.map((field) => (
          <Input
            key={field.name}
            type={field.secret ? "password" : "text"}
            label={field.label}
            required={field.required}
            value={values[field.name] ?? ""}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, [field.name]: value }))
            }
            placeholder={
              field.secret
                ? field.set
                  ? "•••••••• (set — leave blank to keep)"
                  : "Not set"
                : undefined
            }
          />
        ))}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
          }}
        >
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
