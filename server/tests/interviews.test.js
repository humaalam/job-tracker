import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDb, prisma } from './helpers/db.js';
import { bob, registeredAgent } from './helpers/auth.js';
import { UNKNOWN_ID, createAs } from './helpers/applications.js';

let agent;
let application;
beforeEach(async () => {
  await resetDb();
  agent = await registeredAgent();
  application = await createAs(agent);
});
afterAll(() => prisma.$disconnect());

// An ISO date-time `days` days from now (negative = in the past).
const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const newInterview = { type: 'PHONE_SCREEN', scheduledAt: '2026-11-03T15:00:00.000Z' };

// Creates an interview on an application as the given agent and returns it.
async function addInterview(data = newInterview, appId = application.id, as = agent) {
  const res = await as.post(`/api/applications/${appId}/interviews`).send(data).expect(201);
  return res.body.interview;
}

describe('auth required', () => {
  it.each([
    ['get', `/api/applications/${UNKNOWN_ID}/interviews`],
    ['post', `/api/applications/${UNKNOWN_ID}/interviews`],
    ['patch', `/api/interviews/${UNKNOWN_ID}`],
    ['delete', `/api/interviews/${UNKNOWN_ID}`],
    ['get', '/api/interviews/upcoming'],
  ])('%s %s returns 401 without a cookie', async (method, url) => {
    const res = await request(app)[method](url);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/applications/:id/interviews', () => {
  it('creates an interview with defaults', async () => {
    const res = await agent.post(`/api/applications/${application.id}/interviews`).send(newInterview);

    expect(res.status).toBe(201);
    expect(res.body.interview).toMatchObject({
      ...newInterview,
      applicationId: application.id,
      outcome: 'PENDING',
      durationMinutes: null,
    });
  });

  it('stores a time given with an offset as the same moment in UTC', async () => {
    const interview = await addInterview({ type: 'TECHNICAL', scheduledAt: '2026-11-03T17:00:00+02:00' });

    expect(interview.scheduledAt).toBe('2026-11-03T15:00:00.000Z');
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await agent
      .post(`/api/applications/${application.id}/interviews`)
      .send({ type: 'COFFEE', scheduledAt: '2026-11-03 15:00', durationMinutes: -5 });

    expect(res.status).toBe(400);
    const { fieldErrors } = res.body.error.details;
    expect(fieldErrors).toHaveProperty('type');
    expect(fieldErrors).toHaveProperty('scheduledAt');
    expect(fieldErrors).toHaveProperty('durationMinutes');
  });

  it.each([
    ['an unknown application id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.post(`/api/applications/${id}/interviews`).send(newInterview);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Application not found');
  });
});

describe('GET /api/applications/:id/interviews', () => {
  it("lists only this application's interviews, soonest first", async () => {
    await addInterview({ type: 'FINAL', scheduledAt: '2026-11-20T15:00:00.000Z' });
    await addInterview({ type: 'PHONE_SCREEN', scheduledAt: '2026-11-01T15:00:00.000Z' });
    const otherApp = await createAs(agent, { company: 'Initech', roleTitle: 'Developer' });
    await addInterview(newInterview, otherApp.id);

    const res = await agent.get(`/api/applications/${application.id}/interviews`);

    expect(res.status).toBe(200);
    expect(res.body.interviews.map((i) => i.type)).toEqual(['PHONE_SCREEN', 'FINAL']);
  });

  it('returns 404 for an unknown application', async () => {
    await agent.get(`/api/applications/${UNKNOWN_ID}/interviews`).expect(404);
  });
});

describe('PATCH /api/interviews/:interviewId', () => {
  it('updates only the fields that are sent', async () => {
    const created = await addInterview({ ...newInterview, notes: 'Bring portfolio' });

    const res = await agent.patch(`/api/interviews/${created.id}`).send({ outcome: 'PASSED' });

    expect(res.status).toBe(200);
    expect(res.body.interview).toMatchObject({ ...newInterview, outcome: 'PASSED', notes: 'Bring portfolio' });
  });

  it('returns 400 for an empty body or an unknown outcome', async () => {
    const created = await addInterview();

    const empty = await agent.patch(`/api/interviews/${created.id}`).send({});
    const bad = await agent.patch(`/api/interviews/${created.id}`).send({ outcome: 'GREAT' });

    expect(empty.status).toBe(400);
    expect(bad.status).toBe(400);
    expect(bad.body.error.details.fieldErrors).toHaveProperty('outcome');
  });

  it('ignores an applicationId in the body', async () => {
    const created = await addInterview();
    const otherApp = await createAs(agent, { company: 'Initech', roleTitle: 'Developer' });

    const res = await agent.patch(`/api/interviews/${created.id}`).send({ notes: 'x', applicationId: otherApp.id });

    expect(res.body.interview.applicationId).toBe(application.id);
  });

  it.each([
    ['an unknown id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.patch(`/api/interviews/${id}`).send({ notes: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Interview not found');
  });
});

describe('DELETE /api/interviews/:interviewId', () => {
  it('deletes the interview', async () => {
    const created = await addInterview();

    const res = await agent.delete(`/api/interviews/${created.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.interview.count()).toBe(0);
  });

  it('returns 404 for an unknown id', async () => {
    await agent.delete(`/api/interviews/${UNKNOWN_ID}`).expect(404);
  });

  it('is removed together with its application', async () => {
    await addInterview();

    await agent.delete(`/api/applications/${application.id}`).expect(204);

    expect(await prisma.interview.count()).toBe(0);
  });
});

describe('GET /api/interviews/upcoming', () => {
  beforeEach(async () => {
    await addInterview({ type: 'OTHER', scheduledAt: inDays(-1) }); // past
    await addInterview({ type: 'FINAL', scheduledAt: inDays(5) });
    await addInterview({ type: 'PHONE_SCREEN', scheduledAt: inDays(1) });
    await addInterview({ type: 'TECHNICAL', scheduledAt: inDays(2), outcome: 'CANCELLED' });
    await addInterview({ type: 'ONSITE', scheduledAt: inDays(10) }); // beyond 7 days
  });

  it('returns the next 7 days by default, soonest first, without cancelled ones', async () => {
    const res = await agent.get('/api/interviews/upcoming');

    expect(res.status).toBe(200);
    expect(res.body.interviews.map((i) => i.type)).toEqual(['PHONE_SCREEN', 'FINAL']);
  });

  it('includes a short summary of the application', async () => {
    const res = await agent.get('/api/interviews/upcoming');

    expect(res.body.interviews[0].application).toEqual({
      id: application.id,
      company: application.company,
      roleTitle: application.roleTitle,
      status: application.status,
    });
  });

  it('uses the days parameter', async () => {
    const res = await agent.get('/api/interviews/upcoming?days=14');

    expect(res.body.interviews.map((i) => i.type)).toEqual(['PHONE_SCREEN', 'FINAL', 'ONSITE']);
  });

  it.each(['0', '400', 'week'])('returns 400 for days=%s', async (days) => {
    const res = await agent.get(`/api/interviews/upcoming?days=${days}`);

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('days');
  });
});

// Alice owns an application with an interview; Bob is logged in as a different user.
describe("ownership: Bob can't reach Alice's interviews", () => {
  let aliceInterview;
  let bobAgent;
  beforeEach(async () => {
    aliceInterview = await addInterview({ ...newInterview, scheduledAt: inDays(1), notes: 'original' });
    bobAgent = await registeredAgent(bob);
  });

  it('cannot list or add interviews on her application', async () => {
    await bobAgent.get(`/api/applications/${application.id}/interviews`).expect(404);
    await bobAgent.post(`/api/applications/${application.id}/interviews`).send(newInterview).expect(404);

    expect(await prisma.interview.count()).toBe(1);
  });

  it('gets the same 404 as for an interview that does not exist', async () => {
    const res = await bobAgent.patch(`/api/interviews/${aliceInterview.id}`).send({ notes: 'hacked' });
    const missing = await bobAgent.patch(`/api/interviews/${UNKNOWN_ID}`).send({ notes: 'hacked' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(missing.body);
    const saved = await prisma.interview.findUnique({ where: { id: aliceInterview.id } });
    expect(saved.notes).toBe('original');
  });

  it('cannot delete it', async () => {
    await bobAgent.delete(`/api/interviews/${aliceInterview.id}`).expect(404);

    expect(await prisma.interview.count()).toBe(1);
  });

  it('does not see it in his upcoming list', async () => {
    const res = await bobAgent.get('/api/interviews/upcoming');

    expect(res.body.interviews).toEqual([]);
  });
});
