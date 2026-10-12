# HMS Console — Frontend

React + Vite + React Router frontend for the Hospital Management System MVP.

## Quick Start

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

## Demo Login

| Username | Password | Role |
|----------|----------|------|
| priya | pass123 | Receptionist |
| amal | pass123 | Doctor |
| kasun | pass123 | Cashier |
| admin | pass123 | Admin |

## Project Structure

```
client/
├── index.html
├── vite.config.js
├── package.json
├── DESIGN_NOTES.md          # Color tokens, components, API contract
└── src/
    ├── main.jsx             # Entry point
    ├── App.jsx              # Route definitions + role guards
    ├── index.css            # Design system tokens + global styles
    ├── components.css       # Component-specific styles
    ├── api/
    │   └── mock.js          # Full mock API (replace with real fetch() later)
    ├── context/
    │   ├── AuthContext.jsx  # Session, idle timer, permissions
    │   └── AppContext.jsx   # Drawer state, toasts
    ├── components/
    │   ├── AppShell.jsx     # Top-bar, nav, drawer router
    │   ├── CommandBar.jsx   # Ctrl+K search palette
    │   ├── Drawer.jsx       # Slide-in panel primitive
    │   ├── PatientDrawer.jsx
    │   ├── PatientForm.jsx
    │   ├── AppointmentDrawer.jsx
    │   ├── AppointmentList.jsx
    │   ├── BillDrawer.jsx
    │   └── BillList.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── ChangePasswordPage.jsx
        ├── TodayPage.jsx    # Kanban board
        ├── PatientsPage.jsx # Dense table
        ├── DoctorsPage.jsx  # Doctor cards
        ├── BillingPage.jsx  # Payment queue
        └── AdminPage.jsx    # Doctors / Schedules / Users / Audit
```

## Key Features

- **Today Board** — Kanban: Scheduled / Checked-In / Completed + collapsed Cancelled/No-show strip
- **One-click Check-in** — creates bill automatically, shows bill chip on card
- **Command Bar (Ctrl+K)** — patient search by name/NIC/phone/ID + action shortcuts
- **Right Drawer** — all detail views without losing Today board context
- **Billing Queue** — cashier view, live balance, cash/card, receipt printing
- **Role-based** — 4 roles, permission matrix enforced in UI + 403 for forbidden routes
- **15-min idle logout** — warning at 13 min, auto-logout at 15 min
- **Audit Log** — Admin tab, filterable by user / entity / date

## Replacing the Mock API

All API calls are in `src/api/mock.js`. Each exported function mirrors `/api/v1/...`.
To use the real backend:
1. Create `src/api/client.js` with a configured `fetch` wrapper (base URL, JWT headers, error parsing)
2. Re-export the same method signatures calling the real endpoints
3. Update the import in every file from `'../api/mock.js'` to `'../api/client.js'`

No UI component changes are needed.
