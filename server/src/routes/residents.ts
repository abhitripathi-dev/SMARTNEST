import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore, saveMemoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/residents
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT r.*, f.flat_number, f.block, f.floor
       FROM residents r
       LEFT JOIN flats f ON f.id = r.flat_id
       WHERE r.society_id = ?
       ORDER BY r.created_at DESC`,
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.residents.filter((r) => r.society_id === societyId || !r.society_id);
    return res.json(list);
  }
});

// GET /api/residents/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(
      `SELECT r.*, f.flat_number, f.block, f.floor
       FROM residents r
       LEFT JOIN flats f ON f.id = r.flat_id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const r = memoryStore.residents.find((x) => x.id === id);
    if (r) return res.json(r);
    res.status(404).json({ error: 'Resident not found' });
  }
});

// POST /api/residents
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const {
    flat_id,
    flat_number,
    full_name,
    phone,
    email,
    type = 'owner',
    status = 'active',
    avatar_color = 'blue',
    user_id = null,
  } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  const resId = req.body.id || genId('res');

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

    await pool.query(
      `INSERT INTO residents (id, society_id, flat_id, full_name, phone, email, type, status, avatar_color, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resId,
        societyId,
        resolvedFlatId || null,
        full_name,
        phone || null,
        email || null,
        type,
        status,
        avatar_color,
        user_id || null,
      ]
    );

    // If flat_id exists, mark flat as occupied
    if (resolvedFlatId && status === 'active') {
      await pool.query("UPDATE flats SET status = 'occupied' WHERE id = ?", [resolvedFlatId]);
    }

    const [rows]: any = await pool.query(
      `SELECT r.*, f.flat_number FROM residents r LEFT JOIN flats f ON f.id = r.flat_id WHERE r.id = ?`,
      [resId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    const flat = memoryStore.flats.find((f) => f.id === flat_id || f.flat_number === flat_number);
    const newRes = {
      id: resId,
      society_id: societyId,
      flat_id: flat?.id || flat_id || null,
      full_name,
      phone: phone || null,
      email: email || null,
      type,
      status,
      avatar_color,
      user_id: user_id || null,
      flat_number: flat ? flat.flat_number : (flat_number || null),
      created_at: new Date().toISOString(),
    };
    memoryStore.residents.push(newRes);
    if (flat) {
      flat.status = 'occupied';
      flat.resident_name = full_name;
    }
    saveMemoryStore();
    res.status(201).json(newRes);
  }
});

// PUT /api/residents/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    flat_id,
    full_name,
    phone,
    email,
    type,
    status,
    avatar_color,
  } = req.body;

  try {
    await pool.query(
      `UPDATE residents
       SET flat_id = COALESCE(?, flat_id),
           full_name = COALESCE(?, full_name),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           type = COALESCE(?, type),
           status = COALESCE(?, status),
           avatar_color = COALESCE(?, avatar_color)
       WHERE id = ?`,
      [flat_id, full_name, phone, email, type, status, avatar_color, id]
    );

    const [rows]: any = await pool.query(
      `SELECT r.*, f.flat_number FROM residents r LEFT JOIN flats f ON f.id = r.flat_id WHERE r.id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const idx = memoryStore.residents.findIndex((r) => r.id === id);
    if (idx !== -1) {
      memoryStore.residents[idx] = { ...memoryStore.residents[idx], ...req.body };
      saveMemoryStore();
      return res.json(memoryStore.residents[idx]);
    }
    res.status(404).json({ error: 'Resident not found' });
  }
});

// DELETE /api/residents/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM residents WHERE id = ?', [id]);
    const deletedResident = rows && rows.length > 0 ? rows[0] : null;

    await pool.query('DELETE FROM residents WHERE id = ?', [id]);
    res.json({
      message: 'Resident deleted successfully',
      id,
      deletedResident,
    });
  } catch (err: any) {
    memoryStore.residents = memoryStore.residents.filter((r) => r.id !== id);
    saveMemoryStore();
    res.json({ message: 'Resident deleted successfully', id });
  }
});

export default router;

