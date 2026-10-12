# HMS Front Desk Console — Design Notes

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| --bg-app | #080c14 | Root background |
| --bg-surface | #0e1422 | Cards, panels, topbar |
| --bg-surface-elevated | #141c2e | Drawers, dropdowns |
| --accent | #f59e0b | Primary CTA, active tab, amounts |
| --border-subtle | #1c263c | Dividers between rows |
| --border-medium | #2b3a56 | Card borders, inputs |
| --text-primary | #f1f5f9 | Main content |
| --text-secondary | #94a3b8 | Labels, sub-text |
| --text-muted | #64748b | Placeholders, timestamps |

### Status Palette

| State | Text | Background |
|-------|------|------------|
| Scheduled | #38bdf8 sky | rgba(56,189,248,0.12) |
| Checked-in | #10b981 emerald | rgba(16,185,129,0.12) |
| Completed | #818cf8 violet | rgba(129,140,248,0.12) |
| Cancelled | #f43f5e rose | rgba(244,63,94,0.12) |
| No-show | #94a3b8 slate | rgba(148,163,184,0.12) |
| Paid | #10b981 | same as Checked-in |
| Partial | #f59e0b amber | amber muted |
| Unpaid | #fb7185 rose-400 | rose muted |
| Void | #64748b slate-500 | slate muted |

---

## Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Page title | Inter | 14px | 700 |
| Section label | Inter | 11px | 600 ALL-CAPS |
| Body text | Inter | 13px | 400 |
| Table body | Inter | 12px | 400 |
| Monospace data | IBM Plex Mono | 12px | 500 |
| Tabular nums (LKR, IDs) | IBM Plex Mono | 12-13px | 600 |

---

## Spacing Scale

- 2px — tight gap between badge elements
- 4px — gap within a pill / row of buttons
- 6px — gap between cards in a column
- 8px — default button padding H, inner form gap
- 10px — card internal padding
- 12px — standard drawer padding, table cell H-pad
- 16px — section spacing, page H-pad
- 20px — between form sections
- 28px — drawer section padding

---

## Corner Radius

- 4px  (--radius-sm) — badge, slot button, kbd
- 6px  (--radius)    — button, input, card (default)
- 8px  (--radius-md) — drawer, dropdown, toast
- 10px (--radius-lg) — login card, command palette

---

## Component Inventory

### Primitives (CSS classes)
- btn, btn-primary, btn-secondary, btn-subtle, btn-danger, btn-success
- btn-sm, btn-icon (size modifiers)
- badge, badge-{scheduled|checkedin|completed|cancelled|noshow|paid|partial|unpaid|void}
- badge-walkin, badge-bill (specialty inline chips)
- form-input, form-select, form-textarea
- form-group, form-label, form-error
- dense-table, dense-table-wrapper

### Composite Components

| File | Purpose |
|------|---------|
| AppShell.jsx | Top-bar, nav tabs, Ctrl+K trigger, idle banner, drawer router |
| CommandBar.jsx | Ctrl+K palette: patient search + action jumps |
| Drawer.jsx | Right-slide overlay with title bar, body, footer |
| DrawerTabs | Tab strip inside a drawer |
| PatientDrawer.jsx | Info / Appointments / Bills tabs, deactivate/edit |
| PatientForm.jsx | Registration and edit, NIC validation, guardian for minors |
| AppointmentDrawer.jsx | 3-step booking: patient -> doctor -> slot -> confirm |
| AppointmentList.jsx | Compact appointment history list |
| BillDrawer.jsx | Invoice detail, pay, discount, void, refund, print |
| BillList.jsx | Bill history list |

### Pages

| Route | Component | Roles |
|-------|-----------|-------|
| / | TodayPage | All |
| /patients | PatientsPage | All |
| /doctors | DoctorsPage | All |
| /billing | BillingPage | Cashier, Admin |
| /admin | AdminPage | Admin |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open command bar |
| Up/Down arrows | Navigate command bar results |
| Enter | Select / confirm |
| Esc | Close drawer or command bar |
| Tab | Move between form fields |

---

## Mock API Layer

File: src/api/mock.js

All exports follow the /api/v1 REST contract from Decisions doc section 8.
Every method returns a Promise and throws structured errors:

  { message: "Human readable", status: 409, fieldErrors: { field: "msg" } }

To switch to the real backend: replace each method body with fetch('/api/v1/...') calls.
No changes needed in any UI component.

### Exported Methods

auth.login(username, password)          -> { user, forcePasswordChange }
auth.logout()
auth.changePassword(userId, cur, new)   -> { success }

patients.list({ search, active })       -> Patient[]
patients.get(id)                        -> Patient
patients.create(data)                   -> Patient
patients.update(id, data)               -> Patient
patients.deactivate(id)                 -> Patient
patients.reactivate(id)                 -> Patient

doctors.list({ active })                -> Doctor[]
doctors.get(id)                         -> Doctor
doctors.slots(doctorId, date)           -> { slots[], leaveDay }
doctors.create(data)                    -> Doctor
doctors.update(id, data)               -> Doctor
doctors.addLeave(id, date, reason)     -> Doctor
doctors.removeLeave(id, date)          -> Doctor

appointments.list({ date, doctorId, status, patientId })
appointments.get(id)
appointments.create(data)               -> 409 on slot conflict
appointments.checkIn(id)                -> { appointment, bill }
appointments.complete(id)
appointments.cancel(id, reason)
appointments.markNoShow(id)

bills.list({ status, patientId })
bills.get(id)
bills.applyDiscount(id, amount, reason)
bills.recordPayment(id, amount, method) -> { bill, payment }
bills.voidBill(id, reason)
bills.refund(id, reason)

users.list()
users.create(data)
users.update(id, data)
users.deactivate(id)
users.resetPassword(id)
users.unlockAccount(id)

audit.list({ userId, entity, dateFrom, dateTo, search })

---

## Demo Credentials (password: pass123 for all)

| Username | Role |
|----------|------|
| priya | Receptionist |
| amal | Doctor (d1) |
| nimal | Doctor (d2) |
| kasun | Cashier |
| admin | Admin |

---

## Security UX Checklist

- [x] 15-min idle logout with 2-min warning banner (AuthContext.jsx)
- [x] Forced password change on first login (ChangePasswordPage.jsx)
- [x] 5 failed attempts -> account locked (mock.js auth.login)
- [x] NIC masked as 6918****5V in all list/table views
- [x] Address masked as ***** masked ***** in list views
- [x] Deactivate-not-delete for patients and users
- [x] 403 view for forbidden routes (RequirePermission wrapper)
- [x] Role-filtered nav tabs (AppShell NAV array)
- [x] Client-side validation on all forms
- [x] Server field errors shown under each input (fieldErrors mapping)

---

## MVP Scope Exclusions

Not built (per Decisions doc):
- Admissions / bed management
- Laboratory module
- Pharmacy module
- EMR / clinical notes
- Reports and analytics
- Supplier / inventory management
