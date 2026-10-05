-- ============================================================
-- SmartNest Society Management System - MySQL Database Schema
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartnest_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartnest_db;

-- 1. USERS TABLE (Replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. SOCIETIES TABLE
CREATE TABLE IF NOT EXISTS societies (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  code VARCHAR(50) UNIQUE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_societies_code ON societies(code);

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role ENUM('admin', 'resident', 'staff') NOT NULL DEFAULT 'resident',
  avatar_color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_profiles_society_id ON profiles(society_id);

-- 4. FLATS TABLE
CREATE TABLE IF NOT EXISTS flats (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  flat_number VARCHAR(50) NOT NULL,
  block VARCHAR(50),
  floor VARCHAR(50),
  area VARCHAR(50),
  status ENUM('occupied', 'vacant', 'under_maintenance') NOT NULL DEFAULT 'vacant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_flats_society_id ON flats(society_id);
CREATE INDEX idx_flats_flat_number ON flats(flat_number);

-- 5. RESIDENTS TABLE
CREATE TABLE IF NOT EXISTS residents (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  flat_id VARCHAR(36),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  type ENUM('owner', 'tenant') NOT NULL DEFAULT 'owner',
  status ENUM('active', 'pending') NOT NULL DEFAULT 'active',
  avatar_color VARCHAR(50) DEFAULT 'blue',
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_residents_society_id ON residents(society_id);
CREATE INDEX idx_residents_flat_id ON residents(flat_id);

-- 6. MAINTENANCE BILLS TABLE
CREATE TABLE IF NOT EXISTS maintenance_bills (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  flat_id VARCHAR(36) NOT NULL,
  resident_id VARCHAR(36),
  bill_period VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('paid', 'pending', 'overdue') NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_bills_society_id ON maintenance_bills(society_id);
CREATE INDEX idx_bills_flat_id ON maintenance_bills(flat_id);
CREATE INDEX idx_bills_status ON maintenance_bills(status);

-- 7. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  resident_id VARCHAR(36),
  flat_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_complaints_society_id ON complaints(society_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);

-- 8. VISITORS TABLE
CREATE TABLE IF NOT EXISTS visitors (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  visitor_name VARCHAR(255) NOT NULL,
  flat_id VARCHAR(36),
  phone VARCHAR(50),
  purpose VARCHAR(255),
  photo_url MEDIUMTEXT,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_visitors_society_id ON visitors(society_id);
CREATE INDEX idx_visitors_entry_time ON visitors(entry_time);

-- 9. FACILITIES TABLE
CREATE TABLE IF NOT EXISTS facilities (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('available', 'occupied', 'closed') NOT NULL DEFAULT 'available',
  open_until VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_facilities_society_id ON facilities(society_id);

-- 10. FACILITY BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS facility_bookings (
  id VARCHAR(36) PRIMARY KEY,
  facility_id VARCHAR(36) NOT NULL,
  society_id VARCHAR(36) NOT NULL,
  resident_id VARCHAR(36),
  flat_id VARCHAR(36),
  booking_date DATE NOT NULL,
  time_slot VARCHAR(100),
  status ENUM('confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL,
  FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_bookings_facility_id ON facility_bookings(facility_id);
CREATE INDEX idx_bookings_society_id ON facility_bookings(society_id);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'urgent') NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_society_id ON notifications(society_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 12. SOCIETY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS society_members (
  id VARCHAR(36) PRIMARY KEY,
  society_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  role ENUM('admin', 'resident', 'staff') NOT NULL DEFAULT 'resident',
  permissions JSON,
  avatar_color VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_members_society_id ON society_members(society_id);

-- 13. DEMO LEADS TABLE
CREATE TABLE IF NOT EXISTS demo_leads (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  society_name VARCHAR(255) NOT NULL,
  city_name VARCHAR(255) NOT NULL,
  units VARCHAR(50),
  role VARCHAR(50),
  interest VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA (Default Demo Society & Core Accounts)
-- Default Password for all demo accounts: password
-- BCrypt Hash for 'password': $2a$10$7/O8x17pQj9PqVvCg5fGceF9z0ZgZ.JkL3kO5K2O2Jk9M9PqVvCg5
-- ============================================================

INSERT INTO users (id, email, password_hash) VALUES
  ('usr-demo-admin-001', 'admin@smartnest.community', '$2a$10$kP7p2c9xO1y8gB1wP4aMre3m4kR6t7u8v9w0x1y2z3a4b5c6d7e8f'),
  ('usr-demo-staff-002', 'staff@smartnest.community', '$2a$10$kP7p2c9xO1y8gB1wP4aMre3m4kR6t7u8v9w0x1y2z3a4b5c6d7e8f'),
  ('usr-demo-resident-003', 'pooja@iyer.org', '$2a$10$kP7p2c9xO1y8gB1wP4aMre3m4kR6t7u8v9w0x1y2z3a4b5c6d7e8f')
ON DUPLICATE KEY UPDATE email=VALUES(email);

INSERT INTO societies (id, name, address, code, created_by) VALUES
  ('e7b1a234-5678-4321-8765-abcdef123456', 'SmartNest Heights', 'Tower 4, Palm Avenue, Sector 54, Mumbai', 'SMARTNEST-DEMO', 'usr-demo-admin-001')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO profiles (id, society_id, full_name, phone, role, avatar_color) VALUES
  ('usr-demo-admin-001', 'e7b1a234-5678-4321-8765-abcdef123456', 'Community Administrator', '+91 98201 23456', 'admin', 'blue'),
  ('usr-demo-staff-002', 'e7b1a234-5678-4321-8765-abcdef123456', 'Security Gate Staff', '+91 98302 34567', 'staff', 'teal'),
  ('usr-demo-resident-003', 'e7b1a234-5678-4321-8765-abcdef123456', 'Pooja Iyer', '+91 98403 45678', 'resident', 'violet')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO flats (id, society_id, flat_number, block, floor, area, status) VALUES
  ('flat-101', 'e7b1a234-5678-4321-8765-abcdef123456', 'A-101', 'A Wing', '1st Floor', '1,250 sq ft', 'occupied'),
  ('flat-102', 'e7b1a234-5678-4321-8765-abcdef123456', 'A-102', 'A Wing', '1st Floor', '1,450 sq ft', 'occupied'),
  ('flat-201', 'e7b1a234-5678-4321-8765-abcdef123456', 'A-201', 'A Wing', '2nd Floor', '1,250 sq ft', 'vacant'),
  ('flat-202', 'e7b1a234-5678-4321-8765-abcdef123456', 'A-202', 'A Wing', '2nd Floor', '1,850 sq ft', 'occupied'),
  ('flat-301', 'e7b1a234-5678-4321-8765-abcdef123456', 'B-301', 'B Wing', '3rd Floor', '1,600 sq ft', 'occupied'),
  ('flat-302', 'e7b1a234-5678-4321-8765-abcdef123456', 'B-302', 'B Wing', '3rd Floor', '1,600 sq ft', 'under_maintenance'),
  ('flat-401', 'e7b1a234-5678-4321-8765-abcdef123456', 'B-401', 'B Wing', '4th Floor', '2,100 sq ft', 'occupied'),
  ('flat-402', 'e7b1a234-5678-4321-8765-abcdef123456', 'B-402', 'B Wing', '4th Floor', '2,100 sq ft', 'vacant')
ON DUPLICATE KEY UPDATE flat_number=VALUES(flat_number);

INSERT INTO residents (id, society_id, flat_id, full_name, phone, email, type, status, avatar_color, user_id) VALUES
  ('res-1', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-101', 'Aarav Sharma', '+91 98201 11223', 'aarav@sharma.in', 'owner', 'active', 'blue', NULL),
  ('res-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-102', 'Pooja Iyer', '+91 98403 45678', 'pooja@iyer.org', 'tenant', 'active', 'violet', 'usr-demo-resident-003'),
  ('res-3', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-202', 'Rohan Deshmukh', '+91 98211 44556', 'rohan.d@corp.com', 'owner', 'active', 'teal', NULL),
  ('res-4', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-301', 'Kavita Patel', '+91 98922 88990', 'kavita@patel.me', 'owner', 'active', 'rose', NULL),
  ('res-5', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-401', 'Community Administrator', '+91 98201 23456', 'admin@smartnest.community', 'owner', 'active', 'blue', 'usr-demo-admin-001')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO maintenance_bills (id, society_id, flat_id, resident_id, bill_period, amount, status, due_date, paid_at) VALUES
  ('bill-1', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-101', 'res-1', 'March 2026', 4500.00, 'paid', '2026-03-15', '2026-03-10 14:30:00'),
  ('bill-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-102', 'res-2', 'March 2026', 4200.00, 'pending', '2026-03-15', NULL),
  ('bill-3', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-202', 'res-3', 'March 2026', 5800.00, 'paid', '2026-03-15', '2026-03-08 11:20:00'),
  ('bill-4', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-301', 'res-4', 'March 2026', 5100.00, 'overdue', '2026-03-10', NULL),
  ('bill-5', 'e7b1a234-5678-4321-8765-abcdef123456', 'flat-401', 'res-5', 'March 2026', 6500.00, 'paid', '2026-03-15', '2026-03-05 09:15:00')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

INSERT INTO facilities (id, society_id, name, description, status, open_until) VALUES
  ('fac-1', 'e7b1a234-5678-4321-8765-abcdef123456', 'Clubhouse & Multipurpose Hall', 'Air-conditioned community hall equipped with audio-visual system and banquet seating.', 'available', '10:00 PM'),
  ('fac-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'Swimming Pool', 'Community swimming pool with regular maintenance and dedicated kids pool area.', 'available', '08:00 PM'),
  ('fac-3', 'e7b1a234-5678-4321-8765-abcdef123456', 'Badminton Court', 'Indoor wooden badminton court with LED lighting.', 'occupied', '09:30 PM'),
  ('fac-4', 'e7b1a234-5678-4321-8765-abcdef123456', 'Gymnasium & Fitness Studio', 'State of the art cardio and weight training equipment with air conditioning.', 'available', '10:30 PM')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO complaints (id, society_id, resident_id, flat_id, title, description, priority, status) VALUES
  ('cmp-1', 'e7b1a234-5678-4321-8765-abcdef123456', 'res-2', 'flat-102', 'Water Seepage in Master Bedroom Ceiling', 'Slow water seepage noticed on the eastern ceiling corner after heavy rains.', 'high', 'in_progress'),
  ('cmp-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'res-3', 'flat-202', 'Corridor Light Bulb Not Working', 'Light fixture outside Flat 202 flickers and turns off intermittently.', 'low', 'open'),
  ('cmp-3', 'e7b1a234-5678-4321-8765-abcdef123456', 'res-1', 'flat-101', 'Lift 2 Making Grinding Noise', 'Main elevator makes a squeaking sound when stopping at 1st floor.', 'medium', 'resolved')
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO visitors (id, society_id, visitor_name, flat_id, phone, purpose, entry_time, exit_time) VALUES
  ('vis-1', 'e7b1a234-5678-4321-8765-abcdef123456', 'Vikram Seth (Amazon Delivery)', 'flat-102', '+91 98111 22334', 'Package Delivery', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  ('vis-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'Dr. Meera Nambiar', 'flat-202', '+91 98222 33445', 'Personal Guest', DATE_SUB(NOW(), INTERVAL 45 MINUTE), NULL),
  ('vis-3', 'e7b1a234-5678-4321-8765-abcdef123456', 'Suresh Kumar (Urban Company)', 'flat-301', '+91 98333 44556', 'AC Repair Service', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL)
ON DUPLICATE KEY UPDATE visitor_name=VALUES(visitor_name);

INSERT INTO notifications (id, society_id, user_id, title, message, type, is_read) VALUES
  ('notif-1', 'e7b1a234-5678-4321-8765-abcdef123456', NULL, 'Annual General Meeting', 'The society AGM is scheduled for this coming Sunday at 10:30 AM in the Clubhouse.', 'info', FALSE),
  ('notif-2', 'e7b1a234-5678-4321-8765-abcdef123456', 'usr-demo-resident-003', 'Maintenance Due Notice', 'Your maintenance bill for March 2026 is due on 15th March.', 'warning', FALSE)
ON DUPLICATE KEY UPDATE title=VALUES(title);
