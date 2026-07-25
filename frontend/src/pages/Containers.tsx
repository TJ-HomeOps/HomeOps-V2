import { useEffect, useMemo, useState } from "react";

import ContainerCard from "../components/ContainerCard";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import {
  getContainers,
  restartContainer,
  startContainer,
  stopContainer,
} from "../api/docker";
import type { Container } from "../api/docker";

export default function Containers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  async function loadContainers() {
    try {
      setContainers(await getContainers());
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContainers();

    const interval = setInterval(loadContainers, 10000);

    return () => clearInterval(interval);
  }, []);

  async function action(
    id: string,
    command: "start" | "stop" | "restart"
  ) {
    const run = {
      start: startContainer,
      stop: stopContainer,
      restart: restartContainer,
    }[command];

    try {
      await run(id);

      loadContainers();
    } catch (err) {
      console.error(err);
    }
  }

  const filteredContainers = useMemo(() => {
    return containers.filter((container) => {
      const searchText = (
        container.name +
        " " +
        container.image +
        " " +
        container.status
      ).toLowerCase();

      return searchText.includes(search.toLowerCase());
    });
  }, [containers, search]);

  if (loading) {
    return (
      <div className="page">
        <PageHeader
          title="Containers"
          subtitle="Loading Docker containers..."
        />
      </div>
    );
  }

  return (
    <div className="page">

      <PageHeader
        title="Containers"
        subtitle={`${filteredContainers.length} containers`}
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search containers..."
        />
      </PageHeader>

      {filteredContainers.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "#111827",
            borderRadius: 12,
            border: "1px solid #1f2937",
          }}
        >
          <h2>
            {error
              ? "Unable to load containers"
              : "No containers found"}
          </h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            {error
              ? "The Docker API could not be reached."
              : "Try another search."}
          </p>
        </div>
      ) : (
        filteredContainers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onStart={(id) => action(id, "start")}
            onRestart={(id) => action(id, "restart")}
            onStop={(id) => action(id, "stop")}
          />
        ))
      )}
    </div>
  );
}
