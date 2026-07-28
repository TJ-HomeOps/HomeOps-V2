import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import Alert from "./common/Alert";
import Button from "./common/Button";
import Input from "./common/Input";
import colors from "../theme/colors";

const centeredPageStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.background,
  padding: 20,
};

interface LockPromptProps {
  title?: string;
  subtitle?: string;
  onLogin: (password: string) => Promise<unknown>;
  onSuccess: () => void;
  // AuthGate fills the whole viewport; the Settings-page gate just fills
  // the content area, so it shouldn't force a fresh 100vh centered block.
  fullScreen?: boolean;
}

export default function LockPrompt({
  title = "Password required",
  subtitle = "This is password protected.",
  onLogin,
  onSuccess,
  fullScreen = true,
}: LockPromptProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!password) return;

    try {
      setSubmitting(true);
      setError("");

      await onLogin(password);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={fullScreen ? centeredPageStyle : { padding: "60px 20px" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          margin: "0 auto",
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Lock size={36} color={colors.primary} />

          <div
            style={{
              color: colors.text,
              fontWeight: 700,
              fontSize: 20,
              marginTop: 12,
            }}
          >
            {title}
          </div>

          <div
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        </div>

        {error && (
          <Alert variant="danger" style={{ marginBottom: 16 }}>
            {error}
          </Alert>
        )}

        <div style={{ marginBottom: 20 }}>
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoFocus
          />
        </div>

        <Button
          type="submit"
          fullWidth
          disabled={!password || submitting}
          loading={submitting}
        >
          Unlock
        </Button>
      </form>
    </div>
  );
}
