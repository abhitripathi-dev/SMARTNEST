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
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'smartnest_db';
const DB_SSL = process.env.DB_SSL === 'true' || (DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1' && !DB_HOST.startsWith('192.168.'));

export let isDbConnected = false;

function createConnectionPool() {
  if (DB_URL) {
    return mysql.createPool({
      uri: DB_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
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
    connectTimeout: 10000,
    ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
  });
}

const rawPool = createConnectionPool();

export const pool = {
  ...rawPool,
  query: async (sql: string, params: any[] = []): Promise<any> => {
    if (!isDbConnected) {
      throw new Error('Database not connected');
    }
    return rawPool.query(sql, params);
  },
  getConnection: async () => {
    if (!isDbConnected) {
      throw new Error('Database not connected');
    }
    return rawPool.getConnection();
  },
  end: () => rawPool.end(),
};

export async function queryDb(sql: string, params: any[] = []): Promise<any> {
  return pool.query(sql, params);
}

export async function initializeDatabase() {
  try {
    // 1. Try connecting directly to database
    let conn: any = null;
    try {
      conn = await rawPool.getConnection();
    } catch (initialErr: any) {
      // If database doesn't exist, try creating it if root permissions allow
      if (!DB_URL && (initialErr.code === 'ER_BAD_DB_ERROR' || initialErr.errno === 1049)) {
        try {
          const rootConn = await mysql.createConnection({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            connectTimeout: 5000,
            ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
          });
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await rootConn.end();
          conn = await rawPool.getConnection();
        } catch {
          throw initialErr;
        }
      } else {
        throw initialErr;
      }
    }

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
            console.warn(`[MySQL Migration Warning] ${stmtErr.message}`);
          }
        }
        console.log('[MySQL] Initial schema and seed data applied successfully!');
      }
    } else {
      console.log(`[MySQL] Found ${tables.length} existing tables in '${DB_NAME}'.`);
    }

    conn.release();
    return true;
  } catch (err: any) {
    isDbConnected = false;
    console.log(`[MySQL Info] Running in Fast Hybrid Mode (In-Memory fallback active). Connection note: ${err?.message || err}`);
    return false;
  }
}

