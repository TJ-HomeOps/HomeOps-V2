import React from "react";

interface CardSectionProps {
  children: React.ReactNode;
}

export default function CardSection({
  children,
}: CardSectionProps) {
  return (
    <div
      style={{
        marginTop: 18,
      }}
    >
      {children}
    </div>
  );
}
