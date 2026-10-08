import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore, saveMemoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/complaints
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT c.*, r.full_name as resident_name, r.phone as resident_phone, f.flat_number
       FROM complaints c
       LEFT JOIN residents r ON r.id = c.resident_id
       LEFT JOIN flats f ON f.id = c.flat_id
       WHERE c.society_id = ?
       ORDER BY c.created_at DESC`,
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.complaints.filter((c) => c.society_id === societyId || !c.society_id);
    return res.json(list);
  }
});

// POST /api/complaints
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const { resident_id, flat_id, title, description, priority = 'medium', status = 'open' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const cmpId = req.body.id || genId('cmp');

  try {
    await pool.query(
      `INSERT INTO complaints (id, society_id, resident_id, flat_id, title, description, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cmpId,
        societyId,
        resident_id || null,
        flat_id || null,
        title,
        description || null,
        priority,
        status,
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT c.*, r.full_name as resident_name, f.flat_number
       FROM complaints c
       LEFT JOIN residents r ON r.id = c.resident_id
       LEFT JOIN flats f ON f.id = c.flat_id
       WHERE c.id = ?`,
      [cmpId]
    );
    const saved = rows && rows.length > 0 ? rows[0] : {
      id: cmpId,
      society_id: societyId,
      resident_id: resident_id || null,
      flat_id: flat_id || null,
      title,
      description: description || null,
      priority,
      status,
      created_at: new Date().toISOString(),
      resolved_at: null,
      flat_number: 'General',
      resident_name: 'Society Resident',
    };
    const memIdx = memoryStore.complaints.findIndex((c) => c.id === cmpId);
    if (memIdx >= 0) {
      memoryStore.complaints[memIdx] = saved;
    } else {
      memoryStore.complaints.unshift(saved);
    }
    saveMemoryStore();
    res.status(201).json(saved);
  } catch (err: any) {
    const flat = memoryStore.flats.find((f) => f.id === flat_id);
    const resident = memoryStore.residents.find((r) => r.id === resident_id);
    const newCmp = {
      id: cmpId,
      society_id: societyId,
      resident_id: resident_id || null,
      flat_id: flat_id || null,
      title,
      description: description || null,
      priority,
      status,
      created_at: new Date().toISOString(),
      resolved_at: null,
      flat_number: flat ? flat.flat_number : 'General',
      resident_name: resident ? resident.full_name : 'Society Resident',
    };
    memoryStore.complaints.unshift(newCmp);
    saveMemoryStore();
    res.status(201).json(newCmp);
  }
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const resolvedAt = status === 'resolved' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
    await pool.query(
      `UPDATE complaints
       SET status = ?, resolved_at = ?
       WHERE id = ?`,
      [status, resolvedAt, id]
    );

    const [rows]: any = await pool.query(
      `SELECT c.*, r.full_name as resident_name, f.flat_number
       FROM complaints c
       LEFT JOIN residents r ON r.id = c.resident_id
       LEFT JOIN flats f ON f.id = c.flat_id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const cmp = memoryStore.complaints.find((c) => c.id === id);
    if (cmp) {
      cmp.status = status;
      cmp.resolved_at = status === 'resolved' ? new Date().toISOString() : null;
      saveMemoryStore();
      return res.json(cmp);
    }
    res.status(404).json({ error: 'Complaint not found' });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ message: 'Complaint deleted successfully', id });
  } catch (err: any) {
    memoryStore.complaints = memoryStore.complaints.filter((c) => c.id !== id);
    saveMemoryStore();
    res.json({ message: 'Complaint deleted successfully', id });
  }
});

export default router;

