// ============================================================
// api.js â€” Real HTTP client for HMS REST API
// Mirrors the same export shape as mock.js so all pages
// work without changes after updating the import.
// ============================================================

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// â”€â”€ Token storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _token = sessionStorage.getItem('hms_token') || null;

function setToken(t) {
  _token = t;
  if (t) sessionStorage.setItem('hms_token', t);
  else   sessionStorage.removeItem('hms_token');
}

// â”€â”€ Core fetch wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.fieldErrors = data.fieldErrors || {};
    throw err;
  }
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const auth = {
  async login(username, password) {
    const data = await post('/auth/login', { username, password });
    setToken(data.token);
    return { user: data.user, forcePasswordChange: data.forcePasswordChange };
  },
  async logout() {
    try { await post('/auth/logout', {}); } finally { setToken(null); }
  },
  async changePassword(userId, currentPw, newPw) {
    const data = await post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
    if (data.token) setToken(data.token);
    return data;
  },
  getSession() {
    // Decode JWT payload to restore session on reload
    if (!_token) return null;
    try {
      const payload = JSON.parse(atob(_token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { setToken(null); return null; }
      return { id: payload.id, name: payload.name, username: payload.username, role: payload.role, doctorId: payload.doctorId };
    } catch { return null; }
  },
};

// â”€â”€ Patients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const patients = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '')).toString();
    return get(`/patients${qs ? '?' + qs : ''}`);
  },
  get:        (id)         => get(`/patients/${id}`),
  create:     (data)       => post('/patients', data),
  update:     (id, data)   => put(`/patients/${id}`, data),
  deactivate: (id)         => patch(`/patients/${id}/deactivate`),
  reactivate: (id)         => patch(`/patients/${id}/reactivate`),
};

// â”€â”€ Doctors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const doctors = {
  list:       (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined)).toString();
    return get(`/doctors${qs ? '?' + qs : ''}`);
  },
  get:        (id)              => get(`/doctors/${id}`),
  slots:      (id, date)        => get(`/doctors/${id}/slots?date=${date}`),
  create:     (data)            => post('/doctors', data),
  update:     (id, data)        => put(`/doctors/${id}`, data),
  addLeave:   (id, date, reason) => post(`/doctors/${id}/leave`, { date, reason }),
  removeLeave:(id, date)        => del(`/doctors/${id}/leave/${date}`),
};

// â”€â”€ Appointments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const appointments = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '')).toString();
    return get(`/appointments${qs ? '?' + qs : ''}`);
  },
  get:        (id)          => get(`/appointments/${id}`),
  create:     (data)        => post('/appointments', data),
  checkIn:    (id)          => patch(`/appointments/${id}/checkin`),
  complete:   (id)          => patch(`/appointments/${id}/complete`),
  cancel:     (id, reason)  => patch(`/appointments/${id}/cancel`, { reason }),
  markNoShow: (id)          => patch(`/appointments/${id}/noshow`),
};

// â”€â”€ Bills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const bills = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '')).toString();
    return get(`/bills${qs ? '?' + qs : ''}`);
  },
  get:           (id)                    => get(`/bills/${id}`),
  applyDiscount: (id, discount, reason)  => post(`/bills/${id}/discount`, { discount, reason }),
  recordPayment: (id, amount, method)    => post(`/bills/${id}/payment`, { amount, method }),
  voidBill:      (id, reason)            => post(`/bills/${id}/void`, { reason }),
  refund:        (id, reason)            => post(`/bills/${id}/refund`, { reason }),
};

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const users = {
  list:          ()          => get('/users'),
  create:        (data)      => post('/users', data),
  update:        (id, data)  => put(`/users/${id}`, data),
  deactivate:    (id)        => patch(`/users/${id}/deactivate`),
  resetPassword: (id)        => patch(`/users/${id}/reset-password`),
  unlockAccount: (id)        => patch(`/users/${id}/unlock`),
};

// â”€â”€ Audit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const audit = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== '')).toString();
    return get(`/audit${qs ? '?' + qs : ''}`);
  },
};

// â”€â”€ Shared formatters (unchanged from mock.js) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ROLES = { RECEPTIONIST: 'RECEPTIONIST', DOCTOR: 'DOCTOR', CASHIER: 'CASHIER', ADMIN: 'ADMIN' };

export const fmt = {
  lkr: n  => `LKR ${(+n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  date: s  => s ? new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : 'â€”',
  time: s  => s ? new Date(s).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true }) : 'â€”',
  age: dob => {
    const age = Math.floor((Date.now() - new Date(dob)) / 3.156e10);
    return `${age}y`;
  },
  isMinor: dob => Math.floor((Date.now() - new Date(dob)) / 3.156e10) < 18,
};

