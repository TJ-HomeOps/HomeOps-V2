import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

import AuthGate from "./auth/AuthGate";
import Dashboard from "./pages/Dashboard";
import Containers from "./pages/Containers";
import ContainerDetail from "./pages/ContainerDetail";
import Proxmox from "./pages/Proxmox";
import NodeDetail from "./pages/NodeDetail";
import GuestDetail from "./pages/GuestDetail";
import Camera from "./pages/Camera";
import Watchtower from "./pages/Watchtower";
import Notifications from "./pages/Notifications";
import AuditLog from "./pages/AuditLog";
import Announcements from "./pages/Announcements";
import Settings from "./pages/Settings";

import "./App.css";

const sidebarStorageKey = "homeops-sidebar-open";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(sidebarStorageKey) !== "false"
  );

  const toggleSidebar = () => {
    setSidebarOpen((current) => {
      const next = !current;
      localStorage.setItem(sidebarStorageKey, String(next));
      return next;
    });
  };

  return (
    <AuthGate>
      <BrowserRouter>
        <div className="layout">
          <aside className={`sidebar${sidebarOpen ? "" : " collapsed"}`}>
            <div className="logo">
              🏠 HomeOps
            </div>

            <nav>
              <NavLink to="/">
                Dashboard
              </NavLink>

              <NavLink to="/containers">
                Containers
              </NavLink>

              <NavLink to="/proxmox">
                Proxmox
              </NavLink>

              <NavLink to="/camera">
                Security Camera
              </NavLink>

              <NavLink to="/watchtower">
                Watchtower
              </NavLink>

              <NavLink to="/notifications">
                Notifications
              </NavLink>

              <NavLink to="/audit-log">
                Audit Log
              </NavLink>

              <NavLink to="/announcements">
                Announcements
              </NavLink>

              <NavLink to="/settings">
                Settings
              </NavLink>
            </nav>
          </aside>

          <main className="content">
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              onClick={toggleSidebar}
            >
              <Menu size={18} />
            </button>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/containers" element={<Containers />} />
              <Route path="/containers/:id" element={<ContainerDetail />} />
              <Route path="/proxmox" element={<Proxmox />} />
              <Route
                path="/proxmox/nodes/:cluster/:node"
                element={<NodeDetail />}
              />
              <Route
                path="/proxmox/vms/:cluster/:node/:vmid"
                element={<GuestDetail kind="qemu" />}
              />
              <Route
                path="/proxmox/lxc/:cluster/:node/:vmid"
                element={<GuestDetail kind="lxc" />}
              />
              <Route path="/camera" element={<Camera />} />
              <Route path="/watchtower" element={<Watchtower />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthGate>
  );
}
