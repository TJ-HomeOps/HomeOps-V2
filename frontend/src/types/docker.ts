export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface DockerInfo {
  serverVersion: string;
  operatingSystem: string;
  containers: number;
  running: number;
  stopped: number;
  paused: number;
  images: number;
  cpu: number;
  memory: number;
}
