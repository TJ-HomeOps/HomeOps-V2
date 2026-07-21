import React from "react";
import Card from "./common/Card";
import ProgressBar from "./ProgressBar";
import colors from "../theme/colors";

export interface HealthMetric {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

interface HealthCardProps {
  title: string;

  metrics: HealthMetric[];

  footer?: React.ReactNode;

  actions?: React.ReactNode;

  loading?: boolean;
}

export default function HealthCard({
  title,
  metrics,
  footer,
  actions,
}: HealthCardProps) {
  return (
    <Card
      title={title}
      actions={actions}
      footer={footer}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                {metric.label}
              </span>

              <span
                style={{
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {metric.value}
                {metric.suffix ?? "%"}
              </span>
            </div>

            <ProgressBar
              value={metric.value}
              color={metric.color}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
