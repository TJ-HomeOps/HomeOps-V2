import React from "react";
import colors from "../../theme/colors";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: SkeletonProps) {
  return (
    <>
      <style>
        {`
          @keyframes homeops-skeleton {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
        `}
      </style>

      <div
        style={{
          width,
          height,

          borderRadius: radius,

          background: `
            linear-gradient(
              90deg,
              ${colors.surface} 25%,
              ${colors.surfaceAlt} 50%,
              ${colors.surface} 75%
            )
          `,

          backgroundSize: "200px 100%",

          animation: "homeops-skeleton 1.4s infinite linear",

          ...style,
        }}
      />
    </>
  );
}
