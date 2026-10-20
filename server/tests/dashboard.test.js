import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDb, prisma } from './helpers/db.js';
import { bob, registeredAgent } from './helpers/auth.js';
import { createAs } from './helpers/applications.js';

let agent;
beforeEach(async () => {
  await resetDb();
  agent = await registeredAgent();
});
afterAll(() => prisma.$disconnect());

const getStats = (query = '', as = agent) => as.get(`/api/dashboard/stats${query}`).expect(200);

// Creates an application and moves it through the given statuses, in order.
async function createWithHistory(statuses, as = agent) {
  const [first, ...rest] = statuses;
  const created = await createAs(as, { company: 'Globex', roleTitle: 'Engineer', status: first });
  for (const status of rest) {
    await as.patch(`/api/applications/${created.id}/status`).send({ status }).expect(200);
  }
  return created;
}

// Creates an application that was applied to at the given moment.
async function appliedAt(isoDate, as = agent) {
  const created = await createAs(as, { company: 'Globex', roleTitle: 'Engineer', status: 'APPLIED' });
  await prisma.application.update({ where: { id: created.id }, data: { appliedAt: new Date(isoDate) } });
}

it('returns 401 without a cookie', async () => {
  await request(app).get('/api/dashboard/stats').expect(401);
});

it('returns empty stats for a new user', async () => {
  const { body } = await getStats();

  expect(body).toMatchObject({
    countsByStatus: { WISHLIST: 0, APPLIED: 0, INTERVIEWING: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
    total: 0,
    responseRate: null,
    upcomingInterviews: [],
  });
  expect(body.applicationsPerWeek).toHaveLength(12);
  expect(body.applicationsPerWeek.every((w) => w.count === 0)).toBe(true);
});

describe('countsByStatus and total', () => {
  it('counts my applications by their current status', async () => {
    await createWithHistory(['WISHLIST']);
    await createWithHistory(['WISHLIST']);
    await createWithHistory(['APPLIED', 'INTERVIEWING']);
    await createWithHistory(['APPLIED', 'REJECTED']);
    const bobAgent = await registeredAgent(bob);
    await createWithHistory(['OFFER'], bobAgent);

    const { body } = await getStats();

    expect(body.countsByStatus).toEqual({
      WISHLIST: 2,
      APPLIED: 0,
      INTERVIEWING: 1,
      OFFER: 0,
      REJECTED: 1,
      WITHDRAWN: 0,
    });
    expect(body.total).toBe(4);
  });
});

describe('responseRate', () => {
  it('is responses ÷ applied, based on the history', async () => {
    // Applied (5):
    await createWithHistory(['WISHLIST', 'APPLIED']); //                   no response
    await createWithHistory(['APPLIED', 'WITHDRAWN']); //                  no response
    await createWithHistory(['APPLIED', 'INTERVIEWING', 'OFFER']); //      response (counted once)
    await createWithHistory(['APPLIED', 'REJECTED']); //                   response
    await createWithHistory(['APPLIED', 'INTERVIEWING', 'APPLIED']); //    response, though APPLIED now
    // Never applied, so not part of the rate:
    await createWithHistory(['WISHLIST', 'WITHDRAWN']);
    await createWithHistory(['INTERVIEWING']);
    // Another user's applications don't count.
    const bobAgent = await registeredAgent(bob);
    await createWithHistory(['APPLIED'], bobAgent);

    const { body } = await getStats();

    expect(body.responseRate).toBe(3 / 5);
  });
});

describe('applicationsPerWeek', () => {
  // Freeze the clock at Wednesday 2026-10-21 12:00 UTC. Only Date is faked,
  // so timers used by the database driver keep working.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  beforeEach(async () => {
    await appliedAt('2026-10-20T09:00:00Z'); // Tuesday this week
    await appliedAt('2026-10-19T00:30:00Z'); // Monday 00:30 UTC = Sunday evening in New York
    await appliedAt('2026-10-12T10:00:00Z'); // last week
    await appliedAt('2026-08-03T10:00:00Z'); // oldest week in the range
    await appliedAt('2026-07-30T10:00:00Z'); // too old
    await createAs(agent); // WISHLIST: never applied
    const bobAgent = await registeredAgent(bob);
    await appliedAt('2026-10-20T09:00:00Z', bobAgent);
  });

  // { weekStart: count } for the weeks that have applications.
  const nonEmpty = (weeks) => Object.fromEntries(weeks.filter((w) => w.count > 0).map((w) => [w.weekStart, w.count]));

  it('returns 12 Monday-based weeks in UTC, oldest first', async () => {
    const { body } = await getStats();
    const weeks = body.applicationsPerWeek;

    expect(weeks).toHaveLength(12);
    expect(weeks[0].weekStart).toBe('2026-08-03');
    expect(weeks[11].weekStart).toBe('2026-10-19');
    expect(nonEmpty(weeks)).toEqual({ '2026-08-03': 1, '2026-10-12': 1, '2026-10-19': 2 });
  });

  it('uses the tz parameter to decide which week an application falls in', async () => {
    const { body } = await getStats('?tz=America/New_York');

    expect(body.applicationsPerWeek[11].weekStart).toBe('2026-10-19');
    expect(nonEmpty(body.applicationsPerWeek)).toEqual({ '2026-08-03': 1, '2026-10-12': 2, '2026-10-19': 1 });
  });

  it.each(['Mars/Olympus', '+05:00', "UTC'; DROP TABLE"])('returns 400 for tz=%s', async (tz) => {
    const res = await agent.get('/api/dashboard/stats').query({ tz });

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('tz');
  });
});

describe('upcomingInterviews', () => {
  it('includes my interviews in the next 7 days', async () => {
    const created = await createAs(agent);
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    await agent
      .post(`/api/applications/${created.id}/interviews`)
      .send({ type: 'TECHNICAL', scheduledAt: soon })
      .expect(201);

    const { body } = await getStats();

    expect(body.upcomingInterviews).toHaveLength(1);
    expect(body.upcomingInterviews[0]).toMatchObject({ type: 'TECHNICAL', application: { id: created.id } });
  });
});
