import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  computeSessionToken,
  hashPassword,
  tokensMatch,
  verifyPassword,
} from "./authCrypto";

// A second, independent lock scoped to the Settings page — separate from
// the app-wide lock in services/auth.ts, since Settings now holds real API
// credentials and the two should be able to differ (or be toggled
// independently) from who can just open the app.
export const SETTINGS_SESSION_COOKIE_NAME = "homeops_settings_session";

export interface SettingsAuthSettings {
  serverSecret: string;
  passwordHash: string | null;
  lockEnabled: boolean;
}

const dataDirectory = join(process.cwd(), "data");
const storePath = join(dataDirectory, "settingsAuth.json");

let settings: SettingsAuthSettings | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function persist(): void {
  writeQueue = writeQueue
    .then(async () => {
      await mkdir(dataDirectory, { recursive: true });
      await writeFile(storePath, JSON.stringify(settings));
    })
    .catch((error: unknown) => {
      console.error("Unable to persist settings auth settings", error);
    });
}

export async function getSettings(): Promise<SettingsAuthSettings> {
  if (settings) {
    return settings;
  }

  try {
    const raw = await readFile(storePath, "utf8");
    settings = JSON.parse(raw) as SettingsAuthSettings;
  } catch {
    settings = {
      serverSecret: randomBytes(32).toString("hex"),
      passwordHash: null,
      lockEnabled: false,
    };
    persist();
  }

  return settings;
}

export async function getStatus(): Promise<{ enabled: boolean }> {
  const current = await getSettings();

  return { enabled: current.lockEnabled };
}

export async function isSessionValid(
  token: string | undefined
): Promise<boolean> {
  const current = await getSettings();

  if (!current.lockEnabled) {
    return true;
  }

  if (!token || !current.passwordHash) {
    return false;
  }

  const expected = computeSessionToken(
    current.serverSecret,
    current.passwordHash
  );

  return tokensMatch(token, expected);
}

export async function login(password: string): Promise<string> {
  const current = await getSettings();

  if (!current.lockEnabled || !current.passwordHash) {
    throw new Error("Settings lock is not enabled.");
  }

  const valid = await verifyPassword(password, current.passwordHash);

  if (!valid) {
    throw new Error("Incorrect password.");
  }

  return computeSessionToken(current.serverSecret, current.passwordHash);
}

export async function enable(password: string): Promise<string> {
  const current = await getSettings();
  const passwordHash = await hashPassword(password);

  current.lockEnabled = true;
  current.passwordHash = passwordHash;
  persist();

  return computeSessionToken(current.serverSecret, passwordHash);
}

export async function disable(): Promise<void> {
  const current = await getSettings();

  current.lockEnabled = false;
  current.passwordHash = null;
  persist();
}
