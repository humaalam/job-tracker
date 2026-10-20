import { useState } from 'react';
import { INTERVIEW_OUTCOME_LABELS, INTERVIEW_TYPE_LABELS } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import ErrorMessage from '../ui/ErrorMessage.jsx';

// Every field the form edits. Inputs always hold text, so every value is a string.
const EMPTY_VALUES = {
  type: 'PHONE_SCREEN',
  scheduledAt: '',
  durationMinutes: '',
  locationOrLink: '',
  interviewers: '',
  outcome: 'PENDING',
  notes: '',
};

// <input type="datetime-local"> works with local time without a time zone,
// like "2026-11-03T16:00". The API sends and wants UTC ("2026-11-03T15:00:00.000Z").

// UTC from the API -> local "YYYY-MM-DDTHH:mm" for the input.
function toDateTimeLocal(isoString) {
  const date = new Date(isoString);
  const pad = (number) => String(number).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// API values (null, numbers, UTC dates) -> form values (strings).
function toFormValues(interview) {
  if (!interview) return EMPTY_VALUES;
  return Object.fromEntries(
    Object.keys(EMPTY_VALUES).map((key) => {
      const value = interview[key];
      if (key === 'scheduledAt') return [key, toDateTimeLocal(value)];
      return [key, value == null ? '' : String(value)];
    }),
  );
}

// Form values -> request body. Empty text becomes null (which clears the field).
function toRequestBody(values) {
  const body = {};
  for (const [key, value] of Object.entries(values)) {
    const text = value.trim();
    if (text === '') body[key] = null;
    // A date-time without a zone is read as local time; toISOString() turns it into UTC.
    else if (key === 'scheduledAt') body[key] = new Date(text).toISOString();
    else if (key === 'durationMinutes') body[key] = Number(text);
    else body[key] = text;
  }
  return body;
}

// The create/edit form, built like ApplicationForm: the parent saves, and
// passes back isSaving and the error (an ApiError) to show.
export default function InterviewForm({ interview, onSubmit, onCancel, isSaving, error }) {
  const [values, setValues] = useState(() => toFormValues(interview));
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
      {error && !hasFieldErrors && <ErrorMessage>{error.message}</ErrorMessage>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Type" as="select" {...field('type')}>
          {Object.entries(INTERVIEW_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </TextField>
        <TextField label="Outcome" as="select" {...field('outcome')}>
          {Object.entries(INTERVIEW_OUTCOME_LABELS).map(([outcome, label]) => (
            <option key={outcome} value={outcome}>
              {label}
            </option>
          ))}
        </TextField>
        <TextField
          label="Date and time *"
          type="datetime-local"
          required
          {...field('scheduledAt')}
        />
        <TextField
          label="Duration (minutes)"
          type="number"
          min={1}
          max={1440}
          step={1}
          {...field('durationMinutes')}
        />
        <TextField
          label="Location or link"
          maxLength={500}
          placeholder="Office address or video call link"
          {...field('locationOrLink')}
        />
        <TextField
          label="Interviewers"
          maxLength={500}
          placeholder="e.g. Jane Doe (EM), Sam Lee"
          {...field('interviewers')}
        />
      </div>

      <TextField label="Notes" as="textarea" rows={3} maxLength={5000} {...field('notes')} />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : interview ? 'Save changes' : 'Add interview'}
        </Button>
      </div>
    </form>
  );
}
