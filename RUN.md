# SmartNest Society Management System — Run & Deployment Guide

## 1. Quick Start (Development)

Run both the backend API server and frontend with a single command:
```bash
npm run dev
```
- **Frontend App:** http://localhost:5173
- **Backend REST API:** http://localhost:5000/api/health

*(Alternatively, you can run `npm run dev:all` or run the server and client separately using `npm run server` and `npm run dev:client`)*.

---

## 2. High-Concurrency Database Architecture

The system features a **Dual-Engine High-Concurrency Database Architecture**:

1. **Embedded SQLite Relational Engine (Default — Zero Config):**
   - Built directly on Node.js native engine with **WAL mode (Write-Ahead Logging)** enabled (`PRAGMA journal_mode = WAL`).
   - Allows **unlimited simultaneous readers and parallel writers** without blocking.
   - Configured with `PRAGMA busy_timeout = 10000` (10-second queue timeout) to guarantee zero lock collisions or data loss when multiple users save data at the exact same millisecond.
   - Requires **no external MySQL server or Docker to be installed** — works out-of-the-box on Windows, Linux, Mac, Docker, Render, and Railway.
   - Persists all relational tables automatically under `data/smartnest.sqlite`.

2. **Enterprise MySQL / MariaDB (Optional):**
   - If MySQL credentials are provided in `.env` (or via `DATABASE_URL` / `MYSQL_URL`), the server automatically connects to MySQL and applies schema migrations.

3. **Atomic Multi-Entity Linking:**
   - When entering a resident with a flat unit at the same time, the server atomically creates and links both entities in a single step, preventing orphaned records.
   - Cross-tab and real-time updates use `BroadcastChannel` and unified event bus to synchronize state instantly across all open browser tabs.

---

## 3. Production Deployment

### Option A: Cloud Host (Render / Railway / Fly.io / VPS)
1. **Build Command:**
   ```bash
   npm run build
   ```
2. **Start Command:**
   ```bash
   npm start
   ```
   *(Runs fullstack Node.js server on `PORT` 5000 serving both API and static production React assets).*

### Option B: Docker Container
Build and run the self-contained container:
```bash
docker build -t smartnest .
docker run -p 5000:5000 -v smartnest_data:/app/data smartnest
```

### Option C: Docker Compose (Full Stack with MySQL)
```bash
docker compose up -d
```

---

## 4. Verification & Testing

- **Build:** `npm run build`
- **Health Check:** `GET /api/health`
- **API Tests:** All endpoints under `/api/flats`, `/api/residents`, `/api/bills`, `/api/complaints`, `/api/visitors`, `/api/facilities`, `/api/members`
