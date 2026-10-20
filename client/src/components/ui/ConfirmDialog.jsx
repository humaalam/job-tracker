import Button from './Button.jsx';
import Modal from './Modal.jsx';

// "Are you sure?" dialog for destructive actions. `children` is the question.
export default function ConfirmDialog({
  title,
  confirmLabel,
  onConfirm,
  onClose,
  isPending,
  error,
  children,
}) {
  return (
    <Modal title={title} onClose={onClose} width="max-w-md">
      <div className="text-sm text-slate-600">{children}</div>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
