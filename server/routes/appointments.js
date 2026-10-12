// routes/appointments.js
const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const ALL = ['ADMIN','RECEPTIONIST','DOCTOR','CASHIER'];

async function audit(pool, user, action, entityId, detail) {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,$3,'Appointment',$4,$5)`,
    [user.id, user.name, action, entityId, detail]
  ).catch(() => {});
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

// GET /api/v1/appointments
router.get('/', requireAuth, requireRole(...ALL), async (req, res) => {
  const { date, doctorId, status, patientId } = req.query;
  try {
    let query = `SELECT * FROM appointments WHERE 1=1`;
    const params = [];
    if (date)      { params.push(date);      query += ` AND date=$${params.length}`; }
    if (doctorId)  { params.push(doctorId);  query += ` AND doctor_id=$${params.length}`; }
    if (patientId) { params.push(patientId); query += ` AND patient_id=$${params.length}`; }
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      params.push(statuses);
      query += ` AND status = ANY($${params.length}::appt_status[])`;
    }
    query += ` ORDER BY date, time`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/appointments/:id
router.get('/:id', requireAuth, requireRole(...ALL), async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM appointments WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Appointment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/appointments
router.post('/', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const { patientId, doctorId, date, time, walkIn, reason } = req.body;
  try {
    // 60-day window
    const apptDate = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.floor((apptDate - today) / 86400000);
    if (diff < 0) return res.status(400).json({ message: 'Cannot book in the past' });
    if (diff > 60) return res.status(400).json({ message: 'Cannot book more than 60 days ahead' });

    // slot conflict
    const { rows: conflict } = await pool.query(
      `SELECT id FROM appointments WHERE doctor_id=$1 AND date=$2 AND time=$3 AND status NOT IN ('CANCELLED','NO_SHOW')`,
      [doctorId, date, time]
    );
    if (conflict.length) return res.status(409).json({ message: 'Slot already booked' });

    const endTime = addMinutes(time, 15);
    const { rows } = await pool.query(
      `INSERT INTO appointments(patient_id,doctor_id,date,time,end_time,walk_in,reason)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [patientId, doctorId, date, time, endTime, walkIn||false, reason||null]
    );
    await audit(pool, req.user, 'APPOINTMENT_CREATED', rows[0].id, `Booked ${date} ${time}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/appointments/:id/checkin
router.patch('/:id/checkin', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT a.*, d.consult_fee FROM appointments a JOIN doctors d ON d.id=a.doctor_id WHERE a.id=$1`, [req.params.id]);
    const appt = rows[0];
    if (!appt) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Appointment not found' }); }
    if (appt.status !== 'SCHEDULED') { await client.query('ROLLBACK'); return res.status(400).json({ message: `Cannot check-in, status is ${appt.status}` }); }

    // Create bill
    const year = new Date().getFullYear();
    const { rows: inv } = await client.query(`SELECT nextval('invoice_seq') AS n`);
    const invoiceNo = `INV-${year}-${String(inv[0].n).padStart(6,'0')}`;
    const { rows: bill } = await client.query(
      `INSERT INTO bills(invoice_no,patient_id,appointment_id,doctor_id,line_items,subtotal,total)
       VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING *`,
      [invoiceNo, appt.patient_id, appt.id, appt.doctor_id,
       JSON.stringify([{ desc: 'Consultation Fee', amount: Number(appt.consult_fee) }]),
       appt.consult_fee]
    );
    // Update appointment
    const { rows: updated } = await client.query(
      `UPDATE appointments SET status='CHECKED_IN', bill_id=$1 WHERE id=$2 RETURNING *`,
      [bill[0].id, req.params.id]
    );
    await client.query('COMMIT');
    await audit(pool, req.user, 'APPOINTMENT_CHECKEDIN', req.params.id, `Checked in`);
    res.json({ appointment: updated[0], bill: bill[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/v1/appointments/:id/complete
router.patch('/:id/complete', requireAuth, requireRole('ADMIN','DOCTOR','RECEPTIONIST'), async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM appointments WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Appointment not found' });
    if (rows[0].status !== 'CHECKED_IN') return res.status(400).json({ message: 'Only checked-in appointments can be completed' });
    const { rows: updated } = await pool.query(`UPDATE appointments SET status='COMPLETED' WHERE id=$1 RETURNING *`, [req.params.id]);
    await audit(pool, req.user, 'APPOINTMENT_COMPLETED', req.params.id, `Marked complete`);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/appointments/:id/cancel
router.patch('/:id/cancel', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ message: 'Cancel reason is required', fieldErrors: { reason: 'Required' } });
  try {
    const { rows } = await pool.query(`SELECT * FROM appointments WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Appointment not found' });
    if (['COMPLETED','CANCELLED','NO_SHOW'].includes(rows[0].status))
      return res.status(400).json({ message: `Cannot cancel, status is ${rows[0].status}` });
    const { rows: updated } = await pool.query(
      `UPDATE appointments SET status='CANCELLED', cancel_reason=$1 WHERE id=$2 RETURNING *`, [reason, req.params.id]
    );
    await audit(pool, req.user, 'APPOINTMENT_CANCELLED', req.params.id, `Cancelled: ${reason}`);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/appointments/:id/noshow
router.patch('/:id/noshow', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM appointments WHERE id=$1`, [req.params.id]);
    const appt = rows[0];
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.status !== 'SCHEDULED') return res.status(400).json({ message: 'Can only mark no-show for Scheduled appointments' });
    const slotTime = new Date(`${appt.date.toISOString().slice(0,10)}T${String(appt.time).slice(0,5)}:00`);
    if (new Date() < slotTime) return res.status(400).json({ message: 'Cannot mark no-show before slot time' });
    const { rows: updated } = await pool.query(`UPDATE appointments SET status='NO_SHOW' WHERE id=$1 RETURNING *`, [req.params.id]);
    await audit(pool, req.user, 'APPOINTMENT_NOSHOW', req.params.id, `Marked no-show`);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
