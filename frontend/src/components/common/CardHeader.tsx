import React from "react";

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

export default function CardHeader({
  title,
  subtitle,
  right,
}: CardHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: "#fff",
            fontSize: 22,
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <div
            style={{
              color: "#94a3b8",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {right}
    </div>
  );
}
