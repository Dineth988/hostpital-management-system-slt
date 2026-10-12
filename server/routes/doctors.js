// routes/doctors.js
const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const ALL = ['ADMIN','RECEPTIONIST','DOCTOR','CASHIER'];

async function audit(pool, user, action, entityId, detail) {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,$3,'Doctor',$4,$5)`,
    [user.id, user.name, action, entityId, detail]
  ).catch(() => {});
}

// GET /api/v1/doctors
router.get('/', requireAuth, requireRole(...ALL), async (req, res) => {
  const { active } = req.query;
  try {
    let query = `SELECT d.*, COALESCE(json_agg(dl.*) FILTER (WHERE dl.id IS NOT NULL),'[]') AS leave_blocks
                 FROM doctors d LEFT JOIN doctor_leave dl ON dl.doctor_id=d.id`;
    const params = [];
    if (active !== undefined) { params.push(active === 'true'); query += ` WHERE d.active=$1`; }
    query += ` GROUP BY d.id ORDER BY d.name`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/doctors/:id
router.get('/:id', requireAuth, requireRole(...ALL), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, COALESCE(json_agg(dl.*) FILTER (WHERE dl.id IS NOT NULL),'[]') AS leave_blocks
       FROM doctors d LEFT JOIN doctor_leave dl ON dl.doctor_id=d.id
       WHERE d.id=$1 GROUP BY d.id`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Doctor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD
router.get('/:id/slots', requireAuth, requireRole(...ALL), async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date query param required' });
  try {
    const { rows } = await pool.query(
      `SELECT d.*, COALESCE(json_agg(dl.*) FILTER (WHERE dl.id IS NOT NULL),'[]') AS leave_blocks
       FROM doctors d LEFT JOIN doctor_leave dl ON dl.doctor_id=d.id
       WHERE d.id=$1 GROUP BY d.id`, [req.params.id]
    );
    const doc = rows[0];
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const dayName = dayNames[new Date(date + 'T12:00:00').getDay()];
    const hours = doc.schedule[dayName];
    if (!hours) return res.json({ slots: [], leaveDay: false });

    const onLeave = doc.leave_blocks.some(lb => lb.date === date || lb.date?.startsWith(date));
    if (onLeave) return res.json({ slots: [], leaveDay: true });

    const { rows: booked } = await pool.query(
      `SELECT to_char(time,'HH24:MI') AS time FROM appointments
       WHERE doctor_id=$1 AND date=$2 AND status NOT IN ('CANCELLED','NO_SHOW')`,
      [req.params.id, date]
    );
    const bookedTimes = booked.map(r => r.time);

    const [sh, sm] = hours[0].split(':').map(Number);
    const [eh, em] = hours[1].split(':').map(Number);
    const slots = [];
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + doc.slot_minutes <= end) {
      const t = `${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`;
      slots.push({ time: t, available: !bookedTimes.includes(t) });
      cur += doc.slot_minutes;
    }
    res.json({ slots, leaveDay: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/doctors
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { name, specialty, consultFee, schedule, slotMinutes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO doctors(name,specialty,consult_fee,schedule,slot_minutes)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [name, specialty, consultFee||1500, JSON.stringify(schedule||{}), slotMinutes||15]
    );
    await audit(pool, req.user, 'DOCTOR_CREATED', rows[0].id, `Created doctor ${name}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/v1/doctors/:id
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { name, specialty, consultFee, schedule, slotMinutes, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE doctors SET name=COALESCE($1,name), specialty=COALESCE($2,specialty),
       consult_fee=COALESCE($3,consult_fee), schedule=COALESCE($4,schedule),
       slot_minutes=COALESCE($5,slot_minutes), active=COALESCE($6,active)
       WHERE id=$7 RETURNING *`,
      [name,specialty,consultFee, schedule?JSON.stringify(schedule):null, slotMinutes, active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Doctor not found' });
    await audit(pool, req.user, 'DOCTOR_UPDATED', rows[0].id, `Updated doctor ${rows[0].name}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/doctors/:id/leave
router.post('/:id/leave', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const { date, reason } = req.body;
  try {
    await pool.query(
      `INSERT INTO doctor_leave(doctor_id,date,reason) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
      [req.params.id, date, reason]
    );
    await audit(pool, req.user, 'DOCTOR_LEAVE_ADDED', req.params.id, `Leave on ${date}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/doctors/:id/leave/:date
router.delete('/:id/leave/:date', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  try {
    await pool.query(`DELETE FROM doctor_leave WHERE doctor_id=$1 AND date=$2`, [req.params.id, req.params.date]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
