import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDb, prisma } from './helpers/db.js';
import { bob, registeredAgent } from './helpers/auth.js';
import { newApplication, UNKNOWN_ID, createAs } from './helpers/applications.js';

let agent;
beforeEach(async () => {
  await resetDb();
  agent = await registeredAgent();
});
afterAll(() => prisma.$disconnect());

const setStatus = (id, status) => agent.patch(`/api/applications/${id}/status`).send({ status });

// [fromStatus, toStatus] pairs, oldest first.
async function historyOf(id) {
  const res = await agent.get(`/api/applications/${id}/history`).expect(200);
  return res.body.history.map((h) => [h.fromStatus, h.toStatus]);
}

describe('PATCH /api/applications/:id/status', () => {
  it('changes the status and logs it in the history', async () => {
    const created = await createAs(agent);

    const res = await setStatus(created.id, 'APPLIED');

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('APPLIED');
    expect(await historyOf(created.id)).toEqual([
      [null, 'WISHLIST'],
      ['WISHLIST', 'APPLIED'],
    ]);
  });

  it('sets appliedAt on the first move to APPLIED and keeps it afterwards', async () => {
    const created = await createAs(agent);

    const first = await setStatus(created.id, 'APPLIED');
    await setStatus(created.id, 'INTERVIEWING');
    const again = await setStatus(created.id, 'APPLIED');

    expect(first.body.application.appliedAt).not.toBeNull();
    expect(again.body.application.appliedAt).toBe(first.body.application.appliedAt);
  });

  it('does not log anything when the status is the same', async () => {
    const created = await createAs(agent);

    const res = await setStatus(created.id, 'WISHLIST');

    expect(res.status).toBe(200);
    expect(await historyOf(created.id)).toEqual([[null, 'WISHLIST']]);
  });

  it.each([
    ['an unknown status', { status: 'HIRED' }],
    ['a missing status', {}],
  ])('returns 400 for %s', async (_, body) => {
    const created = await createAs(agent);

    const res = await agent.patch(`/api/applications/${created.id}/status`).send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('status');
  });

  it('returns 404 for an unknown id and 401 without a cookie', async () => {
    await setStatus(UNKNOWN_ID, 'APPLIED').expect(404);
    await request(app)
      .patch(`/api/applications/${UNKNOWN_ID}/status`)
      .send({ status: 'APPLIED' })
      .expect(401);
  });
});

describe('PATCH /api/applications/:id with a status', () => {
  it('updates the fields and logs the status change together', async () => {
    const created = await createAs(agent);

    const res = await agent
      .patch(`/api/applications/${created.id}`)
      .send({ notes: 'Applied via referral', status: 'APPLIED' });

    expect(res.status).toBe(200);
    expect(res.body.application).toMatchObject({
      notes: 'Applied via referral',
      status: 'APPLIED',
    });
    expect(res.body.application.appliedAt).not.toBeNull();
    expect(await historyOf(created.id)).toEqual([
      [null, 'WISHLIST'],
      ['WISHLIST', 'APPLIED'],
    ]);
  });

  it('changes nothing when part of the update is rejected', async () => {
    const created = await createAs(agent, {
      ...newApplication,
      salaryMin: 80000,
      salaryMax: 100000,
    });

    const res = await agent
      .patch(`/api/applications/${created.id}`)
      .send({ status: 'APPLIED', salaryMin: 150000 });

    expect(res.status).toBe(400);
    const saved = await prisma.application.findUnique({ where: { id: created.id } });
    expect(saved).toMatchObject({ status: 'WISHLIST', salaryMin: 80000 });
    expect(await historyOf(created.id)).toEqual([[null, 'WISHLIST']]);
  });
});

describe('GET /api/applications/:id/history', () => {
  it('lists every change in order', async () => {
    const created = await createAs(agent);
    await setStatus(created.id, 'APPLIED');
    await setStatus(created.id, 'INTERVIEWING');
    await setStatus(created.id, 'OFFER');

    expect(await historyOf(created.id)).toEqual([
      [null, 'WISHLIST'],
      ['WISHLIST', 'APPLIED'],
      ['APPLIED', 'INTERVIEWING'],
      ['INTERVIEWING', 'OFFER'],
    ]);
  });
});

describe("ownership: Bob can't change or read Alice's status", () => {
  it('returns 404 and leaves the status alone', async () => {
    const created = await createAs(agent);
    const bobAgent = await registeredAgent(bob);

    await bobAgent
      .patch(`/api/applications/${created.id}/status`)
      .send({ status: 'REJECTED' })
      .expect(404);
    await bobAgent
      .patch(`/api/applications/${created.id}`)
      .send({ status: 'REJECTED' })
      .expect(404);
    await bobAgent.get(`/api/applications/${created.id}/history`).expect(404);

    expect(await historyOf(created.id)).toEqual([[null, 'WISHLIST']]);
  });
});
