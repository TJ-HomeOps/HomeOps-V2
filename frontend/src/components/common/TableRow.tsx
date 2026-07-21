import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function TableRow({ children }: Props) {
  return (
    <tr
      style={{
        borderBottom: "1px solid #27364b",
      }}
    >
      {children}
    </tr>
  );
}
