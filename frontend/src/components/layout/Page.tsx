import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function Page({
  children,
}: Props) {
  return (
    <div
      style={{
        maxWidth: 1700,
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}
