import React from "react";

interface Props {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  header?: boolean;
}

export default function TableCell({
  children,
  align = "left",
  header = false,
}: Props) {
  const Tag = header ? "th" : "td";

  return (
    <Tag
      style={{
        padding: "14px 18px",
        textAlign: align,
        color: "#fff",
        fontWeight: header ? 600 : 400,
        fontSize: 14,
      }}
    >
      {children}
    </Tag>
  );
}
