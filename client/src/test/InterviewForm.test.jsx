import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import InterviewForm from '../components/interviews/InterviewForm.jsx';

function renderForm(props = {}) {
  const onSubmit = vi.fn();
  render(<InterviewForm onSubmit={onSubmit} onCancel={() => {}} {...props} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('InterviewForm', () => {
  it('needs a date and time', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add interview' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Date and time *')).toBeInvalid();
  });

  it('sends the local date-time as UTC and the duration as a number', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText('Date and time *'), '2026-11-03T16:00');
    await user.type(screen.getByLabelText('Duration (minutes)'), '45');
    await user.click(screen.getByRole('button', { name: 'Add interview' }));

    const body = onSubmit.mock.calls[0][0];
    // Built the same way here, so the test passes in any time zone.
    expect(body.scheduledAt).toBe(new Date('2026-11-03T16:00').toISOString());
    expect(body.scheduledAt).toMatch(/Z$/);
    expect(body).toMatchObject({
      type: 'PHONE_SCREEN',
      outcome: 'PENDING',
      durationMinutes: 45,
      notes: null,
    });
  });

  it('shows a saved UTC time in local time when editing', () => {
    const scheduledAt = '2026-11-03T15:00:00.000Z';
    renderForm({ interview: { type: 'TECHNICAL', scheduledAt, outcome: 'PASSED' } });

    const local = new Date(scheduledAt);
    const pad = (n) => String(n).padStart(2, '0');
    const expected = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    expect(screen.getByLabelText('Date and time *')).toHaveValue(expected);
    expect(screen.getByLabelText('Outcome')).toHaveValue('PASSED');
  });
});
