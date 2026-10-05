import { Router } from 'express';
import { pool } from '../db';
import { memoryStore, DEMO_SOCIETY_ID } from '../memoryStore';

const router = Router();

// GET /api/societies - List all societies
router.get('/', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT id, name, address, code, created_by, created_at FROM societies ORDER BY created_at DESC');
    if (rows && rows.length > 0) {
      return res.json(rows);
    }
  } catch {}

  res.json(memoryStore.societies);
});

// GET /api/societies/:codeOrId - Get society by code or ID
router.get('/:codeOrId', async (req, res) => {
  const param = req.params.codeOrId.trim();
  const upperParam = param.toUpperCase();
  const lowerParam = param.toLowerCase();

  try {
    const [rows]: any = await pool.query(
      'SELECT id, name, address, code, created_by, created_at FROM societies WHERE code = ? OR id = ? OR LOWER(name) LIKE ? LIMIT 1',
      [upperParam, param, `%${lowerParam}%`]
    );
    if (rows && rows.length > 0) {
      return res.json(rows[0]);
    }
  } catch {}

  const memFound = memoryStore.societies.find(
    (s) =>
      s.code?.toUpperCase() === upperParam ||
      s.id === param ||
      s.id.toLowerCase() === lowerParam ||
      s.name.toLowerCase().includes(lowerParam)
  );

  if (memFound) {
    return res.json(memFound);
  }

  res.status(404).json({ error: 'Society not found' });
});

export default router;
