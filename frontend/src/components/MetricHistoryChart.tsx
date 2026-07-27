import { useMemo } from "react";
import colors from "../theme/colors";

export interface MetricChartSeries {
  key: string;
  label: string;
  color: string;
  points: { t: string; v: number }[];
}

interface MetricHistoryChartProps {
  title: string;
  series: MetricChartSeries[];
  height?: number;
  // Most callers are 0-100 percentages; temperature and other non-percent
  // metrics pass their own scale and unit suffix.
  maxValue?: number;
  unit?: string;
}

const width = 600;

export default function MetricHistoryChart({
  title,
  series,
  height = 140,
  maxValue = 100,
  unit = "%",
}: MetricHistoryChartProps) {
  const gridMarks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * maxValue);
  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const item of series) {
      for (const point of item.points) {
        const time = new Date(point.t).getTime();
        if (time < min) min = time;
        if (time > max) max = time;
      }
    }

    if (!isFinite(min) || !isFinite(max) || min === max) {
      return { minTime: 0, maxTime: 1 };
    }

    return { minTime: min, maxTime: max };
  }, [series]);

  const xFor = (t: string) => {
    const ratio = (new Date(t).getTime() - minTime) / (maxTime - minTime || 1);
    return ratio * width;
  };

  const yFor = (v: number) => {
    const clamped = Math.max(0, Math.min(maxValue, v));
    return height - (clamped / maxValue) * height;
  };

  const hasData = series.some((item) => item.points.length > 1);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>
          {title}
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {series.map((item) => {
            const last = item.points[item.points.length - 1];

            return (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: item.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {item.label}
                {last && (
                  <span style={{ color: colors.textMuted }}>
                    {last.v.toFixed(0)}
                    {unit}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!hasData && (
        <div
          style={{
            color: colors.textMuted,
            fontSize: 13,
            padding: "24px 0",
            textAlign: "center",
          }}
        >
          Not enough history yet.
        </div>
      )}

      {hasData && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
        >
          {gridMarks.map((mark) => (
            <line
              key={mark}
              x1={0}
              x2={width}
              y1={yFor(mark)}
              y2={yFor(mark)}
              stroke={colors.border}
              strokeWidth={1}
            />
          ))}

          {series.map((item) => {
            if (item.points.length < 2) {
              return null;
            }

            const path = item.points
              .map(
                (point, index) =>
                  `${index === 0 ? "M" : "L"}${xFor(point.t).toFixed(1)},${yFor(
                    point.v
                  ).toFixed(1)}`
              )
              .join(" ");

            return (
              <path
                key={item.key}
                d={path}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {series.map((item) =>
            item.points.map((point, index) => (
              <circle
                key={`${item.key}-${index}`}
                cx={xFor(point.t)}
                cy={yFor(point.v)}
                r={6}
                fill="transparent"
                stroke="none"
              >
                <title>{`${item.label}: ${point.v.toFixed(1)}${unit} at ${new Date(
                  point.t
                ).toLocaleTimeString()}`}</title>
              </circle>
            ))
          )}

          {series.map((item) => {
            const last = item.points[item.points.length - 1];

            if (!last) {
              return null;
            }

            return (
              <circle
                key={`${item.key}-last`}
                cx={xFor(last.t)}
                cy={yFor(last.v)}
                r={3}
                fill={item.color}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
