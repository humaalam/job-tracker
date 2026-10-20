import { useCreateContact, useUpdateContact } from '../../hooks/useContactMutations.js';
import Modal from '../ui/Modal.jsx';
import ContactForm from './ContactForm.jsx';

// Adds a contact to the application, or edits `contact` when one is passed.
export default function ContactFormModal({ applicationId, contact, onClose }) {
  const createMutation = useCreateContact(applicationId);
  const updateMutation = useUpdateContact(applicationId);
  const mutation = contact ? updateMutation : createMutation;

  function handleSubmit(body) {
    if (contact) {
      updateMutation.mutate({ id: contact.id, data: body }, { onSuccess: onClose });
    } else {
      createMutation.mutate(body, { onSuccess: onClose });
    }
  }

  return (
    <Modal title={contact ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <ContactForm
        contact={contact}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSaving={mutation.isPending}
        error={mutation.error}
      />
    </Modal>
  );
}
