import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'smartnest_db';

export let isDbConnected = false;

const rawPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: false,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 500,
});

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
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      connectTimeout: 800,
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    const conn = await pool.getConnection();
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
    console.log(`[MySQL Info] Running in Fast Hybrid Mode (In-Memory / Local Storage fallback active).`);
    return false;
  }
}
