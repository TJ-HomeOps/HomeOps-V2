interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  color = "#3b82f6",
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#182232",
        border: "1px solid #27364b",
        borderRadius: 16,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontSize: 14,
        }}
      >
        {title}
      </span>

      <span
        style={{
          color,
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </span>

      {subtitle && (
        <span
          style={{
            color: "#cbd5e1",
            fontSize: 14,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
