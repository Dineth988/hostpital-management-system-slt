// routes/audit.js
const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/v1/audit
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { userId, entity, dateFrom, dateTo, search } = req.query;
  try {
    let query = `SELECT * FROM audit_log WHERE 1=1`;
    const params = [];
    if (userId)   { params.push(userId);   query += ` AND user_id=$${params.length}`; }
    if (entity)   { params.push(entity);   query += ` AND entity=$${params.length}`; }
    if (dateFrom) { params.push(dateFrom); query += ` AND ts >= $${params.length}`; }
    if (dateTo)   { params.push(dateTo + 'T23:59:59Z'); query += ` AND ts <= $${params.length}`; }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(action) LIKE $${params.length} OR LOWER(detail) LIKE $${params.length} OR LOWER(user_name) LIKE $${params.length})`;
    }
    query += ` ORDER BY ts DESC LIMIT 200`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
