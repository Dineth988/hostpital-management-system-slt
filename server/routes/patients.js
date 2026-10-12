// routes/patients.js
const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const ALL = ['ADMIN','RECEPTIONIST','DOCTOR','CASHIER'];

// Helper: mask NIC / address
function maskNic(nic) { return nic ? nic.slice(0,4) + '****' + nic.slice(-2) : null; }

async function audit(pool, user, action, entityId, detail) {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,$3,'Patient',$4,$5)`,
    [user.id, user.name, action, entityId, detail]
  ).catch(() => {});
}

// GET /api/v1/patients
router.get('/', requireAuth, requireRole(...ALL), async (req, res) => {
  const { search = '', active } = req.query;
  try {
    let query = `SELECT * FROM patients WHERE 1=1`;
    const params = [];
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR phone LIKE $${params.length} OR LOWER(pid) LIKE $${params.length} OR LOWER(nic_raw) LIKE $${params.length})`;
    }
    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND active = $${params.length}`;
    }
    query += ` ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows.map(p => ({ ...p, address: p.active ? '***** masked *****' : p.address_raw })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/patients/:id
router.get('/:id', requireAuth, requireRole(...ALL), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM patients WHERE id=$1 OR pid=$1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/patients
router.post('/', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const { name, dob, gender, nic, phone, address, guardian } = req.body;
  try {
    // duplicate NIC check
    if (nic) {
      const { rows } = await pool.query(`SELECT pid,name FROM patients WHERE nic_raw=$1 AND active=true`, [nic]);
      if (rows[0]) return res.status(409).json({ message: `NIC already registered to ${rows[0].name} (${rows[0].pid})` });
    }
    // generate PID
    const { rows: seqRows } = await pool.query(`SELECT nextval('patient_seq') AS n`);
    const pid = `P-${String(seqRows[0].n).padStart(6,'0')}`;

    const { rows } = await pool.query(
      `INSERT INTO patients(pid,name,dob,gender,nic_masked,nic_raw,phone,address_raw,guardian)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [pid, name, dob, gender, maskNic(nic), nic||null, phone, address||null, guardian ? JSON.stringify(guardian) : null]
    );
    await audit(pool, req.user, 'PATIENT_CREATED', rows[0].id, `Created patient ${pid}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/v1/patients/:id
router.put('/:id', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  const { name, dob, gender, nic, phone, address, guardian } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE patients SET name=COALESCE($1,name), dob=COALESCE($2,dob), gender=COALESCE($3,gender),
       nic_masked=COALESCE($4,nic_masked), nic_raw=COALESCE($5,nic_raw),
       phone=COALESCE($6,phone), address_raw=COALESCE($7,address_raw),
       guardian=COALESCE($8,guardian)
       WHERE id=$9 RETURNING *`,
      [name,dob,gender, nic?maskNic(nic):undefined, nic||undefined, phone, address||undefined,
       guardian?JSON.stringify(guardian):undefined, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Patient not found' });
    await audit(pool, req.user, 'PATIENT_UPDATED', rows[0].id, `Updated patient ${rows[0].pid}`);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/patients/:id/deactivate
router.patch('/:id/deactivate', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE patients SET active=false WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Patient not found' });
    await audit(pool, req.user, 'PATIENT_DEACTIVATED', rows[0].id, `Deactivated ${rows[0].pid}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/patients/:id/reactivate
router.patch('/:id/reactivate', requireAuth, requireRole('ADMIN','RECEPTIONIST'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE patients SET active=true WHERE id=$1 RETURNING *`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Patient not found' });
    await audit(pool, req.user, 'PATIENT_REACTIVATED', rows[0].id, `Reactivated ${rows[0].pid}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
