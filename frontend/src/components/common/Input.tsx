import React from "react";
import colors from "../../theme/colors";

export interface InputProps {
  label?: string;
  placeholder?: string;

  value?: string;
  defaultValue?: string;

  onChange?: (value: string) => void;

  type?: React.HTMLInputTypeAttribute;

  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;

  error?: string;
  helperText?: string;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  fullWidth?: boolean;

  className?: string;

  style?: React.CSSProperties;
}

export default function Input({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,

  type = "text",

  disabled = false,
  required = false,
  readOnly = false,

  error,
  helperText,

  leftIcon,
  rightIcon,

  fullWidth = true,

  className,
  style,
}: InputProps) {
  return (
    <div
      style={{
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 8,
            color: colors.text,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {label}

          {required && (
            <span
              style={{
                color: colors.danger,
                marginLeft: 4,
              }}
            >
              *
            </span>
          )}
        </label>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",

          background: colors.surface,

          border: `1px solid ${
            error ? colors.danger : colors.border
          }`,

          borderRadius: 10,

          padding: "0 12px",

          transition: "all .2s ease",
        }}
      >
        {leftIcon && (
          <div
            style={{
              marginRight: 10,
              display: "flex",
              color: colors.textSecondary,
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          className={className}
          type={type}
          value={value}
          defaultValue={defaultValue}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            flex: 1,

            background: "transparent",

            border: "none",

            outline: "none",

            color: colors.text,

            fontSize: 14,

            padding: "12px 0",

            ...style,
          }}
        />

        {rightIcon && (
          <div
            style={{
              marginLeft: 10,
              display: "flex",
              color: colors.textSecondary,
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <div
          style={{
            marginTop: 6,
            color: colors.danger,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      ) : helperText ? (
        <div
          style={{
            marginTop: 6,
            color: colors.textMuted,
            fontSize: 12,
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
