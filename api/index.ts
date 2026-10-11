import app from '../server/src/server';
import { initializeDatabase } from '../server/src/db';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initializeDatabase();
      initialized = true;
    } catch (err: any) {
      console.warn('[Vercel Serverless DB Init Note]', err?.message || err);
    }
  }
  return app(req, res);
}
