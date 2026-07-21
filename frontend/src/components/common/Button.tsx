import React from "react";
import colors from "../../theme/colors";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "ghost";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps {
  children: React.ReactNode;

  onClick?: () => void;

  disabled?: boolean;

  loading?: boolean;

  fullWidth?: boolean;

  rounded?: boolean;

  leftIcon?: React.ReactNode;

  rightIcon?: React.ReactNode;

  variant?: ButtonVariant;

  size?: ButtonSize;

  type?: "button" | "submit" | "reset";

  style?: React.CSSProperties;

  className?: string;
}

const backgrounds: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surfaceAlt,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  outline: "transparent",
  ghost: "transparent",
};

const textColors: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.white,
  success: colors.white,
  warning: colors.white,
  danger: colors.white,
  outline: colors.text,
  ghost: colors.text,
};

const borders: Record<ButtonVariant, string> = {
  primary: "none",
  secondary: "none",
  success: "none",
  warning: "none",
  danger: "none",
  outline: `1px solid ${colors.border}`,
  ghost: "none",
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  xs: {
    padding: "6px 10px",
    fontSize: 12,
  },
  sm: {
    padding: "8px 14px",
    fontSize: 13,
  },
  md: {
    padding: "10px 18px",
    fontSize: 14,
  },
  lg: {
    padding: "12px 22px",
    fontSize: 15,
  },
  xl: {
    padding: "14px 26px",
    fontSize: 16,
  },
};

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  rounded = false,
  fullWidth = false,
  type = "button",
  style,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <>
      <style>
        {`
          @keyframes homeops-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,

          fontWeight: 600,

          cursor: isDisabled ? "not-allowed" : "pointer",

          transition: "all .2s ease",

          opacity: isDisabled ? 0.6 : 1,

          width: fullWidth ? "100%" : undefined,

          borderRadius: rounded ? 999 : 10,

          background: backgrounds[variant],

          color: textColors[variant],

          border: borders[variant],

          ...sizes[size],

          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.filter = "brightness(1.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "brightness(1)";
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,.35)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "homeops-spin 1s linear infinite",
              }}
            />

            Loading...
          </>
        ) : (
          <>
            {leftIcon}

            {children}

            {rightIcon}
          </>
        )}
      </button>
    </>
  );
}
