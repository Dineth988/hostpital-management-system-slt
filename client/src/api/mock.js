// ============================================================
// MOCK DATA STORE Ã¢â¬“ mirrors /api/v1 REST API
// Replace this entire file with real fetch() calls later.
// ============================================================

// Ã¢”â¬Ã¢”â¬ helpers Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
let _nextId = 100;
const newId = () => String(++_nextId);
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();

// Standard error format (mirrors server)
const apiError = (status, message, fieldErrors = {}) => {
  const err = new Error(message);
  err.status = status;
  err.fieldErrors = fieldErrors;
  throw err;
};

// Ã¢”â¬Ã¢”â¬ seed data Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
export const ROLES = { RECEPTIONIST: 'RECEPTIONIST', DOCTOR: 'DOCTOR', CASHIER: 'CASHIER', ADMIN: 'ADMIN' };

let _users = [
  { id: 'u1', name: 'Priya Mendis',   username: 'priya',  role: ROLES.RECEPTIONIST, active: true, forcePasswordChange: false, failedAttempts: 0 },
  { id: 'u2', name: 'Dr. Amal Silva', username: 'amal',   role: ROLES.DOCTOR,       active: true, forcePasswordChange: false, failedAttempts: 0, doctorId: 'd1' },
  { id: 'u3', name: 'Kasun Perera',   username: 'kasun',  role: ROLES.CASHIER,      active: true, forcePasswordChange: false, failedAttempts: 0 },
  { id: 'u4', name: 'Admin User',     username: 'admin',  role: ROLES.ADMIN,        active: true, forcePasswordChange: false, failedAttempts: 0 },
  { id: 'u5', name: 'Dr. Nimal Raj',  username: 'nimal',  role: ROLES.DOCTOR,       active: true, forcePasswordChange: false, failedAttempts: 0, doctorId: 'd2' },
];

// passwords (plain text for mock): all "pass123"
const _passwords = { priya: 'pass123', amal: 'pass123', kasun: 'pass123', admin: 'pass123', nimal: 'pass123' };

