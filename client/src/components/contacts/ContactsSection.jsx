import { useState } from 'react';
import Button from '../ui/Button.jsx';
import ContactFormModal from './ContactFormModal.jsx';
import ContactList from './ContactList.jsx';
import DeleteContactDialog from './DeleteContactDialog.jsx';

// The "Contacts" card on the detail page: the list, plus the add, edit and
// delete dialogs. Only one dialog is open at a time.
export default function ContactsSection({ application }) {
  // null, { mode: 'add' }, { mode: 'edit', contact } or { mode: 'delete', contact }
  const [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <Button variant="secondary" onClick={() => setDialog({ mode: 'add' })}>
          Add contact
        </Button>
      </div>

      <ContactList
        contacts={application.contacts}
        onEdit={(contact) => setDialog({ mode: 'edit', contact })}
        onDelete={(contact) => setDialog({ mode: 'delete', contact })}
      />

      {(dialog?.mode === 'add' || dialog?.mode === 'edit') && (
        <ContactFormModal applicationId={application.id} contact={dialog.contact} onClose={close} />
      )}
      {dialog?.mode === 'delete' && (
        <DeleteContactDialog applicationId={application.id} contact={dialog.contact} onClose={close} />
      )}
    </div>
  );
}
