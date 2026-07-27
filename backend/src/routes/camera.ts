import { spawn } from "node:child_process";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { recordNotification } from "../services/notifications";

const cameraName = "Tapo C100";
const hlsDirectory = join(process.cwd(), "data", "camera-hls");
const playlistName = "tapo-c100.m3u8";
const playlistPath = join(hlsDirectory, playlistName);
const segmentPattern = /^segment-\d+\.ts$/;

type RelayState = "not-configured" | "ready" | "starting";

let relayProcess: ReturnType<typeof spawn> | null = null;
let relayStartup: Promise<boolean> | null = null;

// Set right before the onClose hook kills the relay, so that expected exit
// doesn't get reported as an unexpected stop.
let shuttingDown = false;

function getCameraStreamUrl(): string | undefined {
  const streamUrl = process.env.TAPO_C100_RTSP_URL?.trim();

  return streamUrl || undefined;
}

function isRelayRunning(): boolean {
  return (
    relayProcess !== null &&
    relayProcess.exitCode === null &&
    relayProcess.signalCode === null
  );
}

// A previous relay leaves behind its playlist and segments, and a clean
// FFmpeg exit marks that playlist with EXT-X-ENDLIST. Serving it would hand
// the player a finished recording instead of the live stream, so every relay
// starts from an empty directory.
async function resetHlsDirectory(): Promise<void> {
  await rm(hlsDirectory, { recursive: true, force: true });
  await mkdir(hlsDirectory, { recursive: true });
}

async function spawnRelay(
  app: FastifyInstance,
  streamUrl: string
): Promise<boolean> {
  await resetHlsDirectory();

  const ffmpegPath = process.env.FFMPEG_PATH?.trim() || "ffmpeg";

  const child = spawn(
    ffmpegPath,
    [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-rtsp_transport",
      "tcp",
      "-i",
      streamUrl,
      "-an",
      "-c:v",
      "copy",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "5",
      // Each relay writes into a freshly emptied directory, so there is no
      // list to append to; only expired segments need cleaning up.
      "-hls_flags",
      "delete_segments",
      "-hls_segment_filename",
      join(hlsDirectory, "segment-%03d.ts"),
      "-hls_base_url",
      "hls/",
      playlistPath,
    ],
    {
      stdio: ["ignore", "ignore", "pipe"],
    }
  );

  relayProcess = child;

  // FFmpeg blocks once the stderr pipe buffer fills, so its output has to be
  // drained even though we only forward it to the log.
  child.stderr?.on("data", (chunk: Buffer) => {
    app.log.warn(
      { output: chunk.toString().trim() },
      "Tapo camera relay output"
    );
  });

  child.once("error", (error) => {
    app.log.error({ err: error }, "Unable to start the Tapo camera relay");

    if (relayProcess === child) {
      relayProcess = null;
    }

    void recordNotification({
      source: "camera",
      severity: "critical",
      title: "Camera relay failed to start",
      message: error.message,
    });
  });

  child.once("exit", (code) => {
    app.log.warn({ code }, "Tapo camera relay stopped");

    if (relayProcess === child) {
      relayProcess = null;
    }

    if (!shuttingDown) {
      void recordNotification({
        source: "camera",
        severity: "warning",
        title: "Camera relay stopped",
        message: `The camera relay exited unexpectedly (code ${code ?? "unknown"}).`,
      });
    }
  });

  const ready = await waitForPlaylist();

  void recordNotification(
    ready
      ? {
          source: "camera",
          severity: "info",
          title: "Camera relay started",
          message: "The Tapo C100 live camera relay is streaming.",
        }
      : {
          source: "camera",
          severity: "critical",
          title: "Camera relay did not start",
          message: "The camera relay did not produce a stream in time.",
        }
  );

  return ready;
}

async function ensureRelay(app: FastifyInstance): Promise<RelayState> {
  const streamUrl = getCameraStreamUrl();

  if (!streamUrl) {
    return "not-configured";
  }

  if (isRelayRunning()) {
    return "ready";
  }

  // Concurrent viewers must share one startup, otherwise a second request
  // would wipe the directory while the first relay is writing into it.
  relayStartup ??= spawnRelay(app, streamUrl).finally(() => {
    relayStartup = null;
  });

  return (await relayStartup) ? "ready" : "starting";
}

async function waitForPlaylist(): Promise<boolean> {
  // A cold start has to dial go2rtc, which in turn dials the camera, and that
  // measured at roughly five seconds. Allow well past that so a slow handshake
  // reports as a stream rather than a failure.
  const attempts = 80;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const playlist = await stat(playlistPath);

      if (playlist.size > 0) {
        return true;
      }
    } catch {
      // FFmpeg has not produced the first HLS playlist yet.
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  return false;
}

export default async function cameraRoutes(app: FastifyInstance) {
  app.addHook("onClose", async () => {
    shuttingDown = true;
    relayProcess?.kill("SIGTERM");
  });

  app.get("/api/cameras/tapo-c100", async () => {
    const configured = Boolean(getCameraStreamUrl());

    return {
      name: cameraName,
      configured,
      streamPath: configured
        ? "/api/cameras/tapo-c100/stream.m3u8"
        : null,
    };
  });

  app.get("/api/cameras/tapo-c100/stream.m3u8", async (_request, reply) => {
    const state = await ensureRelay(app);

    if (state === "not-configured") {
      return reply.code(503).send({
        message: "The Tapo C100 stream has not been configured.",
      });
    }

    if (state === "starting") {
      return reply.code(503).send({
        message: "The camera stream is still starting. Please try again.",
      });
    }

    const playlist = await readFile(playlistPath, "utf8");

    return reply
      .header("Cache-Control", "no-store")
      .type("application/vnd.apple.mpegurl")
      .send(playlist);
  });

  app.get<{ Params: { segment: string } }>(
    "/api/cameras/tapo-c100/hls/:segment",
    async (request, reply) => {
      const { segment } = request.params;

      if (!segmentPattern.test(segment)) {
        return reply.code(404).send({
          message: "Stream segment not found.",
        });
      }

      try {
        const contents = await readFile(join(hlsDirectory, segment));

        return reply
          .header("Cache-Control", "no-store")
          .type("video/mp2t")
          .send(contents);
      } catch {
        return reply.code(404).send({
          message: "Stream segment not found.",
        });
      }
    }
  );
}
