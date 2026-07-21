import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function TableHead({ children }: Props) {
  return (
    <thead
      style={{
        background: "#1f2d40",
      }}
    >
      {children}
    </thead>
  );
}
