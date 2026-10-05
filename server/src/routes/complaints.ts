import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore } from '../memoryStore';

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

  try {
    const cmpId = req.body.id || genId('cmp');
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
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Failed to create complaint' });
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
    console.error('Update complaint status error:', err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ message: 'Complaint deleted successfully', id });
  } catch (err: any) {
    console.error('Delete complaint error:', err);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

export default router;
