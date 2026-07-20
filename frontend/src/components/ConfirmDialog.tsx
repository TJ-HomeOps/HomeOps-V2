interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "90%",
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: "#f8fafc",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            color: "#cbd5e1",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "#374151",
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: "#dc2626",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
