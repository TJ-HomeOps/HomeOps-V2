import React from "react";
import Card from "./common/Card";
import colors from "../theme/colors";

export interface MetricCardProps {
  title: string;

  value: string | number;

  subtitle?: string;

  icon?: React.ReactNode;

  color?: string;

  loading?: boolean;

  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  loading = false,
  onClick,
}: MetricCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              marginTop: 6,
              color: loading ? colors.textMuted : colors.text,
            }}
          >
            {loading ? "--" : value}
          </div>

          {subtitle && (
            <div
              style={{
                color: colors.textSecondary,
                marginTop: 6,
                fontSize: 13,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {icon && (
          <div
            style={{
              width: 56,
              height: 56,

              borderRadius: 14,

              background: color,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#fff",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
