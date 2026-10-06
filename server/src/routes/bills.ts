import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { memoryStore, saveMemoryStore } from '../memoryStore';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/bills
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [rows]: any = await pool.query(
      `SELECT b.*, f.flat_number, f.block, r.full_name as resident_name, r.phone as resident_phone
       FROM maintenance_bills b
       LEFT JOIN flats f ON f.id = b.flat_id
       LEFT JOIN residents r ON r.id = b.resident_id
       WHERE b.society_id = ?
       ORDER BY b.created_at DESC`,
      [societyId]
    );
    return res.json(rows);
  } catch (err: any) {
    const list = memoryStore.bills.filter((b) => b.society_id === societyId || !b.society_id);
    return res.json(list);
  }
});

// POST /api/bills
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.body.society_id || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  const {
    flat_id,
    resident_id,
    bill_period,
    amount,
    status = 'pending',
    due_date,
    paid_at,
  } = req.body;

  if (!flat_id || !bill_period || amount === undefined) {
    return res.status(400).json({ error: 'Flat ID, Bill Period, and Amount are required' });
  }

  const billId = req.body.id || genId('bill');

  try {
    await pool.query(
      `INSERT INTO maintenance_bills (id, society_id, flat_id, resident_id, bill_period, amount, status, due_date, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billId,
        societyId,
        flat_id,
        resident_id || null,
        bill_period,
        amount,
        status,
        due_date || null,
        paid_at || null,
      ]
    );

    const [rows]: any = await pool.query(
      `SELECT b.*, f.flat_number, r.full_name as resident_name
       FROM maintenance_bills b
       LEFT JOIN flats f ON f.id = b.flat_id
       LEFT JOIN residents r ON r.id = b.resident_id
       WHERE b.id = ?`,
      [billId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    const flat = memoryStore.flats.find((f) => f.id === flat_id);
    const resident = memoryStore.residents.find((r) => r.id === resident_id || r.flat_id === flat_id);
    const newBill = {
      id: billId,
      society_id: societyId,
      flat_id,
      resident_id: resident ? resident.id : (resident_id || null),
      bill_period,
      amount: Number(amount),
      status,
      due_date: due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paid_at: status === 'paid' ? (paid_at || new Date().toISOString()) : null,
      flat_number: flat ? flat.flat_number : '—',
      resident_name: resident ? resident.full_name : 'Resident',
      created_at: new Date().toISOString(),
    };
    memoryStore.bills.push(newBill);
    saveMemoryStore();
    res.status(201).json(newBill);
  }
});

// PATCH /api/bills/:id/pay
router.patch('/:id/pay', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      `UPDATE maintenance_bills
       SET status = 'paid', paid_at = ?
       WHERE id = ?`,
      [now, id]
    );

    const [rows]: any = await pool.query(
      `SELECT b.*, f.flat_number, r.full_name as resident_name
       FROM maintenance_bills b
       LEFT JOIN flats f ON f.id = b.flat_id
       LEFT JOIN residents r ON r.id = b.resident_id
       WHERE b.id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    const bill = memoryStore.bills.find((b) => b.id === id);
    if (bill) {
      bill.status = 'paid';
      bill.paid_at = new Date().toISOString();
      saveMemoryStore();
      return res.json(bill);
    }
    res.status(404).json({ error: 'Bill not found' });
  }
});

// DELETE /api/bills/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM maintenance_bills WHERE id = ?', [id]);
    res.json({ message: 'Bill deleted successfully', id });
  } catch (err: any) {
    memoryStore.bills = memoryStore.bills.filter((b) => b.id !== id);
    saveMemoryStore();
    res.json({ message: 'Bill deleted successfully', id });
  }
});

export default router;

