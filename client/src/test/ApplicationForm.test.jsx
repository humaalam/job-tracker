import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.js';
import ApplicationForm from '../components/applications/ApplicationForm.jsx';

// The form only reports a body through onSubmit; saving is the parent's job.
// So each test renders it with a spy (vi.fn) and looks at what it received.
function renderForm(props = {}) {
  const onSubmit = vi.fn();
  render(<ApplicationForm onSubmit={onSubmit} onCancel={() => {}} {...props} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('ApplicationForm', () => {
  it('does not submit while the required fields are empty', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Create application' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Company *')).toBeInvalid();
    expect(screen.getByLabelText('Role title *')).toBeInvalid();
  });

  it('sends trimmed text, numbers for salaries and null for empty fields', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText('Company *'), '  Acme  ');
    await user.type(screen.getByLabelText('Role title *'), 'Developer');
    await user.selectOptions(screen.getByLabelText('Status'), 'APPLIED');
    await user.type(screen.getByLabelText('Salary min'), '50000');
    await user.click(screen.getByRole('button', { name: 'Create application' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      company: 'Acme',
      roleTitle: 'Developer',
      status: 'APPLIED',
      jobUrl: null,
      location: null,
      workMode: null,
      salaryMin: 50000,
      salaryMax: null,
      salaryCurrency: 'USD',
      resumeVersion: null,
      coverLetterVersion: null,
      jobDescription: null,
      notes: null,
    });
  });

  it('leaves out an emptied currency, so the server keeps its value', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText('Company *'), 'Acme');
    await user.type(screen.getByLabelText('Role title *'), 'Developer');
    await user.clear(screen.getByLabelText('Currency'));
    await user.click(screen.getByRole('button', { name: 'Create application' }));

    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('salaryCurrency');
  });

  it('starts with the values of the application being edited', () => {
    renderForm({
      application: {
        company: 'Globex',
        roleTitle: 'Engineer',
        status: 'OFFER',
        salaryMax: 90000,
        notes: null,
      },
    });

    expect(screen.getByLabelText('Company *')).toHaveValue('Globex');
    expect(screen.getByLabelText('Status')).toHaveValue('OFFER');
    // A number input's value is a number; null shows as an empty field.
    expect(screen.getByLabelText('Salary max')).toHaveValue(90000);
    expect(screen.getByLabelText('Notes')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it("shows the server's validation errors under the matching fields", () => {
    const error = new ApiError('Validation failed', 400, {
      fieldErrors: { jobUrl: ['Use a web address starting with http:// or https://'] },
    });
    renderForm({ error });

    const jobUrl = screen.getByLabelText('Job URL');
    expect(jobUrl).toHaveAttribute('aria-invalid', 'true');
    expect(jobUrl).toHaveAccessibleDescription(
      'Use a web address starting with http:// or https://',
    );
    // Field errors replace the general message at the top.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows other errors as a message at the top', () => {
    renderForm({ error: new ApiError('Could not reach the server. Check your connection.', 0) });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server');
  });

  it('disables the buttons while saving', () => {
    renderForm({ isSaving: true });

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
