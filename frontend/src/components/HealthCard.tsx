import { useEffect, useState } from "react";
import { api } from "../services/api";

type Health = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
};

export default function HealthCard() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api.get("/health").then((res) => {
      setHealth(res.data);
    });
  }, []);

  if (!health) {
    return (
      <div className="rounded-xl bg-slate-800 p-6">
        Connecting...
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800 p-6">
      <h2 className="text-xl font-bold">
        🟢 Backend Online
      </h2>

      <p>Service: {health.service}</p>
      <p>Status: {health.status}</p>
      <p>Version: {health.version}</p>
    </div>
  );
}
