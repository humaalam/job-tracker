import { useState } from 'react';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';

// Every field the form edits. Inputs always hold text, so every value is a string.
const EMPTY_VALUES = {
  name: '',
  title: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  notes: '',
};

// API values (null) -> form values (strings).
function toFormValues(contact) {
  if (!contact) return EMPTY_VALUES;
  return Object.fromEntries(
    Object.keys(EMPTY_VALUES).map((key) => [key, contact[key] ?? '']),
  );
}

// Form values -> request body. Empty text becomes null (which clears the field).
function toRequestBody(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim() || null]),
  );
}

// The create/edit form, built like ApplicationForm: the parent saves, and
// passes back isSaving and the error (an ApiError) to show.
export default function ContactForm({ contact, onSubmit, onCancel, isSaving, error }) {
  const [values, setValues] = useState(() => toFormValues(contact));
  const fieldErrors = error?.details?.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const update = (key) => (event) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));

  const field = (key) => ({
    value: values[key],
    onChange: update(key),
    error: fieldErrors[key]?.[0],
  });

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(toRequestBody(values));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && !hasFieldErrors && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name *" required maxLength={200} {...field('name')} />
        <TextField
          label="Title"
          maxLength={200}
          placeholder="e.g. Recruiter, Hiring manager"
          {...field('title')}
        />
        <TextField label="Email" type="email" {...field('email')} />
        <TextField label="Phone" type="tel" maxLength={50} {...field('phone')} />
      </div>

      <TextField
        label="LinkedIn URL"
        type="url"
        placeholder="https://www.linkedin.com/in/…"
        {...field('linkedinUrl')}
      />
      <TextField label="Notes" as="textarea" rows={3} maxLength={5000} {...field('notes')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : contact ? 'Save changes' : 'Add contact'}
        </Button>
      </div>
    </form>
  );
}
