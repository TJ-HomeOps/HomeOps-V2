import { useEffect, useMemo, useState } from "react";

import ContainerCard from "../components/ContainerCard";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";

interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

const API = "http://192.168.0.20:3000";

export default function Containers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadContainers() {
    try {
      const response = await fetch(`${API}/api/containers`);
      const data = await response.json();
      setContainers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContainers();

    const interval = setInterval(loadContainers, 10000);

    return () => clearInterval(interval);
  }, []);

  async function action(id: string, command: string) {
    try {
      await fetch(`${API}/api/containers/${id}/${command}`, {
        method: "POST",
      });

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
          <h2>No containers found</h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Try another search.
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
