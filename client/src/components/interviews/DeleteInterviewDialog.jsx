import { useDeleteInterview } from '../../hooks/useInterviewMutations.js';
import { formatDateTime, INTERVIEW_TYPE_LABELS } from '../../lib/format.js';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

export default function DeleteInterviewDialog({ applicationId, interview, onClose }) {
  const deleteMutation = useDeleteInterview(applicationId);

  return (
    <ConfirmDialog
      title="Delete interview?"
      confirmLabel="Delete"
      onConfirm={() => deleteMutation.mutate(interview.id, { onSuccess: onClose })}
      onClose={onClose}
      isPending={deleteMutation.isPending}
      error={deleteMutation.error}
    >
      <p>
        The{' '}
        <strong className="text-slate-900">
          {INTERVIEW_TYPE_LABELS[interview.type]} interview on {formatDateTime(interview.scheduledAt)}
        </strong>{' '}
        will be deleted. This can&apos;t be undone.
      </p>
    </ConfirmDialog>
  );
}
