import { useDeleteContact } from '../../hooks/useContactMutations.js';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

export default function DeleteContactDialog({ applicationId, contact, onClose }) {
  const deleteMutation = useDeleteContact(applicationId);

  return (
    <ConfirmDialog
      title="Delete contact?"
      confirmLabel="Delete"
      onConfirm={() => deleteMutation.mutate(contact.id, { onSuccess: onClose })}
      onClose={onClose}
      isPending={deleteMutation.isPending}
      error={deleteMutation.error}
    >
      <p>
        <strong className="text-slate-900">{contact.name}</strong> will be removed from this
        application. This can&apos;t be undone.
      </p>
    </ConfirmDialog>
  );
}
