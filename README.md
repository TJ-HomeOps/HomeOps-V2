# 🏠 HomeOps V2

> A modern self-hosted dashboard for managing Proxmox infrastructure, Docker services, and your home lab from a single interface.

![Status](https://img.shields.io/badge/status-Active%20Development-success)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Backend](https://img.shields.io/badge/Backend-Fastify-000000?logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript)
![Proxmox](https://img.shields.io/badge/Platform-Proxmox-E57000)

---

# ✨ Overview

HomeOps V2 is a modern, self-hosted management platform built for Proxmox home labs.

Instead of juggling multiple browser tabs for Proxmox, Portainer, and your self-hosted applications, HomeOps brings everything together into one clean and responsive dashboard.

The project is written entirely in **TypeScript**, using **React** on the frontend and **Fastify** on the backend, making it fast, lightweight, and easy to extend.

---

# 🚀 Current Features

## 🖥️ Proxmox

- Live cluster overview
- Node information
- VM status
- LXC status
- CPU usage
- Memory usage
- Disk usage
- Start / Stop / Restart virtual machines
- Start / Stop / Restart containers

## 🎨 Dashboard

- Modern React interface
- Fastify REST API
- Responsive layout
- Resource overview
- Clean and lightweight UI

---

# 🛣️ Planned Features

- Docker / Portainer integration
- Authentik SSO
- Active Directory authentication
- Project management
- Case management
- Service monitoring
- Notification system
- WebSocket live updates
- Dashboard widgets
- Backup monitoring
- Mobile-friendly interface

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- TypeScript

## Backend

- Fastify
- TypeScript
- Axios
- Proxmox REST API
- Portainer API

---

# 📁 Project Structure

```text
HomeOps-V2/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   ├── routes/
│   ├── services/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# 🚀 Installation

Clone the repository:

```bash
git clone git@github.com:TJ-HomeOps/HomeOps-V2.git
cd HomeOps-V2
```

---

## Backend

Install dependencies:

```bash
cd backend
npm install
```

Create `backend/.env`

```env
PORTAINER_URL=https://<PORTAINER-IP>:9443/api
PORTAINER_TOKEN=

PROXMOX_URL=https://<PROXMOX-IP>:8006
PROXMOX_TOKEN_ID=
PROXMOX_TOKEN_SECRET=
```

Start the backend:

```bash
npm run dev
```

---

## Frontend

Install dependencies:

```bash
cd ../frontend
npm install
```

Create `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

If your backend is running on another machine, replace `localhost` with your backend's IP address or hostname.

Example:

```env
VITE_API_URL=http://192.168.0.20:3000
```

Start the frontend:

```bash
npm run dev
```

---

# ⚙️ Environment Variables

## Backend

| Variable | Description |
|----------|-------------|
| `PORTAINER_URL` | URL to the Portainer API |
| `PORTAINER_TOKEN` | Portainer API Token |
| `PROXMOX_URL` | URL to the Proxmox API |
| `PROXMOX_TOKEN_ID` | Proxmox API Token ID |
| `PROXMOX_TOKEN_SECRET` | Proxmox API Token Secret |

## Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL to the HomeOps backend API |

---

# 🏗 Architecture

```text
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       ▼
┌────────────────────────┐
│ React + Vite Frontend  │
└──────────┬─────────────┘
           │ REST API
           ▼
┌────────────────────────┐
│ Fastify Backend        │
└──────────┬─────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
 Proxmox API  Portainer API
```

---

# 📸 Screenshots

Screenshots and demo videos will be added as the project evolves.

---

# 🗺️ Roadmap

## Version 1

- [x] React frontend
- [x] Fastify backend
- [x] Proxmox API integration
- [x] Cluster overview
- [x] VM/LXC power controls

## Version 2

- [ ] Portainer integration
- [ ] Docker container management
- [ ] Dashboard widgets
- [ ] Authentik authentication
- [ ] Active Directory integration
- [ ] User management

## Future

- [ ] Project management
- [ ] Case management
- [ ] Service monitoring
- [ ] Notification system
- [ ] Backup monitoring
- [ ] Mobile support
- [ ] Plugin system

---

# 🤝 Contributing

Contributions, feature requests, and bug reports are always welcome.

If you'd like to contribute, feel free to open an issue or submit a pull request.

---

# 📄 License

This project is licensed under the MIT License.

---

# ❤️ About

HomeOps V2 started as a personal project to simplify managing an ever-growing Proxmox home lab.

As more services were added, including Docker, media servers, authentication, monitoring, backups, and automation, managing everything across multiple web interfaces became increasingly cumbersome.

The goal of HomeOps is to provide a fast, modern, and extensible control center that brings all your infrastructure together in one place.
