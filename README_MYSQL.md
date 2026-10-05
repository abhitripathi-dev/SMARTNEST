# SmartNest MySQL Database & API Migration Guide

This project has been fully migrated from **PostgreSQL (Supabase)** to a standalone **MySQL + Node.js / Express REST API** backend.

---

## 1. Quick Start

### Step 1: Set Up MySQL Database
Make sure MySQL (version 5.7+ or 8.0+) is installed and running on your machine (e.g. via MySQL Community Server, XAMPP, Laragon, or Docker).

Import the schema and seed data into MySQL:
```bash
mysql -u root -p < server/schema.mysql.sql
```
*(Or open [server/schema.mysql.sql](file:///c:/project/project/server/schema.mysql.sql) in MySQL Workbench / phpMyAdmin and execute it).*

### Step 2: Configure Environment Variables
Edit [.env](file:///c:/project/project/.env) with your MySQL connection credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartnest_db
JWT_SECRET=smartnest_super_secret_jwt_key_2026
```

### Step 3: Start the Backend & Frontend
You can run both concurrently or separately:

**Run both together:**
```bash
npm run dev:all
```

**Run separately:**
- **Terminal 1 (MySQL API Server):**
  ```bash
  npm run server
  ```
  *(Server runs at `http://localhost:5000`)*

- **Terminal 2 (React Vite Frontend):**
  ```bash
  npm run dev
  ```
  *(Frontend runs at `http://localhost:5173`)*

---

## 2. MySQL Database Schema Details

The schema is defined in [server/schema.mysql.sql](file:///c:/project/project/server/schema.mysql.sql) with the following 13 tables:

| Table | Description | Key Columns |
|---|---|---|
| `users` | User credentials & authentication | `id (VARCHAR)`, `email`, `password_hash` |
| `societies` | Registered housing societies | `id`, `name`, `address`, `code`, `created_by` |
| `profiles` | User profiles with role & society mapping | `id`, `society_id`, `full_name`, `phone`, `role` |
| `flats` | Apartment units | `id`, `society_id`, `flat_number`, `block`, `status` |
| `residents` | Flat residents (owners & tenants) | `id`, `society_id`, `flat_id`, `full_name`, `phone` |
| `maintenance_bills` | Monthly maintenance charges | `id`, `society_id`, `flat_id`, `amount`, `status` |
| `complaints` | Resident complaint tickets | `id`, `society_id`, `resident_id`, `priority`, `status` |
| `visitors` | Gate security visitor entry logs | `id`, `society_id`, `visitor_name`, `entry_time`, `exit_time` |
| `facilities` | Society amenities (Clubhouse, Gym, etc.) | `id`, `society_id`, `name`, `status`, `open_until` |
| `facility_bookings` | Amenity reservations | `id`, `facility_id`, `resident_id`, `booking_date` |
| `notifications` | System and broadcast announcements | `id`, `society_id`, `title`, `message`, `is_read` |
| `society_members` | Society committee & staff management | `id`, `society_id`, `full_name`, `role`, `permissions` |
| `demo_leads` | Marketing inquiry submissions | `id`, `name`, `mobile`, `society_name`, `units` |

---

## 3. REST API Reference

The backend provides the following RESTful routes under `/api`:

### Authentication & Profiles
- `POST /api/auth/login` — Sign in with email/password (returns JWT token)
- `POST /api/auth/register` — Register user
- `POST /api/auth/register-society` — Full onboarding (creates society, wings, flats & admin)
- `POST /api/auth/join` — Join an existing society by Code / ID
- `GET /api/auth/me` — Get authenticated user details & society
- `PUT /api/auth/profile` — Update user profile

### Society Resources
- `GET /api/flats`, `POST /api/flats`, `PUT /api/flats/:id`, `DELETE /api/flats/:id`
- `GET /api/residents`, `POST /api/residents`, `PUT /api/residents/:id`, `DELETE /api/residents/:id`
- `GET /api/bills`, `POST /api/bills`, `PATCH /api/bills/:id/pay`, `DELETE /api/bills/:id`
- `GET /api/complaints`, `POST /api/complaints`, `PATCH /api/complaints/:id/status`, `DELETE /api/complaints/:id`
- `GET /api/visitors`, `POST /api/visitors`, `PATCH /api/visitors/:id/exit`, `DELETE /api/visitors/:id`
- `GET /api/facilities`, `POST /api/facilities`, `PUT /api/facilities/:id`, `DELETE /api/facilities/:id`
- `GET /api/facilities/bookings/all`, `POST /api/facilities/bookings`
- `GET /api/notifications`, `POST /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- `GET /api/members`, `POST /api/members`, `PUT /api/members/:id/role`, `DELETE /api/members/:id`
- `GET /api/dashboard/stats`, `GET /api/dashboard/charts`
- `GET /api/leads`, `POST /api/leads`
- `GET /api/health` — Health check
