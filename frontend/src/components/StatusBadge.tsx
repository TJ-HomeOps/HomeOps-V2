interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const running =
    status === "running" ||
    status === "online";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 13,
        background: running ? "#0f2f1c" : "#3b1616",
        color: running ? "#4ade80" : "#f87171",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: running ? "#22c55e" : "#ef4444",
        }}
      />

      {status}
    </span>
  );
}
