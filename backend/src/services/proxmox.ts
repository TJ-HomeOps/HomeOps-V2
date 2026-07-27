import axios, { type AxiosInstance } from "axios";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

export interface ProxmoxCluster {
  id: string;
  name: string;
  client: AxiosInstance;
}

interface ExtraClusterConfig {
  name: string;
  url: string;
  tokenId: string;
  tokenSecret: string;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "cluster";
}

function buildClient(
  url: string,
  tokenId: string,
  tokenSecret: string
): AxiosInstance {
  return axios.create({
    baseURL: `${url}/api2/json`,

    headers: {
      Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}`,
      "Content-Type": "application/json",
    },

    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),

    timeout: 10000,
  });
}

// Additional clusters beyond the primary one (below) are configured as a
// JSON array in a single env var rather than PROXMOX_URL_2/_3/... — that
// scales to any number of clusters without inventing a new pair of variable
// names for each one.
function loadExtraClusters(): ExtraClusterConfig[] {
  const raw = process.env.PROXMOX_CLUSTERS?.trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      throw new Error("PROXMOX_CLUSTERS must be a JSON array");
    }

    return parsed as ExtraClusterConfig[];
  } catch (error) {
    console.error(
      "Unable to parse PROXMOX_CLUSTERS, ignoring extra clusters",
      error
    );

    return [];
  }
}

const clusters: ProxmoxCluster[] = [];

const primaryUrl = process.env.PROXMOX_URL;
const primaryTokenId = process.env.PROXMOX_TOKEN_ID;
const primaryTokenSecret = process.env.PROXMOX_TOKEN_SECRET;

if (primaryUrl && primaryTokenId && primaryTokenSecret) {
  const name = process.env.PROXMOX_NAME?.trim() || "Primary";

  clusters.push({
    id: slugify(name),
    name,
    client: buildClient(primaryUrl, primaryTokenId, primaryTokenSecret),
  });
} else {
  console.error(
    "PROXMOX_URL/PROXMOX_TOKEN_ID/PROXMOX_TOKEN_SECRET are not fully set — the primary Proxmox cluster will not be available."
  );
}

for (const extra of loadExtraClusters()) {
  if (!extra.name || !extra.url || !extra.tokenId || !extra.tokenSecret) {
    console.error(
      "Skipping an entry in PROXMOX_CLUSTERS: each entry needs name, url, tokenId, and tokenSecret."
    );
    continue;
  }

  const id = slugify(extra.name);

  if (clusters.some((cluster) => cluster.id === id)) {
    console.error(
      `Skipping duplicate Proxmox cluster id "${id}" (from name "${extra.name}") — cluster names must be unique.`
    );
    continue;
  }

  clusters.push({
    id,
    name: extra.name,
    client: buildClient(extra.url, extra.tokenId, extra.tokenSecret),
  });
}

export function getProxmoxClusters(): ProxmoxCluster[] {
  return clusters;
}

export function getProxmoxCluster(id: string): ProxmoxCluster | undefined {
  return clusters.find((cluster) => cluster.id === id);
}