let _doctors = [
  { id: 'd1', name: 'Dr. Amal Silva',      specialty: 'General Medicine', consultFee: 1500.00, active: true,
    schedule: { MON: ['09:00','17:00'], TUE: ['09:00','17:00'], WED: ['09:00','13:00'], THU: ['09:00','17:00'], FRI: ['09:00','17:00'] },
    slotMinutes: 15, leaveBlocks: [] },
  { id: 'd2', name: 'Dr. Nimal Raj',       specialty: 'Cardiology',       consultFee: 3000.00, active: true,
    schedule: { MON: ['10:00','16:00'], WED: ['10:00','16:00'], FRI: ['10:00','16:00'] },
    slotMinutes: 15, leaveBlocks: [{ date: todayStr(1), reason: 'Conference' }] },
  { id: 'd3', name: 'Dr. Chamari Perera', specialty: 'Pediatrics',        consultFee: 2000.00, active: true,
    schedule: { TUE: ['08:00','14:00'], THU: ['08:00','14:00'], SAT: ['08:00','12:00'] },
    slotMinutes: 15, leaveBlocks: [] },
];

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function todayTime(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function formatPid(n) { return `P-${String(n).padStart(6, '0')}`; }
let _pidCounter = 12;

let _patients = [
  { id: 'p1',  pid: 'P-000001', name: 'Sanath Jayasuriya', dob: '1969-06-30', gender: 'M', nic: '6918****5V',   nicRaw: '691823415V', phone: '0771234567', address: '***** masked *****', addressRaw: '12 Lake Road, Colombo 3', active: true, guardian: null, createdAt: '2024-01-10T08:00:00Z' },
  { id: 'p2',  pid: 'P-000002', name: 'Kumari Fernando',   dob: '1985-03-14', gender: 'F', nic: '8507****2V',   nicRaw: '850732142V', phone: '0712345678', address: '***** masked *****', addressRaw: '45 Temple Street, Kandy', active: true, guardian: null, createdAt: '2024-02-01T09:00:00Z' },
  { id: 'p3',  pid: 'P-000003', name: 'Ranil Wickrama',    dob: '1949-11-24', gender: 'M', nic: '4932****8V',   nicRaw: '493284548V', phone: '0723456789', address: '***** masked *****', addressRaw: '78 Main Street, Galle', active: true, guardian: null, createdAt: '2024-02-15T10:00:00Z' },
  { id: 'p4',  pid: 'P-000004', name: 'Sithumi Silva',     dob: '2015-06-10', gender: 'F', nic: null,            nicRaw: null,         phone: '0734567890', address: '***** masked *****', addressRaw: '23 Park Road, Negombo', active: true, guardian: { name: 'Nimal Silva', phone: '0771111222', relation: 'Father' }, createdAt: '2024-03-05T11:00:00Z' },
  { id: 'p5',  pid: 'P-000005', name: 'Asanka Gunawardena',dob: '1978-09-22', gender: 'M', nic: '7826****3V',   nicRaw: '782643253V', phone: '0745678901', address: '***** masked *****', addressRaw: '56 Hill Street, Nuwara Eliya', active: true, guardian: null, createdAt: '2024-03-20T12:00:00Z' },
  { id: 'p6',  pid: 'P-000006', name: 'Dilani Samarasinghe',dob:'1992-12-01',gender: 'F', nic: '9233****4V',   nicRaw: '923344224V', phone: '0756789012', address: '***** masked *****', addressRaw: '90 Beach Road, Unawatuna', active: false, guardian: null, createdAt: '2024-04-01T08:30:00Z' },
  { id: 'p7',  pid: 'P-000007', name: 'Chaminda Vaas',     dob: '1974-08-27', gender: 'M', nic: '7423****7V',   nicRaw: '742387457V', phone: '0767890123', address: '***** masked *****', addressRaw: '34 River Road, Matara', active: true, guardian: null, createdAt: '2024-04-15T09:45:00Z' },
];

let _appointments = [
  { id: 'a1', patientId: 'p1', doctorId: 'd1', date: todayStr(), time: '09:00', endTime: '09:15', status: 'SCHEDULED',  walkIn: false, reason: 'Follow-up', cancelReason: null, createdAt: now(), billId: null },
  { id: 'a2', patientId: 'p2', doctorId: 'd1', date: todayStr(), time: '09:15', endTime: '09:30', status: 'CHECKED_IN', walkIn: false, reason: 'Headache',  cancelReason: null, createdAt: now(), billId: 'b1' },
  { id: 'a3', patientId: 'p3', doctorId: 'd1', date: todayStr(), time: '09:30', endTime: '09:45', status: 'COMPLETED',  walkIn: false, reason: 'Diabetes checkup', cancelReason: null, createdAt: now(), billId: 'b2' },
  { id: 'a4', patientId: 'p4', doctorId: 'd2', date: todayStr(), time: '10:00', endTime: '10:15', status: 'SCHEDULED',  walkIn: true,  reason: 'Walk-in', cancelReason: null, createdAt: now(), billId: null },
  { id: 'a5', patientId: 'p5', doctorId: 'd2', date: todayStr(), time: '10:15', endTime: '10:30', status: 'CANCELLED',  walkIn: false, reason: 'Checkup', cancelReason: 'Patient cancelled', createdAt: now(), billId: null },
  { id: 'a6', patientId: 'p7', doctorId: 'd1', date: todayStr(), time: '10:00', endTime: '10:15', status: 'NO_SHOW',    walkIn: false, reason: 'Cold', cancelReason: null, createdAt: now(), billId: null },
  { id: 'a7', patientId: 'p1', doctorId: 'd1', date: todayStr(), time: '11:00', endTime: '11:15', status: 'SCHEDULED',  walkIn: false, reason: 'Annual checkup', cancelReason: null, createdAt: now(), billId: null },
  { id: 'a8', patientId: 'p2', doctorId: 'd3', date: todayStr(1), time: '08:00', endTime: '08:15', status: 'SCHEDULED', walkIn: false, reason: 'Vaccination', cancelReason: null, createdAt: now(), billId: null },
];

let _bills = [
  { id: 'b1', invoiceNo: 'INV-2024-000001', patientId: 'p2', appointmentId: 'a2', doctorId: 'd1',
    lineItems: [{ desc: 'Consultation Fee', amount: 1500.00 }],
    subtotal: 1500.00, discount: 0, discountReason: null, total: 1500.00,
    payments: [{ id: 'pay1', amount: 1500.00, method: 'CASH', paidAt: now(), receiptNo: 'RCP-2024-000001' }],
    amountPaid: 1500.00, status: 'PAID', voidReason: null, refundReason: null,
    createdAt: now(), lockedAt: now() },
  { id: 'b2', invoiceNo: 'INV-2024-000002', patientId: 'p3', appointmentId: 'a3', doctorId: 'd1',
    lineItems: [{ desc: 'Consultation Fee', amount: 1500.00 }, { desc: 'Blood Test', amount: 500.00 }],
    subtotal: 2000.00, discount: 200, discountReason: 'Senior citizen discount', total: 1800.00,
    payments: [{ id: 'pay2', amount: 1000.00, method: 'CASH', paidAt: now(), receiptNo: 'RCP-2024-000002' }],
    amountPaid: 1000.00, status: 'PARTIAL', voidReason: null, refundReason: null,
    createdAt: now(), lockedAt: null },
];

let _auditLog = [
  { id: 'au1', userId: 'u4', userName: 'Admin User', action: 'PATIENT_CREATED', entity: 'Patient', entityId: 'p7', detail: 'Created patient P-000007', ts: now() },
  { id: 'au2', userId: 'u1', userName: 'Priya Mendis', action: 'APPOINTMENT_CREATED', entity: 'Appointment', entityId: 'a1', detail: 'Booked appointment a1', ts: now() },
  { id: 'au3', userId: 'u3', userName: 'Kasun Perera', action: 'PAYMENT_RECORDED', entity: 'Bill', entityId: 'b1', detail: 'Payment LKR 1,500.00 CASH', ts: now() },
  { id: 'au4', userId: 'u4', userName: 'Admin User', action: 'DISCOUNT_APPLIED', entity: 'Bill', entityId: 'b2', detail: 'Discount LKR 200.00 Ã¢â¬“ Senior citizen discount', ts: now() },
];

// Ã¢”â¬Ã¢”â¬ auth Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
let _sessionUser = null;

export const auth = {
  async login(username, password) {
    await delay(600);
    const user = _users.find(u => u.username === username);
    if (!user) apiError(401, 'Invalid username or password');
    if (!user.active) apiError(403, 'Account is deactivated. Contact admin.');
    if (user.failedAttempts >= 5) apiError(423, 'Account locked after 5 failed attempts. Contact admin.');
    if (_passwords[username] !== password) {
      user.failedAttempts++;
      if (user.failedAttempts >= 5) apiError(423, 'Account locked after 5 failed attempts. Contact admin.');
      apiError(401, `Invalid credentials. ${5 - user.failedAttempts} attempt(s) remaining.`);
    }
    user.failedAttempts = 0;
    _sessionUser = { ...user };
    return { user: _sessionUser, forcePasswordChange: user.forcePasswordChange };
  },
  async logout() {
    await delay(100);
    _sessionUser = null;
  },
  async changePassword(userId, currentPw, newPw) {
    await delay(400);
    const user = _users.find(u => u.id === userId);
    if (!user) apiError(404, 'User not found');
    if (_passwords[user.username] !== currentPw) apiError(400, 'Current password is incorrect', { currentPassword: 'Incorrect' });
    if (newPw.length < 8) apiError(400, 'Password too short', { newPassword: 'Minimum 8 characters' });
    _passwords[user.username] = newPw;
    user.forcePasswordChange = false;
    _sessionUser = { ...user };
    return { success: true };
  },
  getSession() { return _sessionUser; },
};

// Ã¢”â¬Ã¢”â¬ patients /api/v1/patients Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
export const patients = {
  async list({ search = '', active } = {}) {
    await delay(300);
    let results = [..._patients];
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.pid.toLowerCase().includes(q) ||
        (p.nicRaw && p.nicRaw.toLowerCase().includes(q))
      );
    }
    if (active !== undefined) results = results.filter(p => p.active === active);
    return results;
  },
  async get(id) {
    await delay(200);
    const p = _patients.find(p => p.id === id || p.pid === id);
    if (!p) apiError(404, 'Patient not found');
    return { ...p };
  },
  async create(data) {
    await delay(500);
    // duplicate NIC check
    if (data.nic) {
      const dupe = _patients.find(p => p.nicRaw === data.nic && p.active);
      if (dupe) apiError(409, `NIC already registered to ${dupe.name} (${dupe.pid})`);
    }
    _pidCounter++;
    const pid = formatPid(_pidCounter);
    const newPatient = {
      id: 'p' + newId(),
      pid,
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      nic: data.nic ? data.nic.slice(0, 4) + '****' + data.nic.slice(-2) : null,
      nicRaw: data.nic || null,
      phone: data.phone,
      address: '***** masked *****',
      addressRaw: data.address,
      active: true,
      guardian: data.guardian || null,
      createdAt: now(),
    };
    _patients.push(newPatient);
    _addAudit('PATIENT_CREATED', 'Patient', newPatient.id, `Created patient ${pid}`);
    return newPatient;
  },
  async update(id, data) {
    await delay(400);
    const idx = _patients.findIndex(p => p.id === id);
    if (idx === -1) apiError(404, 'Patient not found');
    const updated = { ..._patients[idx], ...data };
    if (data.nic) {
      updated.nicRaw = data.nic;
      updated.nic = data.nic.slice(0, 4) + '****' + data.nic.slice(-2);
    }
    if (data.address) {
      updated.addressRaw = data.address;
      updated.address = '***** masked *****';
    }
    _patients[idx] = updated;
    _addAudit('PATIENT_UPDATED', 'Patient', id, `Updated patient ${updated.pid}`);
    return updated;
  },
  async deactivate(id) {
    await delay(300);
    const p = _patients.find(p => p.id === id);
    if (!p) apiError(404, 'Patient not found');
    p.active = false;
    _addAudit('PATIENT_DEACTIVATED', 'Patient', id, `Deactivated patient ${p.pid}`);
    return p;
  },
  async reactivate(id) {
    await delay(300);
    const p = _patients.find(p => p.id === id);
    if (!p) apiError(404, 'Patient not found');
    p.active = true;
    _addAudit('PATIENT_REACTIVATED', 'Patient', id, `Reactivated patient ${p.pid}`);
    return p;
  },
};

