import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function Content({
  children,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {children}
    </div>
  );
}
