import dotenv from "dotenv";
import { readFile, writeFile, utimes } from "node:fs/promises";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env");
// Touching the entry point's mtime makes `tsx watch` restart the process,
// which re-runs every `dotenv.config()` call at import time — the same
// restart mechanism already firing on every source edit this session.
const entryPointPath = join(process.cwd(), "src", "server.ts");

export interface IntegrationField {
  name: string;
  envVar: string;
  label: string;
  secret: boolean;
  required?: boolean;
}

export interface IntegrationDef {
  key: string;
  label: string;
  description: string;
  fields: IntegrationField[];
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "portainer",
    label: "Portainer",
    description: "Container list, start/stop/restart, and logs.",
    fields: [
      { name: "url", envVar: "PORTAINER_URL", label: "URL", secret: false, required: true },
      { name: "token", envVar: "PORTAINER_TOKEN", label: "API Token", secret: true, required: true },
    ],
  },
  {
    key: "proxmoxPrimary",
    label: "Proxmox (primary cluster)",
    description: "Node/VM/LXC data and power actions.",
    fields: [
      { name: "url", envVar: "PROXMOX_URL", label: "URL", secret: false, required: true },
      { name: "tokenId", envVar: "PROXMOX_TOKEN_ID", label: "Token ID", secret: false, required: true },
      { name: "tokenSecret", envVar: "PROXMOX_TOKEN_SECRET", label: "Token Secret", secret: true, required: true },
      { name: "name", envVar: "PROXMOX_NAME", label: "Display name", secret: false },
    ],
  },
  {
    key: "wud",
    label: "What's Up Docker",
    description: "Feeds the Watchtower page's update status.",
    fields: [
      { name: "url", envVar: "WUD_URL", label: "URL", secret: false, required: true },
    ],
  },
  {
    key: "camera",
    label: "Security Camera",
    description:
      "Should point at go2rtc's credential-free relay, not the camera directly.",
    fields: [
      { name: "rtspUrl", envVar: "TAPO_C100_RTSP_URL", label: "RTSP URL", secret: true, required: true },
      { name: "ffmpegPath", envVar: "FFMPEG_PATH", label: "ffmpeg path (optional)", secret: false },
    ],
  },
];

async function readEnvFile(): Promise<{ raw: string; parsed: Record<string, string> }> {
  let raw = "";

  try {
    raw = await readFile(envPath, "utf8");
  } catch {
    raw = "";
  }

  return { raw, parsed: dotenv.parse(raw) };
}

// Replaces `KEY=value` in place if present (preserving every other line and
// ordering); appends a new `KEY=value` line otherwise.
function upsertEnvLines(raw: string, updates: Record<string, string>): string {
  const lines = raw.split("\n");
  const remaining = new Map(Object.entries(updates));

  const next = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);

    if (!match) return line;

    const key = match[1];

    if (!key) return line;

    if (remaining.has(key)) {
      const value = remaining.get(key)!;
      remaining.delete(key);
      return `${key}=${value}`;
    }

    return line;
  });

  for (const [key, value] of remaining) {
    next.push(`${key}=${value}`);
  }

  return next.join("\n");
}

async function triggerRestart(): Promise<void> {
  const now = new Date();
  await utimes(entryPointPath, now, now);
}

export async function getIntegrations() {
  const { parsed } = await readEnvFile();

  return INTEGRATIONS.map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    fields: def.fields.map((field) => ({
      name: field.name,
      label: field.label,
      secret: field.secret,
      required: !!field.required,
      value: field.secret ? undefined : parsed[field.envVar] ?? "",
      set: !!parsed[field.envVar],
    })),
  }));
}

export async function updateIntegration(
  key: string,
  values: Record<string, string>
): Promise<void> {
  const def = INTEGRATIONS.find((d) => d.key === key);

  if (!def) {
    throw new Error(`Unknown integration "${key}".`);
  }

  const { raw } = await readEnvFile();
  const updates: Record<string, string> = {};

  for (const field of def.fields) {
    const incoming = values[field.name];

    // Blank secret = "leave unchanged"; blank non-secret is a deliberate
    // clear (e.g. removing the optional PROXMOX_NAME override).
    if (field.secret && (incoming === undefined || incoming === "")) {
      continue;
    }

    if (incoming === undefined) continue;

    updates[field.envVar] = incoming;
  }

  await writeFile(envPath, upsertEnvLines(raw, updates));
  await triggerRestart();
}

export interface ProxmoxClusterEntry {
  name: string;
  url: string;
  tokenId: string;
  tokenSecret: string;
}

export async function getProxmoxClusters(): Promise<
  Array<{ name: string; url: string; tokenId: string; tokenSecretSet: boolean }>
> {
  const { parsed } = await readEnvFile();
  const raw = parsed.PROXMOX_CLUSTERS?.trim();

  if (!raw) return [];

  try {
    const list = JSON.parse(raw) as ProxmoxClusterEntry[];

    return list.map((c) => ({
      name: c.name,
      url: c.url,
      tokenId: c.tokenId,
      tokenSecretSet: !!c.tokenSecret,
    }));
  } catch {
    return [];
  }
}

// Full list is replaced wholesale (it's one JSON env var). A blank
// tokenSecret on an entry keeps that entry's previous secret, matched by
// array index — the frontend always submits the full list in order.
export async function setProxmoxClusters(
  entries: ProxmoxClusterEntry[]
): Promise<void> {
  const { raw, parsed } = await readEnvFile();
  const existingRaw = parsed.PROXMOX_CLUSTERS?.trim();
  let existing: ProxmoxClusterEntry[] = [];

  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw) as ProxmoxClusterEntry[];
    } catch {
      existing = [];
    }
  }

  const merged = entries.map((entry, index) => ({
    ...entry,
    tokenSecret: entry.tokenSecret || existing[index]?.tokenSecret || "",
  }));

  await writeFile(
    envPath,
    upsertEnvLines(raw, {
      PROXMOX_CLUSTERS: JSON.stringify(merged),
    })
  );
  await triggerRestart();
}
