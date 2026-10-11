import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const DB_URL = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.CLEARDB_DATABASE_URL || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'smartnest_root_pass';
const DB_NAME = process.env.DB_NAME || 'smartnest_db';
const DB_SSL = process.env.DB_SSL === 'true' || (DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1' && !DB_HOST.startsWith('192.168.'));

export let isDbConnected = false;
export const dbType = 'mysql';

let rawPool: mysql.Pool | null = null;

function createConnectionPool(): mysql.Pool {
  if (DB_URL) {
    const isCloud = DB_SSL || DB_URL.includes('tidbcloud.com') || DB_URL.includes('ssl') || DB_URL.includes('aivencloud.com');
    return mysql.createPool({
      uri: DB_URL,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      connectTimeout: 5000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    });
  }

  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    connectTimeout: 5000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = {
  query: async (sql: string, params: any[] = []): Promise<any> => {
    if (!rawPool) {
      throw new Error('[MySQL Error] Database connection pool is not initialized');
    }
    return rawPool.query(sql, params);
  },

  getConnection: async (): Promise<mysql.PoolConnection> => {
    if (!rawPool) {
      throw new Error('[MySQL Error] Database connection pool is not initialized');
    }
    return rawPool.getConnection();
  },

  end: async (): Promise<void> => {
    if (rawPool) {
      await rawPool.end();
      rawPool = null;
    }
  },
};

export async function queryDb(sql: string, params: any[] = []): Promise<any> {
  return pool.query(sql, params);
}

export async function initializeDatabase(): Promise<boolean> {
  const maxRetries = 5;
  const retryDelayMs = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!rawPool) {
        rawPool = createConnectionPool();
      }

      const conn = await rawPool.getConnection();
      console.log(`[MySQL] Connected successfully to database '${DB_NAME}' at ${DB_HOST}:${DB_PORT}`);
      isDbConnected = true;

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
              console.warn(`[MySQL Migration Note] ${stmtErr.message}`);
            }
          }
          console.log('[MySQL] Initial schema and seed data applied successfully!');
        }
      }

      // Ensure critical columns exist on MySQL tables
      const autoAlterColumns = [
        'ALTER TABLE users ADD COLUMN raw_password VARCHAR(255) NULL',
        'ALTER TABLE users ADD COLUMN society_id VARCHAR(36) NULL',
        'ALTER TABLE flats ADD COLUMN resident_name VARCHAR(255) NULL',
        'ALTER TABLE residents ADD COLUMN flat_number VARCHAR(50) NULL',
        'ALTER TABLE residents ADD COLUMN user_id VARCHAR(36) NULL',
      ];
      for (const alterSql of autoAlterColumns) {
        try {
          await conn.query(alterSql);
        } catch {}
      }

      conn.release();
      return true;
    } catch (err: any) {
      console.warn(`[MySQL Connection Attempt ${attempt}/${maxRetries} Failed] ${err.message || err}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  console.error(`[MySQL Error] Could not connect to MySQL server at ${DB_HOST}:${DB_PORT}. Please ensure MySQL is running.`);
  isDbConnected = false;
  return false;
}
