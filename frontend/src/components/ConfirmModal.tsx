import { useEffect, useRef } from "react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-petrole-900/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-white p-6 shadow-xl">
        <h2 id="modal-title" className="mb-2 font-display text-lg font-bold text-petrole-800">
          {title}
        </h2>
        <p id="modal-description" className="mb-6 text-sm text-petrole-600">
          {description}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-petrole-200 bg-white px-4 py-2 text-sm font-semibold text-petrole-700 hover:bg-petrole-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
