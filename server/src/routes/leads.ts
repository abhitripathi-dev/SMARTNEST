import { Router } from 'express';
import { pool } from '../db';
import { memoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM demo_leads ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err: any) {
    return res.json(memoryStore.leads);
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  const { name, mobile, society_name, city_name, units, role, interest } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: 'Name and mobile number are required' });
  }

  try {
    const leadId = req.body.id || genId('lead');
    await pool.query(
      `INSERT INTO demo_leads (id, name, mobile, society_name, city_name, units, role, interest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leadId,
        name,
        mobile,
        society_name || 'Not specified',
        city_name || 'Not specified',
        units || 'Not specified',
        role || 'Resident',
        interest || 'General Demo',
      ]
    );

    const [rows]: any = await pool.query('SELECT * FROM demo_leads WHERE id = ?', [leadId]);
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: 'Failed to record lead request' });
  }
});

export default router;
