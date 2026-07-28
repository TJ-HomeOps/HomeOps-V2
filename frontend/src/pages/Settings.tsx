import { useEffect, useState } from "react";
import {
  disableLock,
  enableLock,
  getAuthStatus,
} from "../api/auth";
import {
  disableSettingsLock,
  enableSettingsLock,
  getSettingsAuthSession,
  getSettingsAuthStatus,
  settingsLogin,
} from "../api/settingsAuth";
import {
  getIntegrations,
  updateIntegration,
  updateProxmoxClusters,
} from "../api/integrations";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Spinner from "../components/common/Spinner";
import PasswordLockCard from "../components/PasswordLockCard";
import IntegrationCard from "../components/IntegrationCard";
import ProxmoxClustersCard from "../components/ProxmoxClustersCard";
import LockPrompt from "../components/LockPrompt";
import type { IntegrationsResponse } from "../types/integrations";

type GateState = "checking" | "unlocked" | "needsPassword" | "error";

export default function Settings() {
  const [gateState, setGateState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { enabled } = await getSettingsAuthStatus();

        if (cancelled) return;

        if (!enabled) {
          setGateState("unlocked");
          return;
        }

        try {
          await getSettingsAuthSession();

          if (!cancelled) setGateState("unlocked");
        } catch {
          if (!cancelled) setGateState("needsPassword");
        }
      } catch {
        if (!cancelled) setGateState("error");
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (gateState === "checking") {
    return (
      <div className="page">
        <PageHeader title="Settings" />
        <Spinner label="Checking access" />
      </div>
    );
  }

  if (gateState === "error") {
    return (
      <div className="page">
        <PageHeader title="Settings" />
        <Alert title="Unable to reach the server" variant="danger">
          Check your connection and reload the page.
        </Alert>
      </div>
    );
  }

  if (gateState === "needsPassword") {
    return (
      <div className="page">
        <PageHeader title="Settings" />
        <LockPrompt
          fullScreen={false}
          subtitle="This page is password protected."
          onLogin={settingsLogin}
          onSuccess={() => setGateState("unlocked")}
        />
      </div>
    );
  }

  return <SettingsContent />;
}

function SettingsContent() {
  const [integrationsData, setIntegrationsData] =
    useState<IntegrationsResponse | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [integrationsError, setIntegrationsError] = useState(false);

  useEffect(() => {
    getIntegrations()
      .then(setIntegrationsData)
      .catch(() => setIntegrationsError(true))
      .finally(() => setLoadingIntegrations(false));
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Settings"
        subtitle="Access preferences and connected app credentials"
      />

      <PasswordLockCard
        title="App Password"
        description="When enabled, a password is required to open this app. There is no separate username — everyone uses the same password."
        disableWarning="Anyone with the link will be able to open this app without a password."
        getStatus={getAuthStatus}
        enable={enableLock}
        disable={disableLock}
      />

      <PasswordLockCard
        title="Settings Page Lock"
        description="An extra password just for this page, on top of the app password above — useful since it holds real API credentials."
        disableWarning="Anyone already logged into the app will be able to open Settings without a second password."
        getStatus={getSettingsAuthStatus}
        enable={enableSettingsLock}
        disable={disableSettingsLock}
      />

      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          margin: "32px 0 16px",
        }}
      >
        Connected Apps
      </h2>

      {loadingIntegrations ? (
        <Spinner label="Loading integrations" />
      ) : integrationsError || !integrationsData ? (
        <Alert title="Unable to load integrations" variant="danger">
          Check your connection and reload the page.
        </Alert>
      ) : (
        <>
          {integrationsData.integrations.map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              onSave={updateIntegration}
            />
          ))}

          <ProxmoxClustersCard
            clusters={integrationsData.proxmoxClusters}
            onSave={updateProxmoxClusters}
          />
        </>
      )}
    </div>
  );
}
