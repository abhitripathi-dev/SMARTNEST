import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/facilities
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM facilities WHERE society_id = ? ORDER BY name ASC',
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.facilities.filter((f) => f.society_id === societyId || !f.society_id);
    return res.json(list);
  }
});

// POST /api/facilities
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const { name, description, status = 'available', open_until } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Facility name is required' });
  }

  try {
    const facId = req.body.id || genId('fac');
    await pool.query(
      `INSERT INTO facilities (id, society_id, name, description, status, open_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [facId, societyId, name, description || null, status, open_until || '10:00 PM']
    );

    const [rows]: any = await pool.query('SELECT * FROM facilities WHERE id = ?', [facId]);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Create facility error:', err);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

// PUT /api/facilities/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, status, open_until } = req.body;

  try {
    await pool.query(
      `UPDATE facilities
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           open_until = COALESCE(?, open_until)
       WHERE id = ?`,
      [name, description, status, open_until, id]
    );

    const [rows]: any = await pool.query('SELECT * FROM facilities WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Update facility error:', err);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

// DELETE /api/facilities/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM facilities WHERE id = ?', [id]);
    res.json({ message: 'Facility deleted successfully', id });
  } catch (err: any) {
    console.error('Delete facility error:', err);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

// GET /api/facilities/bookings
router.get('/bookings/all', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT b.*, f.name as facility_name, r.full_name as resident_name, fl.flat_number
       FROM facility_bookings b
       JOIN facilities f ON f.id = b.facility_id
       LEFT JOIN residents r ON r.id = b.resident_id
       LEFT JOIN flats fl ON fl.id = b.flat_id
       WHERE b.society_id = ?
       ORDER BY b.booking_date DESC`,
      [societyId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/facilities/bookings
router.post('/bookings', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const {
    facility_id,
    resident_id,
    flat_id,
    booking_date,
    time_slot,
    status = 'confirmed',
  } = req.body;

  if (!facility_id || !booking_date) {
    return res.status(400).json({ error: 'Facility ID and Booking Date are required' });
  }

  try {
    const bookId = req.body.id || genId('book');
    await pool.query(
      `INSERT INTO facility_bookings (id, facility_id, society_id, resident_id, flat_id, booking_date, time_slot, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookId,
        facility_id,
        societyId,
        resident_id || null,
        flat_id || null,
        booking_date,
        time_slot || null,
        status,
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT b.*, f.name as facility_name
       FROM facility_bookings b
       JOIN facilities f ON f.id = b.facility_id
       WHERE b.id = ?`,
      [bookId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
