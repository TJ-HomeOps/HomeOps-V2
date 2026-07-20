interface MetricCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function MetricCard({
  label,
  value,
  color = "#2563eb",
}: MetricCardProps) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 80,
      }}
    >
      <div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 13,
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f8fafc",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
