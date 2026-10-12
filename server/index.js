// index.js — HMS Express Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/auth');
const patientRoutes     = require('./routes/patients');
const doctorRoutes      = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const billRoutes        = require('./routes/bills');
const userRoutes        = require('./routes/users');
const auditRoutes       = require('./routes/audit');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/patients',     patientRoutes);
app.use('/api/v1/doctors',      doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/bills',        billRoutes);
app.use('/api/v1/users',        userRoutes);
app.use('/api/v1/audit',        auditRoutes);

// ── 404 fallback ───────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HMS API running on http://localhost:${PORT}`);
});
