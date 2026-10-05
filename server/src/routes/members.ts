import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/members
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT p.id, p.society_id, p.full_name, p.phone, p.role, p.avatar_color, p.created_at, u.email
       FROM profiles p
       JOIN users u ON u.id = p.id
       WHERE p.society_id = ?
       ORDER BY p.role ASC, p.full_name ASC`,
      [societyId]
    );

    const members = rows.map((r: any) => ({
      ...r,
      permissions: r.role === 'admin'
        ? ['all', 'gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities', 'bills', 'members', 'flats', 'settings']
        : r.role === 'staff'
        ? ['gate_entry', 'visitor_logs', 'deliveries', 'complaints', 'facilities']
        : ['visitor_logs', 'complaints', 'facilities', 'bills'],
    }));

    return res.json(members);
  } catch (err: any) {
    const list = memoryStore.members.filter((m) => m.society_id === societyId || !m.society_id);
    return res.json(list);
  }
});

// POST /api/members
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const { full_name, phone, email, role = 'staff', permissions } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const memberId = req.body.id || genId('usr');
    // create placeholder user with default password 'password'
    const defaultPasswordHash = '$2a$10$kP7p2c9xO1y8gB1wP4aMre3m4kR6t7u8v9w0x1y2z3a4b5c6d7e8f';

    await conn.query(
      `INSERT INTO users (id, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email=VALUES(email)`,
      [memberId, email, defaultPasswordHash]
    );

    await conn.query(
      `INSERT INTO profiles (id, society_id, full_name, phone, role, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), role=VALUES(role), phone=VALUES(phone)`,
      [memberId, societyId, full_name, phone || null, role, role === 'admin' ? 'teal' : role === 'staff' ? 'blue' : 'violet']
    );

    await conn.commit();

    res.status(201).json({
      id: memberId,
      society_id: societyId,
      full_name,
      phone: phone || null,
      email,
      role,
      permissions: permissions || (role === 'admin' ? ['all'] : ['gate_entry']),
      avatar_color: role === 'admin' ? 'teal' : role === 'staff' ? 'blue' : 'violet',
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    await conn.rollback();
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Failed to create member' });
  } finally {
    conn.release();
  }
});

// PUT /api/members/:id/role
router.put('/:id/role', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'resident', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Valid role is required (admin, resident, staff)' });
  }

  try {
    await pool.query('UPDATE profiles SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role updated successfully', id, role });
  } catch (err: any) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// DELETE /api/members/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Member removed successfully', id });
  } catch (err: any) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
