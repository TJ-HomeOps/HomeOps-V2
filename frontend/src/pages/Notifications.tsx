import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Expand, RefreshCw, Video } from "lucide-react";
import { getCameraStreamUrl, getTapoC100Camera } from "../api/camera";
import type { TapoC100Camera } from "../api/camera";
import PageHeader from "../components/PageHeader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import Spinner from "../components/common/Spinner";
import colors from "../theme/colors";

interface CameraPlayerProps {
  streamUrl: string;
  label: string;
  onError: (message: string) => void;
}

function CameraPlayer({ streamUrl, label, onError }: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const handleNativeError = () => {
      onError("Unable to play the live camera stream.");
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("error", handleNativeError);

      return () => {
        video.removeEventListener("error", handleNativeError);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      onError("This browser does not support HLS camera playback.");
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        onError("The live camera stream could not be loaded.");
      }
    });

    return () => {
      hls.destroy();
    };
  }, [onError, streamUrl]);

  return (
    <video
      ref={videoRef}
      autoPlay
      controls
      muted
      playsInline
      aria-label={label}
      style={{
        display: "block",
        width: "100%",
        aspectRatio: "16 / 9",
        background: colors.black,
        borderRadius: 10,
        objectFit: "contain",
      }}
    />
  );
}

export default function Notifications() {
  const [camera, setCamera] = useState<TapoC100Camera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCamera = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTapoC100Camera();
      setCamera(data);
    } catch {
      setCamera(null);
      setError("Unable to load the camera status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCamera();
  }, []);

  const streamUrl =
    camera?.configured && camera.streamPath
      ? `${getCameraStreamUrl(camera.streamPath)}?refresh=${refreshKey}`
      : null;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Security activity and operational alerts"
      >
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => {
            void loadCamera();
          }}
        >
          Refresh
        </Button>
      </PageHeader>

      {error && (
        <Alert
          title="Camera unavailable"
          variant="danger"
          style={{ marginBottom: 20 }}
        >
          {error}
        </Alert>
      )}

      <Card
        title="Security camera"
        subtitle="Live view"
        actions={<Video size={20} color={colors.primary} />}
        padding={20}
      >
        {loading && (
          <div style={{ padding: "48px 0" }}>
            <Spinner label="Checking camera status" />
          </div>
        )}

        {!loading && !camera?.configured && (
          <Alert title="Camera setup required" variant="info">
            Point TAPO_C100_RTSP_URL in backend/.env at the go2rtc relay, for
            example rtsp://127.0.0.1:8554/tapo-c100. The camera account itself
            lives only in the go2rtc config, so no credentials reach HomeOps.
          </Alert>
        )}

        {!loading && streamUrl && (
          <div style={{ display: "grid", gap: 16 }}>
            <CameraPlayer
              key={streamUrl}
              streamUrl={streamUrl}
              label="Tapo C100 live camera preview"
              onError={setError}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ color: colors.text, fontWeight: 700 }}>
                  {camera?.name ?? "Tapo C100"}
                </div>
                <div
                  style={{
                    color: colors.success,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  Live relay enabled
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} />}
                  onClick={() => {
                    setError(null);
                    setRefreshKey((current) => current + 1);
                  }}
                >
                  Reload stream
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Expand size={16} />}
                  onClick={() => setViewerOpen(true)}
                >
                  Expand
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {streamUrl && (
        <Modal
          open={viewerOpen}
          title={`${camera?.name ?? "Security camera"} live view`}
          width={1000}
          onClose={() => setViewerOpen(false)}
        >
          <CameraPlayer
            key={`${streamUrl}-expanded`}
            streamUrl={streamUrl}
            label="Tapo C100 expanded live camera view"
            onError={setError}
          />
        </Modal>
      )}
    </>
  );
}
