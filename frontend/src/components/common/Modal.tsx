import React, { useEffect } from "react";
import colors from "../../theme/colors";

export interface ModalProps {
  open: boolean;

  title?: string;

  children: React.ReactNode;

  onClose: () => void;

  width?: number | string;

  closeOnBackdrop?: boolean;

  closeOnEscape?: boolean;

  footer?: React.ReactNode;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  width = 600,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape) return;

    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={() => {
        if (closeOnBackdrop) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,

        background: "rgba(0,0,0,.55)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 9999,

        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,

          maxWidth: "100%",

          background: colors.surface,

          border: `1px solid ${colors.border}`,

          borderRadius: 14,

          overflow: "hidden",

          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        {title && (
          <div
            style={{
              padding: "18px 24px",

              borderBottom: `1px solid ${colors.border}`,

              color: colors.text,

              fontWeight: 700,

              fontSize: 18,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            padding: 24,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: "18px 24px",

              borderTop: `1px solid ${colors.border}`,

              display: "flex",

              justifyContent: "flex-end",

              gap: 12,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
