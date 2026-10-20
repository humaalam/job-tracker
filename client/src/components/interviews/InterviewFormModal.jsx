import { useCreateInterview, useUpdateInterview } from '../../hooks/useInterviewMutations.js';
import Modal from '../ui/Modal.jsx';
import InterviewForm from './InterviewForm.jsx';

// Adds an interview to the application, or edits `interview` when one is passed.
export default function InterviewFormModal({ applicationId, interview, onClose }) {
  const createMutation = useCreateInterview(applicationId);
  const updateMutation = useUpdateInterview(applicationId);
  const mutation = interview ? updateMutation : createMutation;

  function handleSubmit(body) {
    if (interview) {
      updateMutation.mutate({ id: interview.id, data: body }, { onSuccess: onClose });
    } else {
      createMutation.mutate(body, { onSuccess: onClose });
    }
  }

  return (
    <Modal title={interview ? 'Edit interview' : 'Add interview'} onClose={onClose}>
      <InterviewForm
        interview={interview}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={mutation.isPending}
        error={mutation.error}
      />
    </Modal>
  );
}
