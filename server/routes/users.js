// routes/users.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

async function audit(pool, user, action, entityId, detail) {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,$3,'User',$4,$5)`,
    [user.id, user.name, action, entityId, detail]
  ).catch(() => {});
}

// GET /api/v1/users
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,name,username,role,active,force_pw_change,failed_attempts,doctor_id,created_at FROM users ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/users
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { name, username, password, role, doctorId } = req.body;
  try {
    const { rows: existing } = await pool.query(`SELECT id FROM users WHERE username=$1`, [username]);
    if (existing[0]) return res.status(409).json({ message: 'Username already taken', fieldErrors: { username: 'Already exists' } });

    const hash = await bcrypt.hash(password || 'pass123', 10);
    const { rows } = await pool.query(
      `INSERT INTO users(name,username,password_hash,role,doctor_id,force_pw_change)
       VALUES($1,$2,$3,$4,$5,true) RETURNING id,name,username,role,active,force_pw_change,failed_attempts,doctor_id`,
      [name, username, hash, role, doctorId || null]
    );
    await audit(pool, req.user, 'USER_CREATED', rows[0].id, `Created user ${username}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/v1/users/:id
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { name, role, doctorId, active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET name=COALESCE($1,name), role=COALESCE($2,role),
       doctor_id=COALESCE($3,doctor_id), active=COALESCE($4,active)
       WHERE id=$5 RETURNING id,name,username,role,active,force_pw_change,failed_attempts,doctor_id`,
      [name, role, doctorId, active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    await audit(pool, req.user, 'USER_UPDATED', rows[0].id, `Updated user ${rows[0].username}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/users/:id/deactivate
router.patch('/:id/deactivate', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET active=false WHERE id=$1 RETURNING id,name,username,role,active,force_pw_change,failed_attempts`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    await audit(pool, req.user, 'USER_DEACTIVATED', rows[0].id, `Deactivated ${rows[0].username}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/users/:id/reset-password
router.patch('/:id/reset-password', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const hash = await bcrypt.hash('pass123', 10);
    const { rows } = await pool.query(
      `UPDATE users SET password_hash=$1, force_pw_change=true, failed_attempts=0 WHERE id=$2
       RETURNING id,name,username`,
      [hash, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    await audit(pool, req.user, 'USER_PASSWORD_RESET', rows[0].id, `Password reset for ${rows[0].username}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/users/:id/unlock
router.patch('/:id/unlock', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET failed_attempts=0 WHERE id=$1 RETURNING id,name,username`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    await audit(pool, req.user, 'USER_UNLOCKED', rows[0].id, `Unlocked ${rows[0].username}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
