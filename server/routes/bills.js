// routes/bills.js
const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

async function audit(pool, user, action, entityId, detail) {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,$3,'Bill',$4,$5)`,
    [user.id, user.name, action, entityId, detail]
  ).catch(() => {});
}

// GET /api/v1/bills
router.get('/', requireAuth, requireRole('ADMIN','CASHIER','RECEPTIONIST','DOCTOR'), async (req, res) => {
  const { status, patientId } = req.query;
  try {
    let query = `SELECT * FROM bills WHERE 1=1`;
    const params = [];
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      params.push(statuses);
      query += ` AND status = ANY($${params.length}::bill_status[])`;
    }
    if (patientId) { params.push(patientId); query += ` AND patient_id=$${params.length}`; }
    query += ` ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/bills/:id
router.get('/:id', requireAuth, requireRole('ADMIN','CASHIER','RECEPTIONIST','DOCTOR'), async (req, res) => {
  try {
    const { rows: bills } = await pool.query(`SELECT * FROM bills WHERE id=$1`, [req.params.id]);
    if (!bills[0]) return res.status(404).json({ message: 'Bill not found' });
    const { rows: payments } = await pool.query(`SELECT * FROM payments WHERE bill_id=$1 ORDER BY paid_at`, [req.params.id]);
    res.json({ ...bills[0], payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/bills/:id/discount
router.post('/:id/discount', requireAuth, requireRole('ADMIN','CASHIER'), async (req, res) => {
  const { discount, reason } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM bills WHERE id=$1`, [req.params.id]);
    const bill = rows[0];
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'PAID') return res.status(400).json({ message: 'Bill is locked' });
    if (bill.status === 'VOID') return res.status(400).json({ message: 'Bill is voided' });
    if (!reason?.trim()) return res.status(400).json({ message: 'Discount reason required', fieldErrors: { discountReason: 'Required' } });
    if (discount < 0 || discount > bill.subtotal) return res.status(400).json({ message: 'Invalid discount amount' });
    const newTotal = Math.max(0, bill.subtotal - discount);
    const { rows: updated } = await pool.query(
      `UPDATE bills SET discount=$1, discount_reason=$2, total=$3 WHERE id=$4 RETURNING *`,
      [discount, reason, newTotal, req.params.id]
    );
    await audit(pool, req.user, 'DISCOUNT_APPLIED', req.params.id, `Discount LKR ${Number(discount).toFixed(2)} – ${reason}`);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/bills/:id/payment
router.post('/:id/payment', requireAuth, requireRole('ADMIN','CASHIER'), async (req, res) => {
  const { amount, method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM bills WHERE id=$1 FOR UPDATE`, [req.params.id]);
    const bill = rows[0];
    if (!bill) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Bill not found' }); }
    if (bill.status === 'PAID') { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Bill is already fully paid' }); }
    if (bill.status === 'VOID') { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Bill is voided' }); }
    if (amount <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Amount must be positive', fieldErrors: { amount: 'Must be > 0' } }); }
    const balance = Number(bill.total) - Number(bill.amount_paid);
    if (amount > balance + 0.01) { await client.query('ROLLBACK'); return res.status(400).json({ message: `Amount exceeds balance of LKR ${balance.toFixed(2)}` }); }

    const year = new Date().getFullYear();
    const { rows: rec } = await client.query(`SELECT nextval('receipt_seq') AS n`);
    const receiptNo = `RCP-${year}-${String(rec[0].n).padStart(6,'0')}`;
    const { rows: payment } = await client.query(
      `INSERT INTO payments(bill_id,amount,method,receipt_no) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.params.id, amount, method, receiptNo]
    );
    const newPaid = +(Number(bill.amount_paid) + amount).toFixed(2);
    const newStatus = newPaid >= Number(bill.total) - 0.01 ? 'PAID' : 'PARTIAL';
    const { rows: updatedBill } = await client.query(
      `UPDATE bills SET amount_paid=$1, status=$2, locked_at=$3 WHERE id=$4 RETURNING *`,
      [newPaid, newStatus, newStatus === 'PAID' ? new Date() : null, req.params.id]
    );
    await client.query('COMMIT');
    await audit(pool, req.user, 'PAYMENT_RECORDED', req.params.id, `Payment LKR ${Number(amount).toFixed(2)} ${method}`);
    res.json({ bill: updatedBill[0], payment: payment[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/v1/bills/:id/void
router.post('/:id/void', requireAuth, requireRole('ADMIN','CASHIER'), async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM bills WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Bill not found' });
    if (rows[0].status === 'PAID') return res.status(400).json({ message: 'Cannot void a paid bill' });
    if (!reason?.trim()) return res.status(400).json({ message: 'Void reason required', fieldErrors: { voidReason: 'Required' } });
    const { rows: updated } = await pool.query(
      `UPDATE bills SET status='VOID', void_reason=$1 WHERE id=$2 RETURNING *`, [reason, req.params.id]
    );
    await audit(pool, req.user, 'BILL_VOIDED', req.params.id, `Voided: ${reason}`);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/bills/:id/refund
router.post('/:id/refund', requireAuth, requireRole('ADMIN','CASHIER'), async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM bills WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Bill not found' });
    if (rows[0].status !== 'PAID') return res.status(400).json({ message: 'Can only refund paid bills' });
    if (!reason?.trim()) return res.status(400).json({ message: 'Refund reason required', fieldErrors: { refundReason: 'Required' } });
    const { rows: updated } = await pool.query(
      `UPDATE bills SET status='VOID', refund_reason=$1, locked_at=NULL WHERE id=$2 RETURNING *`, [reason, req.params.id]
    );
    await audit(pool, req.user, 'BILL_REFUNDED', req.params.id, `Refunded: ${reason}`);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
