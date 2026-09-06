import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="demo-modal"
        style={{ width: 'min(440px, 100%)', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: isDestructive ? '#fff1f2' : '#f0fdf4',
              color: isDestructive ? '#e11d48' : '#16a34a',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: 'var(--navy)' }}>{title}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            className="outline-button"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="primary-button"
            style={{
              background: isDestructive ? '#e11d48' : 'var(--blue)',
              borderColor: isDestructive ? '#e11d48' : 'var(--blue)',
            }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <Loader2 size={16} className="spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
