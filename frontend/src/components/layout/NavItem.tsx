import React from "react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export default function NavItem({
  to,
  icon,
  label,
}: Props) {
  const location = useLocation();

  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        color: active ? "#fff" : "#94a3b8",
        background: active ? "#2563eb" : "transparent",
        textDecoration: "none",
        borderRadius: 10,
        transition: ".2s",
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
