export interface CPUInfo {
  cores: number;
  load: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface SystemInfo {
  hostname: string;
  uptime: number;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
}
