import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { changeApplicationStatus, listApplications } from '../api/applications.js';
import { ApiError } from '../api/client.js';
import KanbanBoard from '../components/applications/KanbanBoard.jsx';
import { useApplications } from '../hooks/useApplications.js';
import { STATUSES } from '../lib/applicationFilters.js';
import { renderWithProviders } from './utils.jsx';

// Replace the two API calls the board uses with fakes (vi.fn), and keep the
// rest of the module as it is. No real request leaves the test.
vi.mock('../api/applications.js', async (importOriginal) => ({
  ...(await importOriginal()),
  listApplications: vi.fn(),
  changeApplicationStatus: vi.fn(),
}));

const acme = {
  id: 'app-acme',
  company: 'Acme',
  roleTitle: 'Developer',
  status: 'WISHLIST',
  salaryCurrency: 'USD',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

// What the fake server currently has. listApplications always answers with it.
let serverApplications;

// The board as the Applications page uses it: its cards come from the list
// query, so the optimistic update (which edits that cached list) shows up.
function BoardFromList() {
  const { data } = useApplications({});
  if (!data) return <p>Loading…</p>;
  return <KanbanBoard statuses={STATUSES} applications={data.applications} />;
}

const COLUMN = 'section[aria-labelledby^="kanban-column-"]';
const box = (left, top, width, height) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
});

// jsdom doesn't lay out the page: every element measures 0×0 at the top left.
// dnd-kit needs sizes to tell which column a card is over, so give each
// column a place side by side (300px apart) and put each card inside its column.
function fakeLayout() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    // The floating copy in <DragOverlay> is outside the columns. dnd-kit uses
    // it as the dragged card, so it starts where the picked-up card is
    // (dnd-kit marks that card's handle with aria-pressed="true").
    const pickedUpHandle = document.querySelector('button[aria-pressed="true"]');
    const column =
      this.closest(COLUMN) ?? (this.tagName === 'ARTICLE' && pickedUpHandle?.closest(COLUMN));
    if (!column) return box(0, 0, 0, 0);

    const status = column.getAttribute('aria-labelledby').replace('kanban-column-', '');
    const columnLeft = STATUSES.indexOf(status) * 300;
    if (this === column) return box(columnLeft, 0, 260, 600);
    return box(columnLeft + 10, 50, 240, 80); // a card in that column
  });
}

const column = (label) => within(screen.getByRole('region', { name: new RegExp(`^${label}`) }));

// Moves a card one column to the right with the keyboard, like a user would:
// Space picks it up, Right Arrow moves it, Space drops it.
async function moveRight(user, company) {
  screen.getByRole('button', { name: `Move ${company}` }).focus();
  await user.keyboard('[Space]');
  await user.keyboard('[ArrowRight]');
  await user.keyboard('[Space]');
}

describe('KanbanBoard status change', () => {
  beforeEach(() => {
    serverApplications = [acme];
    listApplications.mockImplementation(async () => ({
      applications: serverApplications,
      pagination: { page: 1, limit: 100, total: serverApplications.length, totalPages: 1 },
    }));
    fakeLayout();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('moves the card at once and saves the new status', async () => {
    // The request stays open until we call `finish`, so we can look at the
    // board while it is still on its way: that is the optimistic update.
    let finish;
    changeApplicationStatus.mockImplementation(
      (id, status) =>
        new Promise((resolve) => {
          finish = () => {
            serverApplications = [{ ...acme, status }];
            resolve(serverApplications[0]);
          };
        }),
    );
    const user = userEvent.setup();
    renderWithProviders(<BoardFromList />);
    await screen.findByRole('button', { name: 'Move Acme' });

    await moveRight(user, 'Acme');

    expect(changeApplicationStatus).toHaveBeenCalledWith('app-acme', 'APPLIED');
    // Already in the new column, although the server hasn't answered yet.
    expect(await column('Applied').findByText('Acme')).toBeInTheDocument();
    expect(column('Wishlist').queryByText('Acme')).not.toBeInTheDocument();

    finish();

    // After the answer, the list is fetched again and the card stays put.
    await waitFor(() => expect(listApplications).toHaveBeenCalledTimes(2));
    expect(column('Applied').getByText('Acme')).toBeInTheDocument();
  });

  it('puts the card back and shows an error when saving fails', async () => {
    // Both the request and the refetch after it wait until the test lets them
    // go, so each step can be checked on its own.
    let fail;
    changeApplicationStatus.mockImplementation(
      () => new Promise((_resolve, reject) => (fail = reject)),
    );
    const user = userEvent.setup();
    renderWithProviders(<BoardFromList />);
    await screen.findByRole('button', { name: 'Move Acme' });
    let answerRefetch;
    listApplications.mockImplementation(() => new Promise((resolve) => (answerRefetch = resolve)));

    await moveRight(user, 'Acme');
    expect(await column('Applied').findByText('Acme')).toBeInTheDocument();

    fail(new ApiError('The status was changed by another request. Please try again.', 409));

    // The rollback alone brings the card back: the refetch hasn't answered yet.
    expect(await column('Wishlist').findByText('Acme')).toBeInTheDocument();
    expect(column('Applied').queryByText('Acme')).not.toBeInTheDocument();

    // The mutation counts as failed once onSettled's refetch is done; then the error shows.
    answerRefetch({
      applications: serverApplications,
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't move the card: The status was changed by another request.",
    );
    expect(column('Wishlist').getByText('Acme')).toBeInTheDocument();
  });

  it('does not save anything when the card is dropped back in its own column', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BoardFromList />);
    (await screen.findByRole('button', { name: 'Move Acme' })).focus();

    await user.keyboard('[Space]');
    await user.keyboard('[Space]');

    // dnd-kit's screen reader message confirms it really landed on its own column.
    expect(screen.getByRole('status')).toHaveTextContent(
      'Acme was dropped in the Wishlist column.',
    );
    expect(changeApplicationStatus).not.toHaveBeenCalled();
    expect(column('Wishlist').getByText('Acme')).toBeInTheDocument();
  });
});
