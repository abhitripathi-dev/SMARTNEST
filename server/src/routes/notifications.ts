import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/notifications
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const userId = req.user?.id;

  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM notifications
       WHERE society_id = ? AND (user_id IS NULL OR user_id = ?)
       ORDER BY created_at DESC`,
      [societyId, userId || null]
    );
    // map is_read boolean to read
    const mapped = rows.map((r: any) => ({
      ...r,
      read: Boolean(r.is_read),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const { user_id, title, message, type = 'info', link } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    const notifId = req.body.id || genId('notif');
    await pool.query(
      `INSERT INTO notifications (id, society_id, user_id, title, message, type, is_read, link)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [notifId, societyId, user_id || null, title, message, type, link || null]
    );

    const [rows]: any = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
    res.status(201).json({ ...rows[0], read: Boolean(rows[0].is_read) });
  } catch (err: any) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Notification marked as read', id });
  } catch (err: any) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const userId = req.user?.id;

  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE society_id = ? AND (user_id IS NULL OR user_id = ?)',
      [societyId, userId || null]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
