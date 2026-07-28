import { useEffect, useState, type ReactNode } from "react";
import { getAuthSession, getAuthStatus, login } from "../api/auth";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import LockPrompt from "../components/LockPrompt";
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
    return (
      <LockPrompt
        subtitle="This app is password protected."
        onLogin={login}
        onSuccess={() => setState("authenticated")}
      />
    );
  }

  return <>{children}</>;
}
