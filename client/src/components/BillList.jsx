import React, { useState, useEffect } from 'react';
import { bills as billsApi, fmt } from '../api/api.js';
import { useApp } from '../context/AppContext.jsx';
import { EmptyState, Spinner } from './PatientDrawer.jsx';

export default function BillList({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useApp();

  useEffect(() => {
    billsApi.list({ patientId }).then(setItems).finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <Spinner />;
  if (!items.length) return <EmptyState message="No bills" icon="ðŸ§¾" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(bill => (
        <button key={bill.id} type="button" onClick={() => openDrawer('bill-detail', { billId: bill.id })}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)',
            cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{bill.invoiceNo}</span>
              <BillStatusBadge status={bill.status} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmt.date(bill.createdAt)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{fmt.lkr(bill.total)}</div>
            {bill.status !== 'PAID' && bill.status !== 'VOID' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--status-unpaid-text)' }}>
                Bal: {fmt.lkr(bill.total - bill.amountPaid)}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export function BillStatusBadge({ status }) {
  const map = {
    PAID: 'badge-paid', PARTIAL: 'badge-partial', UNPAID: 'badge-unpaid', VOID: 'badge-void',
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
}

