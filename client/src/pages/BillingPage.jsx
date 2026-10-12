import React, { useState, useEffect, useCallback } from 'react';
import { bills as billsApi, patients as patientsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { BillStatusBadge } from '../components/BillList.jsx';
import { Spinner } from '../components/PatientDrawer.jsx';

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('UNPAID,PARTIAL');
  const { can } = useAuth();
  const { openDrawer } = useApp();

  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statuses = statusFilter ? statusFilter.split(',') : undefined;
      const billList = await billsApi.list({ status: statuses });
      setBills(billList);
      const uniquePids = [...new Set(billList.map(b => b.patientId).filter(Boolean))];
      const pMap = {};
      await Promise.all(uniquePids.map(pid => patientsApi.get(pid).then(p => { pMap[pid] = p; }).catch(() => {})));
      setPatients(pMap);
    } catch (err) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalBalance = bills.reduce((sum, b) => sum + Math.max(0, b.total - b.amountPaid), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>Payment Queue</div>
        <div style={{ flex: 1 }} />
        {/* Summary */}
        <div style={{ padding: '4px 12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Outstanding: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-unpaid-text)' }}>{fmt.lkr(totalBalance)}</span>
        </div>
        <select className="form-select" style={{ width: 'auto', height: '28px', fontSize: '12px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="UNPAID,PARTIAL">Pending (Unpaid + Partial)</option>
          <option value="UNPAID">Unpaid Only</option>
          <option value="PARTIAL">Partial Only</option>
          <option value="PAID">Paid</option>
          <option value="">All</option>
        </select>
        <button className="btn btn-subtle btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--status-cancelled-text)' }}>
            <div style={{ fontSize: '13px' }}>⚠ {error}</div>
            <button className="btn btn-subtle btn-sm" style={{ marginTop: '12px' }} onClick={load}>Retry</button>
          </div>
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '13px' }}>No bills in this queue</div>
          </div>
        ) : (
          <table className="dense-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(bill => {
                const patient = patients[bill.patientId];
                const balance = Math.max(0, bill.total - bill.amountPaid);
                return (
                  <tr key={bill.id} className="clickable" onClick={() => openDrawer('bill-detail', { billId: bill.id, onUpdate: load })}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{bill.invoiceNo}</td>
                    <td style={{ fontWeight: 500 }}>{patient?.name || 'Ã¢â¬”'}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmt.date(bill.createdAt)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{fmt.lkr(bill.total)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--status-checkedin-text)' }}>{fmt.lkr(bill.amountPaid)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: balance > 0 ? 700 : 400, color: balance > 0 ? 'var(--status-unpaid-text)' : 'var(--text-muted)' }}>
                      {balance > 0 ? fmt.lkr(balance) : "—"}
                    </td>
                    <td><BillStatusBadge status={bill.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      {can('bill:pay') && bill.status !== 'PAID' && bill.status !== 'VOID' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openDrawer('bill-detail', { billId: bill.id, onUpdate: load })}>
                          Pay →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

