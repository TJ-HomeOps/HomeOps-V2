export interface ContainerUpdate {
  id: string;
  name: string;
  image: string;
  registry: string;
  currentVersion: string;
  updateAvailable: boolean;
  newVersion: string | null;
  semverDiff: "major" | "minor" | "patch" | null;
  watcher: string;
  composeProject: string | null;
  composeWorkingDir: string | null;
}

export interface UpdatesResponse {
  containers: ContainerUpdate[];
  updateCount: number;
  watchedCount: number;
}
