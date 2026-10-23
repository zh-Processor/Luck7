import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ open, onClose, title, children, className = '' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={label} onCancel={event => { event.preventDefault(); close.current(); }} onClick={event => { if (event.target === event.currentTarget) close.current(); }}>
    <div className="dialog-header"><h2 id={label}>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="关闭弹窗"><X size={19} /></button></div>
    {open && children}
  </dialog>;
}
