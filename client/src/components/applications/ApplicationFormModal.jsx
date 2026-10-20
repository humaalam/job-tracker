import { useCreateApplication, useUpdateApplication } from '../../hooks/useApplicationMutations.js';
import Modal from '../ui/Modal.jsx';
import ApplicationForm from './ApplicationForm.jsx';

// Creates a new application, or edits `application` when one is passed.
export default function ApplicationFormModal({ application, onClose }) {
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const mutation = application ? updateMutation : createMutation;

  function handleSubmit(body) {
    if (!application) {
      createMutation.mutate(body, { onSuccess: onClose });
      return;
    }
    // Send the status only when it changed: an unchanged one would do nothing
    // anyway, and leaving it out avoids a 409 if the board moved it meanwhile.
    if (body.status === application.status) delete body.status;
    updateMutation.mutate({ id: application.id, data: body }, { onSuccess: onClose });
  }

  return (
    <Modal title={application ? 'Edit application' : 'New application'} onClose={onClose}>
      <ApplicationForm
        application={application}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={mutation.isPending}
        error={mutation.error}
      />
    </Modal>
  );
}
