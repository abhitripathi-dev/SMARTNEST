import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore, saveMemoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/visitors
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT v.*, f.flat_number, f.block
       FROM visitors v
       LEFT JOIN flats f ON f.id = v.flat_id
       WHERE v.society_id = ?
       ORDER BY v.entry_time DESC`,
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.visitors.filter((v) => v.society_id === societyId || !v.society_id);
    return res.json(list);
  }
});

// POST /api/visitors
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const {
    visitor_name,
    flat_id,
    flat_number,
    phone,
    purpose,
    photo_url,
    entry_time,
  } = req.body;

  if (!visitor_name) {
    return res.status(400).json({ error: 'Visitor name is required' });
  }

  const visId = req.body.id || genId('vis');

  try {
    let resolvedFlatId = flat_id;
    if (!resolvedFlatId && flat_number) {
      const [flats]: any = await pool.query(
        'SELECT id FROM flats WHERE flat_number = ? AND society_id = ? LIMIT 1',
        [flat_number, societyId]
      );
      if (flats && flats.length > 0) {
        resolvedFlatId = flats[0].id;
      }
    }

    const entryTimestamp = entry_time
      ? new Date(entry_time).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `INSERT INTO visitors (id, society_id, visitor_name, flat_id, phone, purpose, photo_url, entry_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visId,
        societyId,
        visitor_name,
        resolvedFlatId || null,
        phone || null,
        purpose || null,
        photo_url || null,
        entryTimestamp,
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT v.*, f.flat_number FROM visitors v LEFT JOIN flats f ON f.id = v.flat_id WHERE v.id = ?`,
      [visId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    const flat = memoryStore.flats.find((f) => f.id === flat_id || f.flat_number === flat_number);
    const newVis = {
      id: visId,
      society_id: societyId,
      visitor_name,
      flat_id: flat?.id || flat_id || null,
      phone: phone || null,
      purpose: purpose || 'Guest Visit',
      photo_url: photo_url || null,
      entry_time: entry_time || new Date().toISOString(),
      exit_time: null,
      flat_number: flat ? flat.flat_number : (flat_number || '—'),
      created_at: new Date().toISOString(),
    };
    memoryStore.visitors.push(newVis);
    saveMemoryStore();
    res.status(201).json(newVis);
  }
});

// PATCH /api/visitors/:id/exit
router.patch('/:id/exit', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const exitTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query('UPDATE visitors SET exit_time = ? WHERE id = ?', [exitTimestamp, id]);

    const [rows]: any = await pool.query(
      `SELECT v.*, f.flat_number FROM visitors v LEFT JOIN flats f ON f.id = v.flat_id WHERE v.id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Visitor record not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const vis = memoryStore.visitors.find((v) => v.id === id);
    if (vis) {
      vis.exit_time = new Date().toISOString();
      saveMemoryStore();
      return res.json(vis);
    }
    res.status(404).json({ error: 'Visitor record not found' });
  }
});

// DELETE /api/visitors/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM visitors WHERE id = ?', [id]);
    res.json({ message: 'Visitor record deleted successfully', id });
  } catch (err: any) {
    memoryStore.visitors = memoryStore.visitors.filter((v) => v.id !== id);
    saveMemoryStore();
    res.json({ message: 'Visitor record deleted successfully', id });
  }
});

export default router;

