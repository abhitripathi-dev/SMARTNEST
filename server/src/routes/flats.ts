import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore, saveMemoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/flats
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT f.*, r.full_name as resident_name, r.id as resident_id
       FROM flats f
       LEFT JOIN residents r ON r.flat_id = f.id AND r.status = 'active'
       WHERE f.society_id = ?
       ORDER BY f.flat_number ASC`,
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.flats.filter((f) => f.society_id === societyId || !f.society_id);
    return res.json(list);
  }
});

// POST /api/flats
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const { flat_number, block, floor, area, status = 'vacant' } = req.body;

  if (!flat_number) {
    return res.status(400).json({ error: 'Flat number is required' });
  }

  const flatId = req.body.id || genId('flat');

  try {
    await pool.query(
      `INSERT INTO flats (id, society_id, flat_number, block, floor, area, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [flatId, societyId, flat_number, block || null, floor || null, area || null, status]
    );

    const [rows]: any = await pool.query('SELECT * FROM flats WHERE id = ?', [flatId]);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    const newFlat = {
      id: flatId,
      society_id: societyId,
      flat_number,
      block: block || 'A Wing',
      floor: floor || '1st Floor',
      area: area || '1,250 sq ft',
      status,
      resident_name: null,
      created_at: new Date().toISOString(),
    };
    memoryStore.flats.push(newFlat);
    saveMemoryStore();
    res.status(201).json(newFlat);
  }
});

// PUT /api/flats/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { flat_number, block, floor, area, status } = req.body;

  try {
    await pool.query(
      `UPDATE flats
       SET flat_number = COALESCE(?, flat_number),
           block = COALESCE(?, block),
           floor = COALESCE(?, floor),
           area = COALESCE(?, area),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [flat_number, block, floor, area, status, id]
    );

    const [rows]: any = await pool.query('SELECT * FROM flats WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Flat not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const idx = memoryStore.flats.findIndex((f) => f.id === id);
    if (idx !== -1) {
      memoryStore.flats[idx] = { ...memoryStore.flats[idx], ...req.body };
      saveMemoryStore();
      return res.json(memoryStore.flats[idx]);
    }
    res.status(404).json({ error: 'Flat not found' });
  }
});

// DELETE /api/flats/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM flats WHERE id = ?', [id]);
    res.json({ message: 'Flat deleted successfully', id });
  } catch (err: any) {
    memoryStore.flats = memoryStore.flats.filter((f) => f.id !== id);
    saveMemoryStore();
    res.json({ message: 'Flat deleted successfully', id });
  }
});

export default router;

