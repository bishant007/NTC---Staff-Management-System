import React from 'react';
export default function ConfirmBulkActionModal({
  open,
  variant = 'primary',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  const v = VARIANTS[variant] || VARIANTS.primary;

  return (
    <div style={overlay} onClick={busy ? undefined : onCancel}>
      <div onClick={e => e.stopPropagation()} style={card}>
        <div style={{ fontSize: 44, textAlign: 'center', lineHeight: 1 }}>{v.icon}</div>
        <h2 style={{
          margin: '14px 0 10px', color: '#0b2e6f',
          textAlign: 'center', fontSize: 20,
        }}>{title}</h2>
        {message && (
          <p style={{
            margin: '0 0 8px', color: '#475569', fontSize: 14,
            textAlign: 'center', lineHeight: 1.65,
          }}>{message}</p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onCancel} disabled={busy} style={{
            flex: 1, padding: 13, background: '#f1f5f9', color: '#334155',
            border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer',
          }}>{cancelLabel}</button>
          <button onClick={onConfirm} disabled={busy} style={{
            flex: 1, padding: 13,
            background: busy ? '#a9c6f5' : v.bg, color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : `0 3px 0 ${v.shadow}`,
          }}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const VARIANTS = {
  primary: { bg: '#0d6efd', shadow: '#0a4fc4', icon: '❓' },
  success: { bg: '#16a34a', shadow: '#166534', icon: '✅' },
  danger:  { bg: '#dc3545', shadow: '#991b1b', icon: '⚠️' },
  warning: { bg: '#f59e0b', shadow: '#b45309', icon: '⚠️' },
};

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 10000, padding: 20,
};
const card = {
  background: '#fff', padding: 28, borderRadius: 18,
  width: 460, maxWidth: '100%',
  boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
};