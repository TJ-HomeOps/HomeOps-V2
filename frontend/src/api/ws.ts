export type WsMessage =
  | { type: "notification.created"; data: unknown }
  | { type: "notification.read"; id: string }
  | { type: "notification.read-all" }
  | { type: "audit.created"; data: unknown }
  | {
      type: "metric.point";
      key: string;
      label: string;
      point: { t: string; v: number };
    };

type Listener = (message: WsMessage) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let reconnectDelayMs = 1000;

function wsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function connect(): void {
  socket = new WebSocket(wsUrl());

  socket.onopen = () => {
    reconnectDelayMs = 1000;
  };

  socket.onmessage = (event) => {
    let message: WsMessage;

    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    for (const listener of listeners) {
      listener(message);
    }
  };

  socket.onclose = () => {
    reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30000);
  };

  socket.onerror = () => {
    socket?.close();
  };
}

export function subscribeToLiveUpdates(listener: Listener): () => void {
  if (!socket && reconnectTimer === null) {
    connect();
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
