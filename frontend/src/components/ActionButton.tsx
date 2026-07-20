import React from "react";

interface ActionButtonProps {
  label: string;
  icon?: string;
  color?: "green" | "blue" | "red" | "gray";
  onClick: () => void;
  disabled?: boolean;
}

export default function ActionButton({
  label,
  icon,
  color = "blue",
  onClick,
  disabled = false,
}: ActionButtonProps) {
  const colors = {
    green: {
      background: "#15803d",
      hover: "#166534",
    },
    blue: {
      background: "#2563eb",
      hover: "#1d4ed8",
    },
    red: {
      background: "#dc2626",
      hover: "#b91c1c",
    },
    gray: {
      background: "#374151",
      hover: "#4b5563",
    },
  };

  const selected = colors[color];

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = selected.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = selected.background;
      }}
      style={{
        background: selected.background,
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        marginRight: 8,
        fontWeight: 600,
        transition: "0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && `${icon} `}
      {label}
    </button>
  );
}
