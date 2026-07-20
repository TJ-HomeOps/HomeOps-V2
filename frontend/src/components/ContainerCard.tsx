import ActionButton from "./ActionButton";
import StatusBadge from "./StatusBadge";

interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

interface ContainerCardProps {
  container: Container;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
}

export default function ContainerCard({
  container,
  onStart,
  onStop,
  onRestart,
}: ContainerCardProps) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        transition: "0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 22,
              color: "#f8fafc",
            }}
          >
            {container.name}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              wordBreak: "break-word",
            }}
          >
            {container.image}
          </p>

          <div style={{ marginTop: 16 }}>
            <StatusBadge
              state={container.state}
              status={container.status}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <ActionButton
            icon="▶"
            label="Start"
            color="green"
            onClick={() => onStart(container.id)}
          />

          <ActionButton
            icon="🔄"
            label="Restart"
            color="blue"
            onClick={() => onRestart(container.id)}
          />

          <ActionButton
            icon="■"
            label="Stop"
            color="red"
            onClick={() => onStop(container.id)}
          />
        </div>
      </div>
    </div>
  );
}
