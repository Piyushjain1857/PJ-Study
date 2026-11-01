import React, { useEffect, useRef, useId } from 'react';
import './Modal.css';

/**
 * Accessible Modal dialog component for PJ Study using the native <dialog> element.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   description?: string,
 *   children?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   maxWidth?: string,
 *   closeOnBackdropClick?: boolean
 * }} props
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = '540px',
  closeOnBackdropClick = true
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Control modal open / close state natively
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel event (Esc key)
  const handleCancel = (e) => {
    e.preventDefault();
    onClose();
  };

  // Modern web guidance: Robust light-dismiss on backdrop click via pointer coordinates
  const handlePointerDown = (e) => {
    if (!closeOnBackdropClick) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isOutside) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="modal-dialog"
      style={{ maxWidth }}
    >
      <div className="modal-dialog__content" onPointerDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-dialog__header">
          <div className="modal-dialog__titles">
            {title && (
              <h3 id={titleId} className="modal-dialog__title">
                {title}
              </h3>
            )}
            {description && (
              <p id={descId} className="modal-dialog__desc">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-dialog__close-btn"
            aria-label="Close dialog"
            autoFocus
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {children && <div className="modal-dialog__body">{children}</div>}

        {/* Footer actions */}
        {actions && <div className="modal-dialog__footer">{actions}</div>}
      </div>
    </dialog>
  );
}

export default Modal;

