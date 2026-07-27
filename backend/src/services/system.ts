import os from "os";
import fs from "fs";

export interface SystemStats {
  hostname: string;
  uptime: number;
  cpu: {
    cores: number;
    load: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
}

export function getSystemStats(): SystemStats {
  const cpus = os.cpus();
  const cpuLoad = os.loadavg()[0] ?? 0;

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const stat = fs.statfsSync("/");

  const totalDisk = stat.blocks * stat.bsize;
  const freeDisk = stat.bfree * stat.bsize;
  const usedDisk = totalDisk - freeDisk;

  return {
    hostname: os.hostname(),
    uptime: os.uptime(),
    cpu: {
      cores: cpus.length,
      load: Number(cpuLoad.toFixed(2)),
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percent: Number(((usedMemory / totalMemory) * 100).toFixed(1)),
    },
    disk: {
      total: totalDisk,
      used: usedDisk,
      free: freeDisk,
      percent: Number(((usedDisk / totalDisk) * 100).toFixed(1)),
    },
  };
}
