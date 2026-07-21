import React from "react";

interface CardFooterProps {
  children: React.ReactNode;
}

export default function CardFooter({
  children,
}: CardFooterProps) {
  return (
    <div
      style={{
        marginTop: 22,
        paddingTop: 18,
        borderTop: "1px solid #27364b",
      }}
    >
      {children}
    </div>
  );
}
