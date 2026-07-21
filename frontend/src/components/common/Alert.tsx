import React from "react";
import colors from "../../theme/colors";

export type AlertVariant =
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface AlertProps {
  title?: string;

  children: React.ReactNode;

  variant?: AlertVariant;

  icon?: React.ReactNode;

  onClose?: () => void;

  style?: React.CSSProperties;
}

const variantStyles = {
  success: {
    background: "rgba(22,163,74,.12)",
    border: colors.success,
    color: colors.success,
  },

  warning: {
    background: "rgba(217,119,6,.12)",
    border: colors.warning,
    color: colors.warning,
  },

  danger: {
    background: "rgba(220,38,38,.12)",
    border: colors.danger,
    color: colors.danger,
  },

  info: {
    background: "rgba(37,99,235,.12)",
    border: colors.primary,
    color: colors.primary,
  },
};

export default function Alert({
  title,
  children,
  variant = "info",
  icon,
  onClose,
  style,
}: AlertProps) {
  const current = variantStyles[variant];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,

        background: current.background,

        borderLeft: `4px solid ${current.border}`,

        borderRadius: 10,

        padding: 16,

        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            color: current.color,
            display: "flex",
            marginTop: 2,
          }}
        >
          {icon}
        </div>
      )}

      <div
        style={{
          flex: 1,
        }}
      >
        {title && (
          <div
            style={{
              color: colors.text,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            color: colors.textSecondary,
            lineHeight: 1.5,
            fontSize: 14,
          }}
        >
          {children}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: colors.textMuted,
            cursor: "pointer",
            fontSize: 18,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
