// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name, doctorId: user.doctor_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE username = $1`, [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });
    if (!user.active) return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    if (user.failed_attempts >= 5)
      return res.status(423).json({ message: 'Account locked after 5 failed attempts. Contact admin.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const newAttempts = user.failed_attempts + 1;
      await pool.query(`UPDATE users SET failed_attempts=$1 WHERE id=$2`, [newAttempts, user.id]);
      if (newAttempts >= 5)
        return res.status(423).json({ message: 'Account locked after 5 failed attempts. Contact admin.' });
      return res.status(401).json({ message: `Invalid credentials. ${5 - newAttempts} attempt(s) remaining.` });
    }

    await pool.query(`UPDATE users SET failed_attempts=0 WHERE id=$1`, [user.id]);
    const token = signToken(user);

    // audit
    await pool.query(
      `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,'USER_LOGIN','User',$3,'Logged in')`,
      [user.id, user.name, user.id]
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, doctorId: user.doctor_id },
      forcePasswordChange: user.force_pw_change,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await pool.query(
    `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,'USER_LOGOUT','User',$3,'Logged out')`,
    [req.user.id, req.user.name, req.user.id]
  ).catch(() => {});
  res.json({ success: true });
});

// POST /api/v1/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
      return res.status(400).json({ message: 'Current password is incorrect', fieldErrors: { currentPassword: 'Incorrect' } });
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ message: 'Password too short', fieldErrors: { newPassword: 'Minimum 8 characters' } });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password_hash=$1, force_pw_change=false WHERE id=$2`, [hash, user.id]);
    await pool.query(
      `INSERT INTO audit_log(user_id,user_name,action,entity,entity_id,detail) VALUES($1,$2,'USER_PASSWORD_CHANGED','User',$3,'Changed password')`,
      [user.id, user.name, user.id]
    );
    const token = signToken({ ...user, force_pw_change: false });
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
