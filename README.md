## ✨ Glancy: Proximity-Based Communication Platform

Glancy is an innovative, location-aware communication platform designed to connect users who are physically near each other. It enables real-time messaging, audio calls, and video calls with users in your immediate vicinity, creating a truly localized social experience.

## Demo

![Demo Video](https://github.com/user-attachments/assets/90493e0e-796a-4c47-877e-4162024ceedf)

## Features

- Proximity-Based Discovery: See and connect with other Glancy users based on their real-time geographical proximity.

- Real-Time Messaging: Instantaneous text communication using WebSockets for low latency.

- Audio and Video Calling: High-quality, real-time voice and video calls with nearby users.

- Location Services: Efficiently handles and updates user location data to maintain accurate proximity information.

## 🛠️ Tech Stack

- Bun – runtime and server environment

- TypeScript – typed application logic

- Redis (Pub/Sub) – event distribution and real-time updates

- WS – WebSocket server for messaging and signaling

- PostgreSQL – user data, sessions, location history

- Mediasoup - audio/video call flows

- Docker – local environments

## Getting Started

### Clone the Repository

```bash
# 1. Clone the Repository
git clone https://github.com/bibektamang7/glancey.git
cd glancey
```

### Install dependencies

```bash
bun install
```

### Setup Environments variables

### Run Services

```bash
bun run dev
```
