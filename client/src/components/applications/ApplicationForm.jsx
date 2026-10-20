import { useState } from 'react';
import { STATUSES, WORK_MODES } from '../../lib/applicationFilters.js';
import { STATUS_LABELS, WORK_MODE_LABELS } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';

// Every field the form edits. Inputs always hold text, so every value is a string.
const EMPTY_VALUES = {
  company: '',
  roleTitle: '',
  status: 'WISHLIST',
  jobUrl: '',
  location: '',
  workMode: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'USD',
  resumeVersion: '',
  coverLetterVersion: '',
  jobDescription: '',
  notes: '',
};

// API values (null, numbers) -> form values (strings).
function toFormValues(application) {
  if (!application) return EMPTY_VALUES;
  return Object.fromEntries(
    Object.keys(EMPTY_VALUES).map((key) => {
      const value = application[key];
      return [key, value == null ? '' : String(value)];
    }),
  );
}

// Form values -> request body. Empty text becomes null (which clears the field),
// and salaries become numbers.
function toRequestBody(values) {
  const body = {};
  for (const [key, value] of Object.entries(values)) {
    const text = value.trim();
    if (text === '') body[key] = null;
    else if (key === 'salaryMin' || key === 'salaryMax') body[key] = Number(text);
    else body[key] = text;
  }
  // The currency can't be empty: leave it out, and the server keeps (or defaults) it.
  if (body.salaryCurrency === null) delete body.salaryCurrency;
  return body;
}

// The create/edit form. Saving is up to the parent: it gets the request body
// in onSubmit and passes back isSaving and the error (an ApiError) to show.
export default function ApplicationForm({ application, onSubmit, onCancel, isSaving, error }) {
  const [values, setValues] = useState(() => toFormValues(application));
  const fieldErrors = error?.details?.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  // One change handler per field, e.g. onChange={update('company')}.
  const update = (key) => (event) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));

  // Shared props for each field: value, change handler and its server error.
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
        <TextField label="Company *" required maxLength={200} {...field('company')} />
        <TextField label="Role title *" required maxLength={200} {...field('roleTitle')} />
        <TextField label="Status" as="select" {...field('status')}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </TextField>
        <TextField label="Work mode" as="select" {...field('workMode')}>
          <option value="">Not set</option>
          {WORK_MODES.map((workMode) => (
            <option key={workMode} value={workMode}>
              {WORK_MODE_LABELS[workMode]}
            </option>
          ))}
        </TextField>
        <TextField label="Location" maxLength={200} {...field('location')} />
        <TextField label="Job URL" type="url" placeholder="https://…" {...field('jobUrl')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Salary min" type="number" min={0} step={1} {...field('salaryMin')} />
        <TextField label="Salary max" type="number" min={0} step={1} {...field('salaryMax')} />
        <TextField
          label="Currency"
          maxLength={3}
          placeholder="USD"
          className="uppercase"
          {...field('salaryCurrency')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Resume version" maxLength={100} {...field('resumeVersion')} />
        <TextField label="Cover letter version" maxLength={100} {...field('coverLetterVersion')} />
      </div>

      <TextField
        label="Job description"
        as="textarea"
        rows={4}
        maxLength={20000}
        {...field('jobDescription')}
      />
      <TextField label="Notes" as="textarea" rows={3} maxLength={5000} {...field('notes')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : application ? 'Save changes' : 'Create application'}
        </Button>
      </div>
    </form>
  );
}
