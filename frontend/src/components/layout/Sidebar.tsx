import {
  House,
  Server,
  Container,
  FolderKanban,
  Settings,
} from "lucide-react";

import NavItem from "./NavItem";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 260,
        background: "#182232",
        borderRight: "1px solid #27364b",
        padding: 20,
      }}
    >
      <h2
        style={{
          color: "#fff",
          marginBottom: 40,
        }}
      >
        🏠 HomeOps
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <NavItem
          to="/"
          icon={<House size={18} />}
          label="Dashboard"
        />

        <NavItem
          to="/proxmox"
          icon={<Server size={18} />}
          label="Proxmox"
        />

        <NavItem
          to="/docker"
          icon={<Container size={18} />}
          label="Docker"
        />

        <NavItem
          to="/projects"
          icon={<FolderKanban size={18} />}
          label="Projects"
        />

        <NavItem
          to="/settings"
          icon={<Settings size={18} />}
          label="Settings"
        />
      </div>
    </aside>
  );
}
