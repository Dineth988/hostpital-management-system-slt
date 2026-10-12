ï»¿import React, { useState, useEffect } from 'react';
import { bills as billsApi, patients as patientsApi, doctors as doctorsApi, fmt } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Drawer from './Drawer.jsx';
import { BillStatusBadge } from './BillList.jsx';
import { Spinner } from './PatientDrawer.jsx';

export default function BillDrawer({ billId, onClose, onUpdate }) {
  const [bill, setBill] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payErr, setPayErr] = useState('');
  const [paying, setPaying] = useState(false);
  const [discountAmt, setDiscountAmt] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [discountErr, setDiscountErr] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const { can } = useAuth();
  const { showToast } = useApp();

  const load = async () => {
    setLoading(true);
    try {
      const b = await billsApi.get(billId);
      setBill(b);
      const [p, d] = await Promise.all([
        patientsApi.get(b.patientId),
        doctorsApi.get(b.doctorId),
      ]);
      setPatient(p);
      setDoctor(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [billId]);

  const handlePay = async () => {
    setPayErr('');
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { setPayErr('Enter a valid amount'); return; }
    const balance = bill.total - bill.amountPaid;
    if (amt > balance + 0.01) { setPayErr(`Max is ${fmt.lkr(balance)}`); return; }
    setPaying(true);
    try {
      const { bill: updated, payment } = await billsApi.recordPayment(billId, amt, payMethod);
      setBill(updated);
      setPayAmount('');
      showToast(`Payment of ${fmt.lkr(amt)} recorded. Receipt: ${payment.receiptNo}`);
      onUpdate?.();
    } catch (e) {
      setPayErr(e.message);
    } finally {
      setPaying(false);
    }
  };

  const handleDiscount = async () => {
    setDiscountErr('');
    const amt = parseFloat(discountAmt);
    if (!amt || amt <= 0) { setDiscountErr('Enter a valid discount'); return; }
    if (!discountReason.trim()) { setDiscountErr('Reason required'); return; }
    setApplyingDiscount(true);
    try {
      const updated = await billsApi.applyDiscount(billId, amt, discountReason);
      setBill(updated);
      setDiscountAmt(''); setDiscountReason('');
      showToast('Discount applied');
    } catch (e) {
      setDiscountErr(e.message);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    setVoiding(true);
    try {
      const updated = await billsApi.voidBill(billId, voidReason);
      setBill(updated);
      showToast('Bill voided', 'warning');
      onUpdate?.();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setVoiding(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) return;
    setRefunding(true);
    try {
      const updated = await billsApi.refund(billId, refundReason);
      setBill(updated);
      showToast('Refund processed', 'warning');
      onUpdate?.();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRefunding(false);
    }
  };

  const printReceipt = () => window.print();

  if (loading) return <Drawer title="Bill Detail" onClose={onClose}><Spinner /></Drawer>;
  if (!bill) return <Drawer title="Bill Detail" onClose={onClose}><div style={{ color: 'var(--text-muted)', padding: '20px' }}>Bill not found</div></Drawer>;

  const balance = bill.total - bill.amountPaid;
  const locked = bill.status === 'PAID' || bill.status === 'VOID';

  return (
    <Drawer
      title={<><span>Invoice</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{bill.invoiceNo}</span></>}
      onClose={onClose}
    >
      <div className="printable-receipt">
        {/* Header info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
          {[
            { label: 'Patient', value: patient?.name, sub: patient?.pid },
            { label: 'Doctor', value: doctor?.name, sub: doctor?.specialty },
            { label: 'Status', value: <BillStatusBadge status={bill.status} /> },
            { label: 'Created', value: fmt.date(bill.createdAt) },
          ].map(r => (
            <div key={r.label} style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '3px' }}>{r.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.value}</div>
              {r.sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{r.sub}</div>}
            </div>
          ))}
        </div>

        {/* Line items */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Line Items</div>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {bill.lineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < bill.lineItems.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.desc}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{fmt.lkr(item.amount)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-medium)', display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 12px' }}>
              <Row label="Subtotal" value={fmt.lkr(bill.subtotal)} />
              {bill.discount > 0 && <Row label={`Discount (${bill.discountReason})`} value={`Ã¢Ëâ ${fmt.lkr(bill.discount)}`} color="var(--status-checkedin-text)" />}
              <Row label="Total" value={fmt.lkr(bill.total)} bold />
              <Row label="Paid" value={fmt.lkr(bill.amountPaid)} color="var(--status-checkedin-text)" />
              {balance > 0.01 && <Row label="Balance Due" value={fmt.lkr(balance)} color="var(--status-unpaid-text)" bold />}
            </div>
          </div>
        </div>

        {/* Payment history */}
        {bill.payments.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Payments</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {bill.payments.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '7px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
                  <span className="badge badge-paid" style={{ fontSize: '10px' }}>{p.method}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--status-checkedin-text)' }}>{fmt.lkr(p.amount)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>{fmt.time(p.paidAt)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>{p.receiptNo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Void/refund notice */}
        {bill.voidReason && <div style={{ padding: '10px 12px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}><strong>Voided:</strong> {bill.voidReason}</div>}
        {bill.refundReason && <div style={{ padding: '10px 12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius)', fontSize: '12px', color: '#fb7185', marginBottom: '12px' }}><strong>Refunded:</strong> {bill.refundReason}</div>}
      </div>

      {/* Actions (no-print) */}
      <div className="no-print">
        {/* Payment form */}
        {!locked && balance > 0.01 && can('bill:pay') && (
          <Section title="Record Payment">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div className="form-label" style={{ marginBottom: '4px' }}>Amount (LKR)<span className="req">*</span></div>
                <input className={`form-input ${payErr ? 'error' : ''}`} type="number" step="0.01" min="0.01" max={balance} value={payAmount} onChange={e => { setPayAmount(e.target.value); setPayErr(''); }} placeholder={`Max: ${balance.toFixed(2)}`} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: '4px' }}>Method</div>
                <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>
            {payErr && <div className="form-error" style={{ marginBottom: '8px' }}>Ã¢Å¡  {payErr}</div>}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={handlePay} disabled={paying}>{paying ? 'ProcessingÃ¢â¬Â¦' : `Pay ${payAmount ? fmt.lkr(parseFloat(payAmount) || 0) : ''}`.trim()}</button>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Balance after: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{fmt.lkr(Math.max(0, balance - (parseFloat(payAmount) || 0)))}</strong></span>
            </div>
          </Section>
        )}

        {/* Admin: discount */}
        {can('*') && !locked && (
          <Section title="Apply Discount">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div className="form-label" style={{ marginBottom: '4px' }}>Amount (LKR)</div>
                <input className="form-input" type="number" step="0.01" min="0" value={discountAmt} onChange={e => { setDiscountAmt(e.target.value); setDiscountErr(''); }} style={{ fontFamily: 'var(--font-mono)' }} />
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: '4px' }}>Reason<span className="req">*</span></div>
                <input className="form-input" value={discountReason} onChange={e => { setDiscountReason(e.target.value); setDiscountErr(''); }} placeholder="e.g. Senior citizen discount" />
              </div>
            </div>
            {discountErr && <div className="form-error" style={{ marginBottom: '8px' }}>Ã¢Å¡  {discountErr}</div>}
            <button className="btn btn-secondary btn-sm" onClick={handleDiscount} disabled={applyingDiscount}>{applyingDiscount ? 'ApplyingÃ¢â¬Â¦' : 'Apply Discount'}</button>
          </Section>
        )}

        {/* Admin: void */}
        {can('*') && !locked && (
          <Section title="Void Bill">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="Reason for void (required)" style={{ flex: 1 }} />
              <button className="btn btn-danger btn-sm" onClick={handleVoid} disabled={voiding || !voidReason.trim()}>{voiding ? 'Ã¢â¬Â¦' : 'Void'}</button>
            </div>
          </Section>
        )}

        {/* Admin: refund */}
        {can('*') && bill.status === 'PAID' && (
          <Section title="Process Refund">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Reason for refund (required)" style={{ flex: 1 }} />
              <button className="btn btn-danger btn-sm" onClick={handleRefund} disabled={refunding || !refundReason.trim()}>{refunding ? 'Ã¢â¬Â¦' : 'Refund'}</button>
            </div>
          </Section>
        )}

        <button className="btn btn-subtle btn-sm" onClick={printReceipt} style={{ marginTop: '8px' }}>
          🖨 Print Receipt
        </button>
      </div>
    </Drawer>
  );
}

function Row({ label, value, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: bold ? 700 : 500, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '10px' }}>{title}</div>
      {children}
    </div>
  );
}

