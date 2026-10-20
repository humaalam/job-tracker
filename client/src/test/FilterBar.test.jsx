import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FilterBar from '../components/applications/FilterBar.jsx';
import { DEFAULT_ORDER, DEFAULT_SORT } from '../lib/applicationFilters.js';

const NO_FILTERS = { status: [], workMode: [], search: '', sort: DEFAULT_SORT, order: DEFAULT_ORDER };

// FilterBar is controlled: the page keeps the filters and passes them in.
// This harness plays the page's part, applying each change to its state,
// and also hands every change to a spy so the test can check it.
function renderFilterBar(initial = {}) {
  const onChange = vi.fn();
  function Harness() {
    const [filters, setFilters] = useState({ ...NO_FILTERS, ...initial });
    return (
      <FilterBar
        filters={filters}
        onChange={(changes) => {
          onChange(changes);
          setFilters((previous) => ({ ...previous, ...changes }));
        }}
      />
    );
  }
  render(<Harness />);
  return { onChange, user: userEvent.setup() };
}

const statusGroup = () => within(screen.getByRole('group', { name: 'Status' }));

describe('FilterBar', () => {
  it('adds and removes statuses when their chips are clicked', async () => {
    const { onChange, user } = renderFilterBar();
    const applied = statusGroup().getByRole('button', { name: 'Applied' });
    const offer = statusGroup().getByRole('button', { name: 'Offer' });

    expect(applied).toHaveAttribute('aria-pressed', 'false');

    await user.click(applied);
    await user.click(offer);
    expect(onChange).toHaveBeenLastCalledWith({ status: ['APPLIED', 'OFFER'] });
    expect(applied).toHaveAttribute('aria-pressed', 'true');

    // A second click takes it out again.
    await user.click(applied);
    expect(onChange).toHaveBeenLastCalledWith({ status: ['OFFER'] });
    expect(applied).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports work mode filters separately from statuses', async () => {
    const { onChange, user } = renderFilterBar();
    const workModes = within(screen.getByRole('group', { name: 'Work mode' }));

    await user.click(workModes.getByRole('button', { name: 'Remote' }));

    expect(onChange).toHaveBeenLastCalledWith({ workMode: ['REMOTE'] });
  });

  it('reports what is typed in the search box', async () => {
    const { onChange, user } = renderFilterBar();

    await user.type(screen.getByLabelText('Search'), 'acme');

    expect(screen.getByLabelText('Search')).toHaveValue('acme');
    expect(onChange).toHaveBeenLastCalledWith({ search: 'acme' });
  });

  it('reports sorting changes', async () => {
    const { onChange, user } = renderFilterBar();

    await user.selectOptions(screen.getByLabelText('Sort by'), 'company');
    await user.selectOptions(screen.getByLabelText('Order'), 'asc');

    expect(onChange).toHaveBeenCalledWith({ sort: 'company' });
    expect(onChange).toHaveBeenLastCalledWith({ order: 'asc' });
  });

  it('shows "Clear filters" only while something is filtered, and it resets the filters', async () => {
    const { onChange, user } = renderFilterBar({ status: ['APPLIED'], search: 'acme', sort: 'company' });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    // Sorting is not a filter, so it stays as it was.
    expect(onChange).toHaveBeenLastCalledWith({ status: [], workMode: [], search: '' });
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toHaveValue('company');
  });
});
