import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.js';
import { getDashboardStats } from '../api/dashboard.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import { renderWithProviders } from './utils.jsx';

vi.mock('../api/dashboard.js', () => ({ getDashboardStats: vi.fn() }));

// The stats of a brand-new account: nothing tracked yet.
const emptyStats = {
  countsByStatus: { WISHLIST: 0, APPLIED: 0, INTERVIEWING: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
  total: 0,
  applicationsPerWeek: [],
  responseRate: null,
  upcomingInterviews: [],
};

describe('DashboardPage states', () => {
  afterEach(() => vi.clearAllMocks());

  it('shows loading, then an error with "Try again", which loads the page', async () => {
    getDashboardStats
      .mockRejectedValueOnce(new ApiError('The server is not available right now.', 503))
      .mockResolvedValueOnce(emptyStats);
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard…');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is not available right now.',
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // A new account sees a welcome message with the next step, not a page of zeros.
    expect(
      await screen.findByRole('heading', { name: /add your first application/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getDashboardStats).toHaveBeenCalledTimes(2);
  });

  it('opens the new application form from the welcome message', async () => {
    getDashboardStats.mockResolvedValue(emptyStats);
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await user.click(await screen.findByRole('button', { name: 'Add your first application' }));

    expect(screen.getByRole('dialog', { name: 'New application' })).toBeInTheDocument();
  });
});
