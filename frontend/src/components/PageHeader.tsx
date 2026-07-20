import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        flexWrap: "wrap",
        gap: 20,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: "#f8fafc",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              marginTop: 8,
              color: "#94a3b8",
              fontSize: 15,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
