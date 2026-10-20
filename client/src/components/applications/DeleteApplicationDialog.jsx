import { useDeleteApplication } from '../../hooks/useApplicationMutations.js';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

export default function DeleteApplicationDialog({ application, onClose }) {
  const deleteMutation = useDeleteApplication();

  return (
    <ConfirmDialog
      title="Delete application?"
      confirmLabel="Delete"
      onConfirm={() => deleteMutation.mutate(application.id, { onSuccess: onClose })}
      onClose={onClose}
      isPending={deleteMutation.isPending}
      error={deleteMutation.error}
    >
      <p>
        <strong className="text-slate-900">
          {application.roleTitle} at {application.company}
        </strong>{' '}
        will be deleted, together with its interviews, contacts and status history. This
        can&apos;t be undone.
      </p>
    </ConfirmDialog>
  );
}
