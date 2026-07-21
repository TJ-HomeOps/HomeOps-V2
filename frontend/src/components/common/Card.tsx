import React from "react";
import colors from "../../theme/colors";

export interface CardProps {
  children: React.ReactNode;

  title?: string;

  subtitle?: string;

  actions?: React.ReactNode;

  footer?: React.ReactNode;

  hoverable?: boolean;

  padding?: number;

  style?: React.CSSProperties;

  className?: string;

  onClick?: () => void;
}

export default function Card({
  children,
  title,
  subtitle,
  actions,
  footer,
  hoverable = false,
  padding = 20,
  style,
  className,
  onClick,
}: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: colors.surface,

        border: `1px solid ${colors.border}`,

        borderRadius: 14,

        overflow: "hidden",

        transition: "all .2s ease",

        cursor: onClick ? "pointer" : "default",

        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.background = colors.surfaceAlt;
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.background = colors.surface;
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            padding,

            borderBottom: `1px solid ${colors.border}`,

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",
          }}
        >
          <div>
            {title && (
              <div
                style={{
                  color: colors.text,

                  fontSize: 18,

                  fontWeight: 700,
                }}
              >
                {title}
              </div>
            )}

            {subtitle && (
              <div
                style={{
                  color: colors.textMuted,

                  fontSize: 13,

                  marginTop: 4,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {actions}
        </div>
      )}

      <div
        style={{
          padding,
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            padding,

            borderTop: `1px solid ${colors.border}`,

            background: colors.surfaceAlt,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
