import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
  closeOnOverlay = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnOverlay && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${
          maxWidth.startsWith('max-w') ? maxWidth : 'max-w-lg'
        } bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden text-neutral-900`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-100 transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 bg-white text-sm text-neutral-700">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
