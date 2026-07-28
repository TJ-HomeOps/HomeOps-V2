import type { FastifyInstance } from "fastify";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { wud } from "../services/wud";
import { describeErrorDetail, recordAuditEntry } from "../services/audit";

const execFileAsync = promisify(execFile);

// Services pinned to an explicit version tag (anything not `:latest`) don't
// pick up a new version from `docker compose pull` — that just re-pulls the
// same tag. The compose file's `image:` line has to be bumped to the new tag
// first. Matches the literal "repo:oldTag" string from `docker inspect` so
// only the exact pinned image is touched, not anything else in the file.
async function bumpPinnedTag(
  containerId: string,
  workingDir: string,
  newTag: string
): Promise<string | null> {
  const { stdout } = await execFileAsync("docker", [
    "inspect",
    containerId,
    "--format",
    "{{.Config.Image}}",
  ]);
  const currentImageRef = stdout.trim();
  const [repo, currentTag] = currentImageRef.split(/:(?!.*\/)/);

  if (!currentTag || currentTag === "latest" || currentTag === newTag) {
    return null;
  }

  const composeFilePath = join(workingDir, "docker-compose.yml");
  const content = await readFile(composeFilePath, "utf8");
  const newImageRef = `${repo}:${newTag}`;

  if (!content.includes(currentImageRef)) {
    return null;
  }

  await writeFile(
    composeFilePath,
    content.split(currentImageRef).join(newImageRef)
  );

  return `${currentImageRef} -> ${newImageRef}`;
}

interface MappedContainer {
  id: string;
  name: string;
  image: string;
  registry: string;
  currentVersion: string;
  updateAvailable: boolean;
  newVersion: string | null;
  semverDiff: string | null;
  watcher: string;
  composeProject: string | null;
  composeWorkingDir: string | null;
}

function mapContainer(c: any): MappedContainer {
  return {
    id: c.id,
    name: c.name,
    image: c.image?.name ?? "",
    registry: c.image?.registry?.name ?? "",
    currentVersion: c.image?.tag?.value ?? "",
    updateAvailable: !!c.updateAvailable,
    newVersion: c.result?.tag ?? null,
    semverDiff: c.updateKind?.semverDiff ?? null,
    watcher: c.watcher,
    composeProject: c.labels?.["com.docker.compose.project"] ?? null,
    composeWorkingDir:
      c.labels?.["com.docker.compose.project.working_dir"] ?? null,
  };
}

export default async function updateRoutes(app: FastifyInstance) {
  app.get("/api/updates", async (_, reply) => {
    try {
      const { data } = await wud.get("/api/containers");
      const containers: MappedContainer[] = data.map(mapContainer);

      return {
        containers,
        updateCount: containers.filter((c) => c.updateAvailable).length,
        watchedCount: containers.length,
      };
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      reply.code(500).send(err.response?.data || err.message);
    }
  });

  // Applies an update by running `docker compose pull && up -d` in the
  // container's compose project directory — this updates every service in
  // that project together (e.g. authentik-server + authentik-worker), which
  // is correct since sibling services in a project must stay version-locked.
  // Watchtower stays monitor-only globally; this is the deliberate manual
  // trigger for a single project.
  app.post("/api/updates/:id/apply", async (request: any, reply) => {
    const { id } = request.params;

    try {
      const { data } = await wud.get("/api/containers");
      const containers: MappedContainer[] = data.map(mapContainer);
      const container = containers.find((c) => c.id === id);

      if (!container) {
        reply.code(404).send({ message: "Container not found." });
        return;
      }

      if (!container.composeWorkingDir) {
        reply.code(400).send({
          message:
            "This container has no docker-compose project directory label — can't apply an update automatically.",
        });
        return;
      }

      const projectContainers = containers.filter(
        (c) => c.composeProject === container.composeProject
      );
      const affected = projectContainers.map((c) => c.name);

      const rewrites: string[] = [];

      for (const c of projectContainers) {
        if (!c.newVersion) continue;

        const rewrite = await bumpPinnedTag(
          c.id,
          container.composeWorkingDir,
          c.newVersion
        );

        if (rewrite) rewrites.push(`${c.name}: ${rewrite}`);
      }

      const options = {
        cwd: container.composeWorkingDir,
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      };

      const pull = await execFileAsync(
        "docker",
        ["compose", "pull"],
        options
      );
      const up = await execFileAsync(
        "docker",
        ["compose", "up", "-d"],
        options
      );

      await recordAuditEntry({
        action: "container.update",
        target: container.composeProject ?? container.name,
        result: "success",
        detail:
          rewrites.length > 0
            ? `Bumped pinned tags: ${rewrites.join("; ")}`
            : `Updated project services: ${affected.join(", ")}`,
      });

      return {
        success: true,
        affected,
        rewrites,
        output: `${pull.stdout}${pull.stderr}\n${up.stdout}${up.stderr}`,
      };
    } catch (err: any) {
      const detail = describeErrorDetail(
        err.stderr || err.message || err
      );

      await recordAuditEntry({
        action: "container.update",
        target: id,
        result: "failure",
        detail,
      });

      console.error(detail);
      reply.code(500).send({ message: detail });
    }
  });
}
