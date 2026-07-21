import { useState } from "react";

interface PowerButtonsProps {
  onStart: () => Promise<void>;
  onRestart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export default function PowerButtons({
  onStart,
  onRestart,
  onStop,
}: PowerButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function execute(action: () => Promise<void>) {
    if (loading) return;

    try {
      setLoading(true);
      await action();
    } finally {
      setLoading(false);
    }
  }

  const buttonStyle: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    cursor: loading ? "default" : "pointer",
    fontWeight: 600,
    color: "#fff",
    transition: "0.2s",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 20,
      }}
    >
      <button
        disabled={loading}
        style={{
          ...buttonStyle,
          background: "#16a34a",
        }}
        onClick={() => execute(onStart)}
      >
        ▶ Start
      </button>

      <button
        disabled={loading}
        style={{
          ...buttonStyle,
          background: "#2563eb",
        }}
        onClick={() => execute(onRestart)}
      >
        🔄 Restart
      </button>

      <button
        disabled={loading}
        style={{
          ...buttonStyle,
          background: "#dc2626",
        }}
        onClick={() => execute(onStop)}
      >
        ⏹ Stop
      </button>
    </div>
  );
}
