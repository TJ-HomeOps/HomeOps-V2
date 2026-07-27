import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { getAuthSession, getAuthStatus, login } from "../api/auth";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Spinner from "../components/common/Spinner";
import colors from "../theme/colors";

type GateState =
  | "checking"
  | "open"
  | "authenticated"
  | "needsPassword"
  | "error";

const centeredPageStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.background,
  padding: 20,
};

export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { enabled } = await getAuthStatus();

        if (cancelled) return;

        if (!enabled) {
          setState("open");
          return;
        }

        try {
          await getAuthSession();

          if (!cancelled) setState("authenticated");
        } catch {
          if (!cancelled) setState("needsPassword");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") {
    return (
      <div style={centeredPageStyle}>
        <Spinner label="Checking access" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={centeredPageStyle}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <Alert title="Unable to reach the server" variant="danger">
            Check your connection and reload the page.
          </Alert>
        </div>
      </div>
    );
  }

  if (state === "needsPassword") {
    return <PasswordPrompt onSuccess={() => setState("authenticated")} />;
  }

  return <>{children}</>;
}

function PasswordPrompt({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!password) return;

    try {
      setSubmitting(true);
      setError("");

      await login(password);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={centeredPageStyle}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
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
            Password required
          </div>

          <div
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              marginTop: 6,
            }}
          >
            This app is password protected.
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            style={{ marginBottom: 16 }}
          >
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
