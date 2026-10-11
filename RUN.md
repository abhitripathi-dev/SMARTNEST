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

## 2. Dedicated MySQL Relational Database Architecture

The system runs exclusively on a high-performance **MySQL Relational Database**:
- Connected to MySQL 8.0 on host/container port 3306.
- Connection pooling with automatic reconnection, keepalive, and schema migrations.
- Configured via environment variables in `.env`:
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=smartnest_root_pass
  DB_NAME=smartnest_db
  ```

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
