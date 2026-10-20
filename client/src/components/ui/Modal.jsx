import { useEffect, useId, useRef } from 'react';

// A dialog built on the browser's <dialog> element. showModal() gives us for
// free: a dimmed backdrop, Esc to close, focus moved into the dialog, and the
// page behind it made unclickable.
// Render it only while it should be open: {isOpen && <Modal ... />}.
export default function Modal({ title, onClose, width = 'max-w-2xl', children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    // The check matters in development, where StrictMode runs effects twice.
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Fires when Esc closes the dialog: tell the parent to stop rendering it.
      onClose={onClose}
      className={`m-auto max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/50 ${width}`}
    >
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
