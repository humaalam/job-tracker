import { isWebUrl } from '../../lib/format.js';
import LinkButton from '../ui/LinkButton.jsx';

const linkClass = 'text-blue-600 hover:underline';

// The application's contacts, oldest first (the API's order).
export default function ContactList({ contacts, onEdit, onDelete }) {
  if (contacts.length === 0) {
    return <p className="text-sm text-slate-500">No contacts yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {contacts.map((contact) => (
        <li key={contact.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words font-medium text-slate-900">{contact.name}</p>
              {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
            </div>
            <div className="flex gap-3">
              <LinkButton className="text-blue-600" onClick={() => onEdit(contact)}>
                Edit
              </LinkButton>
              <LinkButton className="text-red-600" onClick={() => onDelete(contact)}>
                Delete
              </LinkButton>
            </div>
          </div>

          <div className="mt-2 space-y-1 break-words text-sm">
            {/* mailto: and tel: links open the email app / phone dialer. */}
            {contact.email && (
              <p>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </p>
            )}
            {contact.phone && (
              <p>
                <a href={`tel:${contact.phone}`} className={linkClass}>
                  {contact.phone}
                </a>
              </p>
            )}
            {/* The server only accepts http(s), but older data may differ: check again. */}
            {isWebUrl(contact.linkedinUrl) && (
              <p>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  LinkedIn profile
                </a>
              </p>
            )}
          </div>

          {contact.notes && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{contact.notes}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
