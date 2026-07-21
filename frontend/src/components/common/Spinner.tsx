import React from "react";
import colors from "../../theme/colors";

export interface SpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
  label?: string;
  fullScreen?: boolean;
}

export default function Spinner({
  size = 36,
  color = colors.primary,
  thickness = 3,
  label,
  fullScreen = false,
}: SpinnerProps) {
  const spinner = (
    <>
      <style>
        {`
          @keyframes homeops-spinner {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: size,
            height: size,

            border: `${thickness}px solid rgba(255,255,255,.15)`,

            borderTop: `${thickness}px solid ${color}`,

            borderRadius: "50%",

            animation: "homeops-spinner .8s linear infinite",
          }}
        />

        {label && (
          <span
            style={{
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </>
  );

  if (!fullScreen) return spinner;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,

        background: "rgba(15,23,42,.85)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        zIndex: 99999,
      }}
    >
      {spinner}
    </div>
  );
}
