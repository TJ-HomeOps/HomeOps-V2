import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Containers from "./pages/Containers";
import Proxmox from "./pages/Proxmox";
import Notifications from "./pages/Notifications";
import Announcements from "./pages/Announcements";
import Settings from "./pages/Settings";

import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <aside className="sidebar">
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

            <NavLink to="/notifications">
              Notifications
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/proxmox" element={<Proxmox />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