// Ã¢”â¬Ã¢”â¬ doctors /api/v1/doctors Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
export const doctors = {
  async list({ active } = {}) {
    await delay(200);
    let results = [..._doctors];
    if (active !== undefined) results = results.filter(d => d.active === active);
    return results;
  },
  async get(id) {
    await delay(200);
    const d = _doctors.find(d => d.id === id);
    if (!d) apiError(404, 'Doctor not found');
    return { ...d };
  },
  async slots(doctorId, date) {
    await delay(300);
    const doc = _doctors.find(d => d.id === doctorId);
    if (!doc) apiError(404, 'Doctor not found');
    const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date(date + 'T12:00:00').getDay()];
    const hours = doc.schedule[dayName];
    if (!hours) return { slots: [], leaveDay: false };
    const onLeave = doc.leaveBlocks.some(lb => lb.date === date);
    if (onLeave) return { slots: [], leaveDay: true };
    const booked = _appointments
      .filter(a => a.doctorId === doctorId && a.date === date && !['CANCELLED','NO_SHOW'].includes(a.status))
      .map(a => a.time);
    const [sh, sm] = hours[0].split(':').map(Number);
    const [eh, em] = hours[1].split(':').map(Number);
    const slots = [];
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + doc.slotMinutes <= end) {
      const t = `${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`;
      slots.push({ time: t, available: !booked.includes(t) });
      cur += doc.slotMinutes;
    }
    return { slots, leaveDay: false };
  },
  async create(data) {
    await delay(400);
    const doc = { id: 'd' + newId(), ...data, active: true, leaveBlocks: [] };
    _doctors.push(doc);
    _addAudit('DOCTOR_CREATED', 'Doctor', doc.id, `Created doctor ${doc.name}`);
    return doc;
  },
  async update(id, data) {
    await delay(400);
    const idx = _doctors.findIndex(d => d.id === id);
    if (idx === -1) apiError(404, 'Doctor not found');
    _doctors[idx] = { ..._doctors[idx], ...data };
    _addAudit('DOCTOR_UPDATED', 'Doctor', id, `Updated doctor ${_doctors[idx].name}`);
    return _doctors[idx];
  },
  async addLeave(doctorId, date, reason) {
    await delay(300);
    const doc = _doctors.find(d => d.id === doctorId);
    if (!doc) apiError(404, 'Doctor not found');
    doc.leaveBlocks.push({ date, reason });
    _addAudit('DOCTOR_LEAVE_ADDED', 'Doctor', doctorId, `Leave on ${date}`);
    return doc;
  },
  async removeLeave(doctorId, date) {
    await delay(300);
    const doc = _doctors.find(d => d.id === doctorId);
    if (!doc) apiError(404, 'Doctor not found');
    doc.leaveBlocks = doc.leaveBlocks.filter(l => l.date !== date);
    return doc;
  },
};

