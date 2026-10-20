import { useState } from 'react';
import Button from '../ui/Button.jsx';
import DeleteInterviewDialog from './DeleteInterviewDialog.jsx';
import InterviewFormModal from './InterviewFormModal.jsx';
import InterviewList from './InterviewList.jsx';

// The "Interviews" card on the detail page: the list, plus the add, edit and
// delete dialogs. Only one dialog is open at a time.
export default function InterviewsSection({ application }) {
  // null, { mode: 'add' }, { mode: 'edit', interview } or { mode: 'delete', interview }
  const [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Interviews</h2>
        <Button variant="secondary" onClick={() => setDialog({ mode: 'add' })}>
          Add interview
        </Button>
      </div>

      <InterviewList
        interviews={application.interviews}
        onEdit={(interview) => setDialog({ mode: 'edit', interview })}
        onDelete={(interview) => setDialog({ mode: 'delete', interview })}
      />

      {(dialog?.mode === 'add' || dialog?.mode === 'edit') && (
        <InterviewFormModal
          applicationId={application.id}
          interview={dialog.interview}
          onClose={close}
        />
      )}
      {dialog?.mode === 'delete' && (
        <DeleteInterviewDialog
          applicationId={application.id}
          interview={dialog.interview}
          onClose={close}
        />
      )}
    </div>
  );
}
