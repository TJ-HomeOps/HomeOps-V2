import { useEffect, useState } from "react";
import { disableLock, enableLock, getAuthStatus } from "../api/auth";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
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

export default function Settings() {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");

  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  useEffect(() => {
    getAuthStatus()
      .then((status) => setLockEnabled(status.enabled))
      .catch(() => setError("Unable to load password protection status."))
      .finally(() => setLoadingStatus(false));
  }, []);

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
      await disableLock();
      setLockEnabled(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to disable password protection."
      );
    } finally {
      setConfirmDisableOpen(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Access preferences for this app"
      />

      {error && (
        <Alert title="Error" variant="danger" style={{ marginBottom: 20 }}>
          {error}
        </Alert>
      )}

      <Card title="Password Protection" padding={20}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            When enabled, a password is required to open this app. There is
            no separate username — everyone uses the same password.
          </div>

          <Toggle
            checked={lockEnabled}
            disabled={loadingStatus}
            onChange={handleToggle}
          />
        </div>
      </Card>

      <SetPasswordModal
        open={setPasswordOpen}
        onClose={() => setSetPasswordOpen(false)}
        onEnabled={() => {
          setLockEnabled(true);
          setSetPasswordOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmDisableOpen}
        title="Turn off password protection?"
        message="Anyone with the link will be able to open this app without a password."
        confirmText="Turn off"
        onConfirm={handleDisable}
        onCancel={() => setConfirmDisableOpen(false)}
      />
    </>
  );
}

function SetPasswordModal({
  open,
  onClose,
  onEnabled,
}: {
  open: boolean;
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

      await enableLock(password);

      onEnabled();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to enable password protection."
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
