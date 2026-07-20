interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 24,
        minWidth: 220,
        flex: 1,
        transition: "0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <span
          style={{
            color: "#94a3b8",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {title}
        </span>

        {icon && (
          <span
            style={{
              fontSize: 28,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          color: "#f8fafc",
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 10,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
