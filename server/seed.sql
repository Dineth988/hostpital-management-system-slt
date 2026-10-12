-- ============================================================
-- HMS Database Schema + Seed Data
-- Run this in the Neon SQL Editor (once, on a fresh database)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role    AS ENUM ('ADMIN','DOCTOR','RECEPTIONIST','CASHIER');
  CREATE TYPE gender_type  AS ENUM ('M','F','OTHER');
  CREATE TYPE appt_status  AS ENUM ('SCHEDULED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW');
  CREATE TYPE bill_status  AS ENUM ('UNPAID','PARTIAL','PAID','VOID');
  CREATE TYPE pay_method   AS ENUM ('CASH','CARD','TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Sequences ────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS patient_seq  START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_seq  START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_seq  START 1;

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL,
  active          BOOLEAN DEFAULT TRUE,
  force_pw_change BOOLEAN DEFAULT TRUE,
  failed_attempts INT DEFAULT 0,
  doctor_id       UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Doctors ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  specialty    TEXT,
  consult_fee  NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  schedule     JSONB NOT NULL DEFAULT '{}',
  slot_minutes INT NOT NULL DEFAULT 15,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Doctor Leave ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_leave (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id  UUID REFERENCES doctors(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  reason     TEXT,
  UNIQUE(doctor_id, date)
);

-- ── Patients ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pid         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  dob         DATE NOT NULL,
  gender      gender_type NOT NULL,
  nic_masked  TEXT,
  nic_raw     TEXT,
  phone       TEXT NOT NULL,
  address_raw TEXT,
  active      BOOLEAN DEFAULT TRUE,
  guardian    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Appointments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(id),
  doctor_id     UUID REFERENCES doctors(id),
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  end_time      TIME NOT NULL,
  status        appt_status NOT NULL DEFAULT 'SCHEDULED',
  walk_in       BOOLEAN DEFAULT FALSE,
  reason        TEXT,
  cancel_reason TEXT,
  bill_id       UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bills ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no      TEXT UNIQUE NOT NULL,
  patient_id      UUID REFERENCES patients(id),
  appointment_id  UUID REFERENCES appointments(id),
  doctor_id       UUID REFERENCES doctors(id),
  line_items      JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) DEFAULT 0,
  discount_reason TEXT,
  total           NUMERIC(10,2) NOT NULL,
  amount_paid     NUMERIC(10,2) DEFAULT 0,
  status          bill_status NOT NULL DEFAULT 'UNPAID',
  void_reason     TEXT,
  refund_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  locked_at       TIMESTAMPTZ
);

