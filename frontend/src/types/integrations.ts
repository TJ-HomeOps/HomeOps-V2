export interface IntegrationField {
  name: string;
  label: string;
  secret: boolean;
  required: boolean;
  value?: string;
  set: boolean;
}

export interface Integration {
  key: string;
  label: string;
  description: string;
  fields: IntegrationField[];
}

export interface ProxmoxClusterEntry {
  name: string;
  url: string;
  tokenId: string;
  tokenSecretSet: boolean;
}

// Shape used when saving — tokenSecret blank means "keep the existing one"
// for that array position, matched server-side by index.
export interface ProxmoxClusterInput {
  name: string;
  url: string;
  tokenId: string;
  tokenSecret: string;
}

export interface IntegrationsResponse {
  integrations: Integration[];
  proxmoxClusters: ProxmoxClusterEntry[];
}
