import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [drawer, setDrawer] = useState(null); // { type, props }
  const [cmdBarOpen, setCmdBarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const openDrawer = useCallback((type, props = {}) => {
    setDrawer({ type, props });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{ drawer, openDrawer, closeDrawer, cmdBarOpen, setCmdBarOpen, toast, showToast }}>
      {children}
      {/* Toast Notifications */}
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

function Toast({ message, type, onDismiss }) {
  const colors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#34d399' },
    error:   { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.35)',  text: '#fb7185' },
    info:    { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', text: '#38bdf8' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fbbf24' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
      background: 'var(--bg-surface-elevated)', border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-md)', padding: '12px 16px',
      boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '10px',
      maxWidth: '360px', animation: 'slideUpFade 0.2s ease',
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.text, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '14px' }}>Ã—</button>
      <style>{`@keyframes slideUpFade { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

