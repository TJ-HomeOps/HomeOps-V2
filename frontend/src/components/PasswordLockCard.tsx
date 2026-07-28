import { useEffect, useState } from "react";
import Alert from "./common/Alert";
import Button from "./common/Button";
import Card from "./common/Card";
import Input from "./common/Input";
import Modal from "./common/Modal";
import ConfirmDialog from "./ConfirmDialog";
import colors from "../theme/colors";

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        padding: 3,
        background: checked ? colors.primary : colors.surfaceAlt,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        justifyContent: checked ? "flex-end" : "flex-start",
        transition: "background .2s ease",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: colors.white,
          display: "block",
        }}
      />
    </button>
  );
}

export interface PasswordLockCardProps {
  title: string;
  description: string;
  disableWarning: string;
  getStatus: () => Promise<{ enabled: boolean }>;
  enable: (password: string) => Promise<unknown>;
  disable: () => Promise<unknown>;
  // Fires after enable/disable so a page-level gate (Settings' own lock)
  // can react — e.g. re-check itself if it just got turned on.
  onChange?: (enabled: boolean) => void;
}

export default function PasswordLockCard({
  title,
  description,
  disableWarning,
  getStatus,
  enable,
  disable,
  onChange,
}: PasswordLockCardProps) {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");

  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  useEffect(() => {
    getStatus()
      .then((status) => setLockEnabled(status.enabled))
      .catch(() => setError(`Unable to load ${title.toLowerCase()} status.`))
      .finally(() => setLoadingStatus(false));
  }, [getStatus, title]);

  function handleToggle() {
    setError("");

    if (lockEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setSetPasswordOpen(true);
    }
  }

  async function handleDisable() {
    try {
      await disable();
      setLockEnabled(false);
      onChange?.(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to disable ${title}.`
      );
    } finally {
      setConfirmDisableOpen(false);
    }
  }

  return (
    <>
      <Card title={title} padding={20} style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            {description}
          </div>

          <Toggle
            checked={lockEnabled}
            disabled={loadingStatus}
            onChange={handleToggle}
          />
        </div>

        {error && (
          <Alert title="Error" variant="danger" style={{ marginTop: 16 }}>
            {error}
          </Alert>
        )}
      </Card>

      <SetPasswordModal
        title={title}
        open={setPasswordOpen}
        enable={enable}
        onClose={() => setSetPasswordOpen(false)}
        onEnabled={() => {
          setLockEnabled(true);
          setSetPasswordOpen(false);
          onChange?.(true);
        }}
      />

      <ConfirmDialog
        open={confirmDisableOpen}
        title={`Turn off ${title.toLowerCase()}?`}
        message={disableWarning}
        confirmText="Turn off"
        onConfirm={handleDisable}
        onCancel={() => setConfirmDisableOpen(false)}
      />
    </>
  );
}

function SetPasswordModal({
  title,
  open,
  enable,
  onClose,
  onEnabled,
}: {
  title: string;
  open: boolean;
  enable: (password: string) => Promise<unknown>;
  onClose: () => void;
  onEnabled: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [open]);

  async function handleSubmit() {
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await enable(password);

      onEnabled();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Unable to enable ${title}.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Set a password"
      onClose={onClose}
      width={400}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={saving || !password || !confirmPassword}
            loading={saving}
          >
            Enable
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        {error && (
          <Alert variant="danger" style={{ margin: 0 }}>
            {error}
          </Alert>
        )}

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoFocus
        />

        <Input
          type="password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
      </div>
    </Modal>
  );
}
