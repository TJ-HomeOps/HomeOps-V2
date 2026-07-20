# 🏠 HomeOps V2

> A modern self-hosted dashboard for managing Proxmox infrastructure, virtual machines, containers, and home lab services.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active%20Development-green)
![Backend](https://img.shields.io/badge/backend-Fastify-000000?logo=fastify)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Proxmox](https://img.shields.io/badge/Platform-Proxmox-E57000)

---

## 📖 Overview

HomeOps V2 is a self-hosted management platform built specifically for Proxmox home labs.

Instead of juggling multiple browser tabs, HomeOps provides a single dashboard where you can monitor and manage your infrastructure, services, and projects.

Designed for enthusiasts and self-hosters, it focuses on speed, simplicity, and automation.

---

## ✨ Features

### 🖥️ Proxmox Integration

- Live cluster overview
- VM & LXC status
- CPU usage
- Memory usage
- Disk usage
- Node health
- Start / Stop / Restart virtual machines
- Real-time refresh

### 📊 Dashboard

- Infrastructure overview
- Resource utilization
- Service health
- Quick actions
- Beautiful responsive interface

### 🔒 Authentication *(Planned)*

- Authentik SSO
- Active Directory integration
- Role-based permissions
- API Tokens

### 📁 Project Management *(Planned)*

- Track projects
- Case numbers
- Documentation
- Notes
- File attachments

### 📦 Service Monitoring *(Planned)*

- Docker containers
- Plex
- Jellyfin
- Nextcloud
- Immich
- Vaultwarden
- Custom services

### ⚡ Automation *(Planned)*

- Provision LXCs
- Provision VMs
- Execute Proxmox API actions
- Scheduled tasks
- Notifications

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite

## Backend

- Fastify
- TypeScript
- Axios
- Proxmox REST API

---

# 📂 Project Structure

```
HomeOps-V2/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── routes/
│   ├── services/
│   └── package.json
│
└── README.md
```

---

# 🚀 Getting Started

## Clone

```bash
git clone git@github.com:TJ-HomeOps/HomeOps-V2.git
cd HomeOps-V2
```

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

# ⚙️ Configuration

Create a `.env` inside the backend folder.

Example:

```env
PROXMOX_URL=https://your-proxmox:8006
PROXMOX_TOKEN_ID=your-token
PROXMOX_TOKEN_SECRET=your-secret
```

---

# 📸 Screenshots

> Screenshots will be added as the project evolves.

---

# 🗺️ Roadmap

- [x] Connect to Proxmox API
- [x] Display cluster overview
- [x] Start/Stop/Restart VMs and LXCs
- [ ] Live updates with WebSockets
- [ ] Authentik authentication
- [ ] User management
- [ ] Docker management
- [ ] Service monitoring
- [ ] Notifications
- [ ] Project management
- [ ] Case management
- [ ] Dashboard customization
- [ ] Mobile responsive layout
- [ ] Dark / Light themes

---

# 🤝 Contributing

Contributions, suggestions, and feature requests are always welcome.

Feel free to open an Issue or submit a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

# ❤️ Why?

HomeOps V2 started as a personal project to simplify managing a growing Proxmox home lab.

As the lab expanded to include Docker, media servers, authentication services, monitoring, backups, and automation, switching between multiple web interfaces became cumbersome.

HomeOps aims to bring everything together into one fast, modern, and extensible control center.
