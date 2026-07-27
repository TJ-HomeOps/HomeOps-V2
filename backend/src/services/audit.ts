import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { broadcast } from "./broadcast";

export type AuditResult = "success" | "failure";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  result: AuditResult;
  detail?: string;
}

export interface RecordAuditEntryInput {
  action: string;
  target: string;
  result: AuditResult;
  detail?: string;
}

const dataDirectory = join(process.cwd(), "data");
const storePath = join(dataDirectory, "audit.json");

// This is an action trail, not a notification feed, so it keeps more
// history than notifications.ts before old entries age out.
const maxStoredEntries = 1000;

let entries: AuditEntry[] = [];
let loaded = false;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<void> {
  if (loaded) {
    return;
  }

  loaded = true;

  try {
    const raw = await readFile(storePath, "utf8");
    entries = JSON.parse(raw) as AuditEntry[];
  } catch {
    entries = [];
  }
}

function persist(): void {
  writeQueue = writeQueue
    .then(async () => {
      await mkdir(dataDirectory, { recursive: true });
      await writeFile(storePath, JSON.stringify(entries));
    })
    .catch((error: unknown) => {
      console.error("Unable to persist audit log", error);
    });
}

export async function recordAuditEntry(
  input: RecordAuditEntryInput
): Promise<AuditEntry> {
  await load();

  const entry: AuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...input,
  };

  entries = [entry, ...entries].slice(0, maxStoredEntries);
  persist();
  broadcast({ type: "audit.created", data: entry });

  return entry;
}

export async function listAuditEntries(): Promise<AuditEntry[]> {
  await load();

  return entries;
}

// Portainer/Proxmox errors surface as a string, an { message } object, or
// some other JSON shape depending on which layer raised them — this picks a
// readable string out of whichever one shows up instead of dumping raw JSON
// into the audit trail.
export function describeErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof (detail as { message: unknown }).message === "string"
  ) {
    return (detail as { message: string }).message;
  }

  return JSON.stringify(detail);
}
