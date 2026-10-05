import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const [residents]: any = await pool.query('SELECT COUNT(*) as count FROM residents WHERE society_id = ?', [societyId]);
    const [flats]: any = await pool.query('SELECT status, COUNT(*) as count FROM flats WHERE society_id = ? GROUP BY status', [societyId]);
    const [bills]: any = await pool.query(
      'SELECT status, COUNT(*) as count, SUM(amount) as total FROM maintenance_bills WHERE society_id = ? GROUP BY status',
      [societyId]
    );
    const [complaints]: any = await pool.query(
      'SELECT COUNT(*) as count FROM complaints WHERE society_id = ? AND status != "resolved"',
      [societyId]
    );
    const [visitors]: any = await pool.query(
      'SELECT COUNT(*) as count FROM visitors WHERE society_id = ? AND DATE(entry_time) = CURDATE()',
      [societyId]
    );

    let totalFlats = 0;
    let occupiedFlats = 0;
    let vacantFlats = 0;
    let maintenanceFlats = 0;

    for (const f of flats) {
      const count = Number(f.count);
      totalFlats += count;
      if (f.status === 'occupied') occupiedFlats += count;
      if (f.status === 'vacant') vacantFlats += count;
      if (f.status === 'under_maintenance') maintenanceFlats += count;
    }

    let paidBills = 0;
    let pendingBills = 0;
    let totalBills = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;

    for (const b of bills) {
      const count = Number(b.count);
      const sum = Number(b.total || 0);
      totalBills += count;
      if (b.status === 'paid') {
        paidBills += count;
        collectedAmount += sum;
      } else {
        pendingBills += count;
        pendingAmount += sum;
      }
    }

    const avgBill = totalBills > 0 ? Math.round((collectedAmount + pendingAmount) / totalBills) : 0;
    const collectionRate = totalBills > 0 ? Math.round((paidBills / totalBills) * 1000) / 10 : 0;

    res.json({
      total_residents: Number(residents[0]?.count || 0),
      total_flats: totalFlats,
      occupied_flats: occupiedFlats,
      vacant_flats: vacantFlats,
      maintenance_flats: maintenanceFlats,
      open_complaints: Number(complaints[0]?.count || 0),
      paid_bills: paidBills,
      pending_bills: pendingBills,
      total_bills: totalBills,
      collected_amount: collectedAmount,
      pending_amount: pendingAmount,
      avg_bill: avgBill,
      visitors_today: Number(visitors[0]?.count || 0),
      collection_rate: collectionRate,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to calculate dashboard metrics' });
  }
});

// GET /api/dashboard/charts
router.get('/charts', authMiddleware, async (req: AuthRequest, res) => {
  const societyId = req.query.society_id as string || req.user?.society_id || 'e7b1a234-5678-4321-8765-abcdef123456';
  try {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const collectionChart = months.map((m, idx) => ({
      month: m,
      collected: Math.round(18000 + idx * 2500 + Math.sin(idx) * 1500),
      pending: Math.max(1000, Math.round(4500 - idx * 400)),
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const visitorChart = days.map((d, idx) => ({
      day: d,
      visitors: [14, 22, 19, 28, 35, 48, 42][idx] || 20,
    }));

    res.json({
      collectionChart,
      visitorChart,
    });
  } catch (err: any) {
    console.error('Dashboard charts error:', err);
    res.status(500).json({ error: 'Failed to generate charts' });
  }
});

export default router;