-- ── Payments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id     UUID REFERENCES bills(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  method      pay_method NOT NULL,
  receipt_no  TEXT UNIQUE NOT NULL,
  paid_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  user_name  TEXT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  detail     TEXT,
  ts         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appt_date_doc ON appointments(date, doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_patient  ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_ts      ON audit_log(ts DESC);

-- ============================================================
-- SEED DATA
-- All users have password: pass123
-- bcrypt hash of 'pass123' with 10 rounds
-- ============================================================

-- Doctors (insert first so we can ref doctor_id in users)
INSERT INTO doctors(id, name, specialty, consult_fee, schedule, slot_minutes) VALUES
  ('d1000000-0000-0000-0000-000000000001'::uuid, 'Dr. Amal Silva',      'General Medicine', 1500.00,
   '{"MON":["09:00","17:00"],"TUE":["09:00","17:00"],"WED":["09:00","13:00"],"THU":["09:00","17:00"],"FRI":["09:00","17:00"]}', 15),
  ('d2000000-0000-0000-0000-000000000002'::uuid, 'Dr. Nimal Raj',       'Cardiology',       3000.00,
   '{"MON":["10:00","16:00"],"WED":["10:00","16:00"],"FRI":["10:00","16:00"]}', 15),
  ('d3000000-0000-0000-0000-000000000003'::uuid, 'Dr. Chamari Perera',  'Pediatrics',       2000.00,
   '{"TUE":["08:00","14:00"],"THU":["08:00","14:00"],"SAT":["08:00","12:00"]}', 15)
ON CONFLICT DO NOTHING;

-- Users (bcrypt hash of 'pass123')
INSERT INTO users(id, name, username, password_hash, role, force_pw_change, failed_attempts, doctor_id) VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'Priya Mendis',   'priya', '$2b$10$mJcnv1HAyEECy1SWSNj2TO47CFmUBAwUjHJFef0pnQEhGWaQjUvqO', 'RECEPTIONIST', false, 0, NULL),
  ('a2000000-0000-0000-0000-000000000002'::uuid, 'Dr. Amal Silva', 'amal',  '$2b$10$mJcnv1HAyEECy1SWSNj2TO47CFmUBAwUjHJFef0pnQEhGWaQjUvqO', 'DOCTOR',       false, 0, 'd1000000-0000-0000-0000-000000000001'::uuid),
  ('a3000000-0000-0000-0000-000000000003'::uuid, 'Kasun Perera',   'kasun', '$2b$10$mJcnv1HAyEECy1SWSNj2TO47CFmUBAwUjHJFef0pnQEhGWaQjUvqO', 'CASHIER',      false, 0, NULL),
  ('a4000000-0000-0000-0000-000000000004'::uuid, 'Admin User',     'admin', '$2b$10$mJcnv1HAyEECy1SWSNj2TO47CFmUBAwUjHJFef0pnQEhGWaQjUvqO', 'ADMIN',        false, 0, NULL),
  ('a5000000-0000-0000-0000-000000000005'::uuid, 'Dr. Nimal Raj',  'nimal', '$2b$10$mJcnv1HAyEECy1SWSNj2TO47CFmUBAwUjHJFef0pnQEhGWaQjUvqO', 'DOCTOR',       false, 0, 'd2000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT DO NOTHING;

-- Patients
INSERT INTO patients(pid, name, dob, gender, nic_masked, nic_raw, phone, address_raw, active, guardian) VALUES
  ('P-000001', 'Sanath Jayasuriya',   '1969-06-30', 'M', '6918****5V', '691823415V', '0771234567', '12 Lake Road, Colombo 3',      true, NULL),
  ('P-000002', 'Kumari Fernando',     '1985-03-14', 'F', '8507****2V', '850732142V', '0712345678', '45 Temple Street, Kandy',      true, NULL),
  ('P-000003', 'Ranil Wickrama',      '1949-11-24', 'M', '4932****8V', '493284548V', '0723456789', '78 Main Street, Galle',        true, NULL),
  ('P-000004', 'Sithumi Silva',       '2015-06-10', 'F', NULL,         NULL,         '0734567890', '23 Park Road, Negombo',        true, '{"name":"Nimal Silva","phone":"0771111222","relation":"Father"}'),
  ('P-000005', 'Asanka Gunawardena',  '1978-09-22', 'M', '7826****3V', '782643253V', '0745678901', '56 Hill Street, Nuwara Eliya', true, NULL),
  ('P-000006', 'Dilani Samarasinghe', '1992-12-01', 'F', '9233****4V', '923344224V', '0756789012', '90 Beach Road, Unawatuna',     false, NULL),
  ('P-000007', 'Chaminda Vaas',       '1974-08-27', 'M', '7423****7V', '742387457V', '0767890123', '34 River Road, Matara',        true, NULL)
ON CONFLICT DO NOTHING;

-- Advance patient sequence past seeded rows
SELECT setval('patient_seq', 12);

-- Audit log seed entries
INSERT INTO audit_log(user_id, user_name, action, entity, entity_id, detail) VALUES
  ('a4000000-0000-0000-0000-000000000004'::uuid, 'Admin User',   'PATIENT_CREATED',  'Patient', 'P-000007', 'Created patient P-000007'),
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'Priya Mendis', 'USER_LOGIN',       'User',    'a1000000-0000-0000-0000-000000000001', 'Logged in'),
  ('a3000000-0000-0000-0000-000000000003'::uuid, 'Kasun Perera', 'PAYMENT_RECORDED', 'Bill',    NULL, 'Seed payment entry')
ON CONFLICT DO NOTHING;
