import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const DB_URL = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.CLEARDB_DATABASE_URL || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'smartnest_db';
const DB_SSL = process.env.DB_SSL === 'true' || (DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1' && !DB_HOST.startsWith('192.168.'));

export let isDbConnected = false;
export let dbType: 'mysql' | 'sqlite' = 'sqlite';

let rawPool: mysql.Pool | null = null;
let sqliteDb: DatabaseSync | null = null;

function createConnectionPool() {
  if (DB_URL) {
    return mysql.createPool({
      uri: DB_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
    });
  }

  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
    ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
  });
}

function initSqliteDatabase(): DatabaseSync {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = process.env.SQLITE_DB_PATH || path.resolve(dataDir, 'smartnest.sqlite');
  const db = new DatabaseSync(dbPath);

  // Configure high-concurrency WAL mode & busy timeout
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 10000;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create all tables in SQLite
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      raw_password TEXT,
      society_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS societies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      code TEXT UNIQUE,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      society_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'resident',
      avatar_color TEXT DEFAULT 'blue',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flats (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      flat_number TEXT NOT NULL,
      block TEXT,
      floor TEXT,
      area TEXT,
      status TEXT NOT NULL DEFAULT 'vacant',
      resident_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS residents (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      flat_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      type TEXT NOT NULL DEFAULT 'owner',
      status TEXT NOT NULL DEFAULT 'active',
      avatar_color TEXT DEFAULT 'blue',
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_bills (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      flat_id TEXT NOT NULL,
      resident_id TEXT,
      bill_period TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      resident_id TEXT,
      flat_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      flat_id TEXT,
      phone TEXT,
      purpose TEXT,
      photo_url TEXT,
      entry_time TEXT DEFAULT CURRENT_TIMESTAMP,
      exit_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      open_until TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facility_bookings (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      society_id TEXT NOT NULL,
      resident_id TEXT,
      flat_id TEXT,
      booking_date TEXT NOT NULL,
      time_slot TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS society_members (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      permissions TEXT,
      avatar_color TEXT DEFAULT 'teal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS demo_leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      society_name TEXT NOT NULL,
      city_name TEXT,
      units TEXT,
      role TEXT,
      interest TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_flats_society ON flats(society_id);
    CREATE INDEX IF NOT EXISTS idx_residents_society ON residents(society_id);
    CREATE INDEX IF NOT EXISTS idx_bills_society ON maintenance_bills(society_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_society ON complaints(society_id);
    CREATE INDEX IF NOT EXISTS idx_visitors_society ON visitors(society_id);
  `);

  return db;
}

function importInitialDataIntoSqlite(db: DatabaseSync) {
  const storePath = path.resolve(process.cwd(), 'server_store.json');
  if (!fs.existsSync(storePath)) return;

  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    const data = JSON.parse(raw);

    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    if (userCount > 0) return; // Already seeded

    console.log('[SQLite Database] Seeding initial tables from server_store.json...');

    // Users
    if (Array.isArray(data.users)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash, raw_password, society_id) VALUES (?, ?, ?, ?, ?)');
      for (const u of data.users) {
        stmt.run(u.id, u.email, u.password_hash || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', u.raw_password || null, u.society_id || null);
      }
    }

    // Societies
    if (Array.isArray(data.societies)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO societies (id, name, address, code, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)');
      for (const s of data.societies) {
        stmt.run(s.id, s.name, s.address || null, s.code || null, s.created_by || null, s.created_at || new Date().toISOString());
      }
    }

    // Profiles
    if (Array.isArray(data.profiles)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO profiles (id, society_id, full_name, phone, role, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const p of data.profiles) {
        stmt.run(p.id, p.society_id || null, p.full_name, p.phone || null, p.role || 'admin', p.avatar_color || 'blue', p.created_at || new Date().toISOString());
      }
    }

    // Flats
    if (Array.isArray(data.flats)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO flats (id, society_id, flat_number, block, floor, area, status, resident_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const f of data.flats) {
        stmt.run(f.id, f.society_id, f.flat_number, f.block || null, f.floor || null, f.area || null, f.status || 'vacant', f.resident_name || null, f.created_at || new Date().toISOString());
      }
    }

    // Residents
    if (Array.isArray(data.residents)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO residents (id, society_id, flat_id, full_name, phone, email, type, status, avatar_color, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const r of data.residents) {
        stmt.run(r.id, r.society_id, r.flat_id || null, r.full_name, r.phone || null, r.email || null, r.type || 'owner', r.status || 'active', r.avatar_color || 'blue', r.user_id || null, r.created_at || new Date().toISOString());
      }
    }

    // Maintenance Bills
    if (Array.isArray(data.bills)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO maintenance_bills (id, society_id, flat_id, resident_id, bill_period, amount, status, due_date, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const b of data.bills) {
        stmt.run(b.id, b.society_id, b.flat_id, b.resident_id || null, b.bill_period, Number(b.amount || 0), b.status || 'pending', b.due_date || null, b.paid_at || null, b.created_at || new Date().toISOString());
      }
    }

    // Complaints
    if (Array.isArray(data.complaints)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO complaints (id, society_id, resident_id, flat_id, title, description, priority, status, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const c of data.complaints) {
        stmt.run(c.id, c.society_id, c.resident_id || null, c.flat_id || null, c.title, c.description || null, c.priority || 'medium', c.status || 'open', c.created_at || new Date().toISOString(), c.resolved_at || null);
      }
    }

    // Visitors
    if (Array.isArray(data.visitors)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO visitors (id, society_id, visitor_name, flat_id, phone, purpose, photo_url, entry_time, exit_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const v of data.visitors) {
        stmt.run(v.id, v.society_id, v.visitor_name, v.flat_id || null, v.phone || null, v.purpose || null, v.photo_url || null, v.entry_time || new Date().toISOString(), v.exit_time || null, v.created_at || new Date().toISOString());
      }
    }

    // Facilities
    if (Array.isArray(data.facilities)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO facilities (id, society_id, name, description, status, open_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const fc of data.facilities) {
        stmt.run(fc.id, fc.society_id, fc.name, fc.description || null, fc.status || 'available', fc.open_until || null, fc.created_at || new Date().toISOString());
      }
    }

    // Bookings
    if (Array.isArray(data.bookings)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO facility_bookings (id, facility_id, society_id, resident_id, flat_id, booking_date, time_slot, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const bk of data.bookings) {
        stmt.run(bk.id, bk.facility_id, bk.society_id, bk.resident_id || null, bk.flat_id || null, bk.booking_date, bk.time_slot || null, bk.status || 'confirmed', bk.created_at || new Date().toISOString());
      }
    }

    // Notifications
    if (Array.isArray(data.notifications)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO notifications (id, society_id, user_id, title, message, type, is_read, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const n of data.notifications) {
        stmt.run(n.id, n.society_id, n.user_id || null, n.title, n.message, n.type || 'info', n.read ? 1 : 0, n.link || null, n.created_at || new Date().toISOString());
      }
    }

    // Members
    if (Array.isArray(data.members)) {
      const stmt = db.prepare('INSERT OR IGNORE INTO society_members (id, society_id, full_name, phone, email, role, permissions, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const m of data.members) {
        stmt.run(m.id, m.society_id, m.full_name, m.phone || null, m.email || null, m.role || 'staff', JSON.stringify(m.permissions || []), m.avatar_color || 'teal', m.created_at || new Date().toISOString());
      }
    }

    console.log('[SQLite Database] Seed data imported successfully into relational tables.');
  } catch (err: any) {
    console.warn('[SQLite Database] Seed import note:', err?.message || err);
  }
}

function translateSqlForSqlite(sql: string): string {
  let translated = sql
    .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

  // Handle ON DUPLICATE KEY UPDATE
  if (/ON DUPLICATE KEY UPDATE/i.test(translated)) {
    translated = translated.replace(/ON DUPLICATE KEY UPDATE\s+([\s\S]+)/i, (_, p1) => {
      const setClause = p1.replace(/VALUES\((\w+)\)/gi, (_: any, col: string) => `excluded.${col}`);
      return `ON CONFLICT(id) DO UPDATE SET ${setClause}`;
    });
  }

  return translated;
}

function normalizeParamsForSqlite(params: any[]): any[] {
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

function runSqliteQuery(sql: string, params: any[] = []): any {
  if (!sqliteDb) {
    throw new Error('SQLite database not initialized');
  }

  const translatedSql = translateSqlForSqlite(sql.trim());
  const cleanParams = normalizeParamsForSqlite(params);

  const isSelect = /^(SELECT|PRAGMA|SHOW)\b/i.test(translatedSql);

  const stmt = sqliteDb.prepare(translatedSql);
  if (isSelect) {
    const rows = stmt.all(...cleanParams);
    return [rows, []];
  } else {
    const result = stmt.run(...cleanParams);
    return [{ affectedRows: result.changes, insertId: result.lastInsertRowid }, []];
  }
}

export const pool = {
  query: async (sql: string, params: any[] = []): Promise<any> => {
    if (dbType === 'mysql' && rawPool && isDbConnected) {
      return rawPool.query(sql, params);
    }
    return runSqliteQuery(sql, params);
  },

  getConnection: async () => {
    if (dbType === 'mysql' && rawPool && isDbConnected) {
      return rawPool.getConnection();
    }

    // Return virtual connection for SQLite with transaction support
    return {
      query: async (sql: string, params: any[] = []) => runSqliteQuery(sql, params),
      beginTransaction: async () => {
        if (sqliteDb) sqliteDb.exec('BEGIN TRANSACTION;');
      },
      commit: async () => {
        if (sqliteDb) sqliteDb.exec('COMMIT;');
      },
      rollback: async () => {
        if (sqliteDb) {
          try {
            sqliteDb.exec('ROLLBACK;');
          } catch { }
        }
      },
      release: () => { },
    };
  },

  end: async () => {
    if (rawPool) {
      await rawPool.end();
    }
    if (sqliteDb) {
      sqliteDb.close();
      sqliteDb = null;
    }
  },
};

export async function queryDb(sql: string, params: any[] = []): Promise<any> {
  return pool.query(sql, params);
}

export async function initializeDatabase(): Promise<boolean> {
  // 1. Try MySQL if explicitly configured or available
  try {
    rawPool = createConnectionPool();
    const conn = await rawPool.getConnection();
    console.log(`[MySQL] Connected successfully to database '${DB_NAME}' at ${DB_HOST}:${DB_PORT}`);
    isDbConnected = true;
    dbType = 'mysql';

    const [tables]: any = await conn.query('SHOW TABLES;');
    if (!tables || tables.length === 0) {
      console.log('[MySQL] No tables detected. Running initial schema & seed migration...');
      const schemaPath = path.resolve(__dirname, '../schema.mysql.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const statements = schemaSql
          .replace(/--.*$/gm, '')
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

        for (const statement of statements) {
          try {
            await conn.query(statement);
          } catch (stmtErr: any) {
            console.warn(`[MySQL Migration Warning] ${stmtErr.message}`);
          }
        }
        console.log('[MySQL] Initial schema and seed data applied successfully!');
      }
    }
    conn.release();
    return true;
  } catch (mysqlErr: any) {
    // 2. Fall back seamlessly to Embedded High-Concurrency SQLite Database
    try {
      console.log(`[Database Engine] MySQL not detected (${mysqlErr.message || 'Offline'}). Initializing High-Concurrency SQLite WAL Engine...`);
      sqliteDb = initSqliteDatabase();
      importInitialDataIntoSqlite(sqliteDb);
      isDbConnected = true;
      dbType = 'sqlite';
      console.log('[Database Engine] Embedded SQLite Relational Database (WAL mode) active and ready for concurrent operations!');
      return true;
    } catch (sqliteErr: any) {
      console.error('[Database Engine] Critical database startup error:', sqliteErr);
      isDbConnected = false;
      return false;
    }
  }
}