// Ã¢”â¬Ã¢”â¬ appointments /api/v1/appointments Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
export const appointments = {
  async list({ date, doctorId, status, patientId } = {}) {
    await delay(250);
    let results = [..._appointments];
    if (date)      results = results.filter(a => a.date === date);
    if (doctorId)  results = results.filter(a => a.doctorId === doctorId);
    if (status)    results = results.filter(a => (Array.isArray(status) ? status : [status]).includes(a.status));
    if (patientId) results = results.filter(a => a.patientId === patientId);
    return results;
  },
  async get(id) {
    await delay(200);
    const a = _appointments.find(a => a.id === id);
    if (!a) apiError(404, 'Appointment not found');
    return { ...a };
  },
  async create(data) {
    await delay(500);
    // 60-day window
    const apptDate = new Date(data.date + 'T00:00:00');
    const diff = Math.floor((apptDate - new Date().setHours(0,0,0,0)) / 86400000);
    if (diff < 0) apiError(400, 'Cannot book in the past');
    if (diff > 60) apiError(400, 'Cannot book more than 60 days ahead');
    // slot conflict
    const conflict = _appointments.find(a =>
      a.doctorId === data.doctorId && a.date === data.date && a.time === data.time &&
      !['CANCELLED','NO_SHOW'].includes(a.status)
    );
    if (conflict) apiError(409, 'Slot already booked');
    const appt = {
      id: 'a' + newId(), ...data,
      endTime: addMinutes(data.time, 15),
      status: 'SCHEDULED', cancelReason: null, billId: null, createdAt: now(),
    };
    _appointments.push(appt);
    _addAudit('APPOINTMENT_CREATED', 'Appointment', appt.id, `Booked ${data.date} ${data.time}`);
    return appt;
  },
  async checkIn(id) {
    await delay(400);
    const a = _appointments.find(a => a.id === id);
    if (!a) apiError(404, 'Appointment not found');
    if (a.status !== 'SCHEDULED') apiError(400, `Cannot check-in, status is ${a.status}`);
    // create bill
    const doc = _doctors.find(d => d.id === a.doctorId);
    const bill = await bills.createForAppointment(a, doc);
    a.status = 'CHECKED_IN';
    a.billId = bill.id;
    _addAudit('APPOINTMENT_CHECKEDIN', 'Appointment', id, `Checked in`);
    return { appointment: { ...a }, bill };
  },
  async complete(id) {
    await delay(300);
    const a = _appointments.find(a => a.id === id);
    if (!a) apiError(404, 'Appointment not found');
    if (a.status !== 'CHECKED_IN') apiError(400, 'Only checked-in appointments can be completed');
    a.status = 'COMPLETED';
    _addAudit('APPOINTMENT_COMPLETED', 'Appointment', id, `Marked complete`);
    return { ...a };
  },
  async cancel(id, reason) {
    await delay(300);
    if (!reason?.trim()) apiError(400, 'Cancel reason is required', { reason: 'Required' });
    const a = _appointments.find(a => a.id === id);
    if (!a) apiError(404, 'Appointment not found');
    if (['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)) apiError(400, `Cannot cancel, status is ${a.status}`);
    a.status = 'CANCELLED';
    a.cancelReason = reason;
    _addAudit('APPOINTMENT_CANCELLED', 'Appointment', id, `Cancelled: ${reason}`);
    return { ...a };
  },
  async markNoShow(id) {
    await delay(300);
    const a = _appointments.find(a => a.id === id);
    if (!a) apiError(404, 'Appointment not found');
    if (a.status !== 'SCHEDULED') apiError(400, 'Can only mark no-show for Scheduled appointments');
    const slotTime = new Date(`${a.date}T${a.time}:00`);
    if (new Date() < slotTime) apiError(400, 'Cannot mark no-show before slot time');
    a.status = 'NO_SHOW';
    _addAudit('APPOINTMENT_NOSHOW', 'Appointment', id, `Marked no-show`);
    return { ...a };
  },
};

// Ã¢”â¬Ã¢”â¬ bills /api/v1/bills Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
let _invoiceCounter = _bills.length;
let _receiptCounter = _bills.reduce((acc, b) => acc + b.payments.length, 0);

function invNo() { return `INV-${new Date().getFullYear()}-${String(++_invoiceCounter).padStart(6,'0')}`; }
function recNo() { return `RCP-${new Date().getFullYear()}-${String(++_receiptCounter).padStart(6,'0')}`; }

export const bills = {
  async list({ status, patientId } = {}) {
    await delay(250);
    let results = [..._bills];
    if (status)    results = results.filter(b => (Array.isArray(status)?status:[status]).includes(b.status));
    if (patientId) results = results.filter(b => b.patientId === patientId);
    return results;
  },
  async get(id) {
    await delay(200);
    const b = _bills.find(b => b.id === id);
    if (!b) apiError(404, 'Bill not found');
    return { ...b };
  },
  async createForAppointment(appt, doc) {
    const fee = doc?.consultFee ?? 1500.00;
    const bill = {
      id: 'b' + newId(),
      invoiceNo: invNo(),
      patientId: appt.patientId,
      appointmentId: appt.id,
      doctorId: appt.doctorId,
      lineItems: [{ desc: 'Consultation Fee', amount: fee }],
      subtotal: fee, discount: 0, discountReason: null, total: fee,
      payments: [], amountPaid: 0, status: 'UNPAID',
      voidReason: null, refundReason: null,
      createdAt: now(), lockedAt: null,
    };
    _bills.push(bill);
    _addAudit('BILL_CREATED', 'Bill', bill.id, `Bill ${bill.invoiceNo} created`);
    return bill;
  },
  async applyDiscount(id, discount, reason) {
    await delay(400);
    const b = _bills.find(b => b.id === id);
    if (!b) apiError(404, 'Bill not found');
    if (b.status === 'PAID') apiError(400, 'Bill is locked');
    if (b.status === 'VOID') apiError(400, 'Bill is voided');
    if (!reason?.trim()) apiError(400, 'Discount reason required', { discountReason: 'Required' });
    if (discount < 0 || discount > b.subtotal) apiError(400, 'Invalid discount amount');
    b.discount = discount;
    b.discountReason = reason;
    b.total = Math.max(0, b.subtotal - discount);
    _addAudit('DISCOUNT_APPLIED', 'Bill', id, `Discount LKR ${discount.toFixed(2)} Ã¢â¬“ ${reason}`);
    return { ...b };
  },
  async recordPayment(id, amount, method) {
    await delay(500);
    const b = _bills.find(b => b.id === id);
    if (!b) apiError(404, 'Bill not found');
    if (b.status === 'PAID') apiError(400, 'Bill is already fully paid');
    if (b.status === 'VOID') apiError(400, 'Bill is voided');
    if (amount <= 0) apiError(400, 'Amount must be positive', { amount: 'Must be > 0' });
    const balance = b.total - b.amountPaid;
    if (amount > balance + 0.01) apiError(400, `Amount exceeds balance of LKR ${balance.toFixed(2)}`);
    const payment = { id: 'pay' + newId(), amount, method, paidAt: now(), receiptNo: recNo() };
    b.payments.push(payment);
    b.amountPaid = +(b.amountPaid + amount).toFixed(2);
    if (b.amountPaid >= b.total - 0.01) { b.status = 'PAID'; b.lockedAt = now(); }
    else b.status = 'PARTIAL';
    _addAudit('PAYMENT_RECORDED', 'Bill', id, `Payment LKR ${amount.toFixed(2)} ${method}`);
    return { bill: { ...b }, payment };
  },
  async voidBill(id, reason) {
    await delay(400);
    const b = _bills.find(b => b.id === id);
    if (!b) apiError(404, 'Bill not found');
    if (b.status === 'PAID') apiError(400, 'Cannot void a paid bill');
    if (!reason?.trim()) apiError(400, 'Void reason required', { voidReason: 'Required' });
    b.status = 'VOID';
    b.voidReason = reason;
    _addAudit('BILL_VOIDED', 'Bill', id, `Voided: ${reason}`);
    return { ...b };
  },
  async refund(id, reason) {
    await delay(400);
    const b = _bills.find(b => b.id === id);
    if (!b) apiError(404, 'Bill not found');
    if (b.status !== 'PAID') apiError(400, 'Can only refund paid bills');
    if (!reason?.trim()) apiError(400, 'Refund reason required', { refundReason: 'Required' });
    b.status = 'VOID';
    b.refundReason = reason;
    b.lockedAt = null;
    _addAudit('BILL_REFUNDED', 'Bill', id, `Refunded: ${reason}`);
    return { ...b };
  },
};

// Ã¢”â¬Ã¢”â¬ users /api/v1/users Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
export const users = {
  async list() {
    await delay(300);
    return _users.map(u => ({ ...u }));
  },
  async create(data) {
    await delay(400);
    const exists = _users.find(u => u.username === data.username);
    if (exists) apiError(409, 'Username already taken', { username: 'Already exists' });
    const u = { id: 'u' + newId(), ...data, active: true, forcePasswordChange: true, failedAttempts: 0 };
    _passwords[u.username] = data.password || 'pass123';
    _users.push(u);
    _addAudit('USER_CREATED', 'User', u.id, `Created user ${u.username}`);
    return u;
  },
  async update(id, data) {
    await delay(400);
    const idx = _users.findIndex(u => u.id === id);
    if (idx === -1) apiError(404, 'User not found');
    _users[idx] = { ..._users[idx], ...data };
    _addAudit('USER_UPDATED', 'User', id, `Updated user ${_users[idx].username}`);
    return { ..._users[idx] };
  },
  async deactivate(id) {
    await delay(300);
    const u = _users.find(u => u.id === id);
    if (!u) apiError(404, 'User not found');
    u.active = false;
    _addAudit('USER_DEACTIVATED', 'User', id, `Deactivated ${u.username}`);
    return { ...u };
  },
  async resetPassword(id) {
    await delay(300);
    const u = _users.find(u => u.id === id);
    if (!u) apiError(404, 'User not found');
    _passwords[u.username] = 'pass123';
    u.forcePasswordChange = true;
    u.failedAttempts = 0;
    _addAudit('USER_PASSWORD_RESET', 'User', id, `Password reset for ${u.username}`);
    return { success: true };
  },
  async unlockAccount(id) {
    await delay(300);
    const u = _users.find(u => u.id === id);
    if (!u) apiError(404, 'User not found');
    u.failedAttempts = 0;
    _addAudit('USER_UNLOCKED', 'User', id, `Unlocked ${u.username}`);
    return { success: true };
  },
};

// Ã¢”â¬Ã¢”â¬ audit /api/v1/audit Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
function _addAudit(action, entity, entityId, detail) {
  const user = _sessionUser || { id: 'sys', name: 'System' };
  _auditLog.unshift({
    id: 'au' + newId(),
    userId: user.id,
    userName: user.name,
    action, entity, entityId, detail,
    ts: now(),
  });
}

export const audit = {
  async list({ userId, entity, dateFrom, dateTo, search } = {}) {
    await delay(300);
    let results = [..._auditLog];
    if (userId) results = results.filter(a => a.userId === userId);
    if (entity) results = results.filter(a => a.entity === entity);
    if (dateFrom) results = results.filter(a => a.ts >= dateFrom);
    if (dateTo)   results = results.filter(a => a.ts <= dateTo + 'T23:59:59Z');
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(a =>
        a.action.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.userName.toLowerCase().includes(q)
      );
    }
    return results.slice(0, 200);
  },
};

// Ã¢”â¬Ã¢”â¬ utils Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬Ã¢”â¬
function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

export const fmt = {
  lkr: n => `LKR ${(+n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  date: s => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : 'Ã¢â¬”',
  time: s => s ? new Date(s).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true }) : 'Ã¢â¬”',
  age: dob => {
    const d = new Date(dob);
    const age = Math.floor((Date.now() - d) / 3.156e10);
    return `${age}y`;
  },
  isMinor: dob => {
    return Math.floor((Date.now() - new Date(dob)) / 3.156e10) < 18;
  },
};

