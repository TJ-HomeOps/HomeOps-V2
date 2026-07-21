interface ProgressBarProps {
  value: number;
  color?: string;
}

export default function ProgressBar({
  value,
  color = "#3b82f6",
}: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, value));

  return (
    <div
      style={{
        width: "100%",
        height: 8,
        background: "#0f172a",
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}
