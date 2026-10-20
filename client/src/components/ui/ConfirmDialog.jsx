import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
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
      {error && <ErrorMessage className="mt-4">{error.message}</ErrorMessage>}
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
