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

describe('auth required', () => {
  it.each([
    ['post', '/api/applications'],
    ['get', '/api/applications'],
    ['get', `/api/applications/${UNKNOWN_ID}`],
    ['patch', `/api/applications/${UNKNOWN_ID}`],
    ['delete', `/api/applications/${UNKNOWN_ID}`],
  ])('%s %s returns 401 without a cookie', async (method, url) => {
    const res = await request(app)[method](url);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/applications', () => {
  it('creates an application with defaults and logs the initial status', async () => {
    const res = await agent.post('/api/applications').send(newApplication);

    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      ...newApplication,
      status: 'WISHLIST',
      salaryCurrency: 'USD',
      appliedAt: null,
    });

    const history = await prisma.statusChange.findMany({
      where: { applicationId: res.body.application.id },
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ fromStatus: null, toStatus: 'WISHLIST' });
  });

  it('sets appliedAt when created as APPLIED', async () => {
    const res = await agent.post('/api/applications').send({ ...newApplication, status: 'APPLIED' });

    expect(res.status).toBe(201);
    expect(res.body.application.appliedAt).not.toBeNull();
  });

  it('ignores a userId in the body and uses the logged-in user', async () => {
    const other = await prisma.user.create({ data: { email: 'x@example.com', name: 'X', passwordHash: 'x' } });

    const res = await agent.post('/api/applications').send({ ...newApplication, userId: other.id });

    expect(res.status).toBe(201);
    expect(res.body.application.userId).not.toBe(other.id);
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await agent
      .post('/api/applications')
      .send({ company: '  ', jobUrl: 'not a url', status: 'HIRED' });

    expect(res.status).toBe(400);
    const { fieldErrors } = res.body.error.details;
    expect(fieldErrors).toHaveProperty('company');
    expect(fieldErrors).toHaveProperty('roleTitle');
    expect(fieldErrors).toHaveProperty('jobUrl');
    expect(fieldErrors).toHaveProperty('status');
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://jobs.example.com'])(
    'returns 400 for a jobUrl that is not http(s): %s',
    async (jobUrl) => {
      const res = await agent.post('/api/applications').send({ ...newApplication, jobUrl });

      expect(res.status).toBe(400);
      expect(res.body.error.details.fieldErrors).toHaveProperty('jobUrl');
    },
  );

  it('returns 400 when salaryMin is above salaryMax', async () => {
    const res = await agent
      .post('/api/applications')
      .send({ ...newApplication, salaryMin: 120000, salaryMax: 90000 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('salaryMax');
  });
});

describe('GET /api/applications', () => {
  it('lists only my applications, most recently updated first', async () => {
    await agent.post('/api/applications').send({ ...newApplication, company: 'First' });
    await agent.post('/api/applications').send({ ...newApplication, company: 'Second' });
    const bobAgent = await registeredAgent(bob);
    await bobAgent.post('/api/applications').send({ ...newApplication, company: 'Bob Co' });

    const res = await agent.get('/api/applications');

    expect(res.status).toBe(200);
    expect(res.body.applications.map((a) => a.company)).toEqual(['Second', 'First']);
  });
});

describe('GET /api/applications/:id', () => {
  it('returns the application with contacts, interviews and history', async () => {
    const created = await agent.post('/api/applications').send(newApplication);

    const res = await agent.get(`/api/applications/${created.body.application.id}`);

    expect(res.status).toBe(200);
    expect(res.body.application).toMatchObject({ ...newApplication, contacts: [], interviews: [] });
    expect(res.body.application.statusChanges).toHaveLength(1);
  });

  it.each([
    ['an unknown id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.get(`/api/applications/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Application not found');
  });

});

describe('PATCH /api/applications/:id', () => {
  it('updates only the fields that are sent', async () => {
    const created = await createAs(agent, { ...newApplication, location: 'Chicago, IL' });

    const res = await agent
      .patch(`/api/applications/${created.id}`)
      .send({ roleTitle: 'Senior Engineer', notes: 'Referred by Sam' });

    expect(res.status).toBe(200);
    expect(res.body.application).toMatchObject({
      company: 'Globex',
      roleTitle: 'Senior Engineer',
      location: 'Chicago, IL',
      notes: 'Referred by Sam',
    });
  });

  it('clears an optional field when it is set to null', async () => {
    const created = await createAs(agent, { ...newApplication, location: 'Chicago, IL' });

    const res = await agent.patch(`/api/applications/${created.id}`).send({ location: null });

    expect(res.status).toBe(200);
    expect(res.body.application.location).toBeNull();
  });

  it('returns 400 for an empty body or a blank company', async () => {
    const created = await createAs(agent);

    const empty = await agent.patch(`/api/applications/${created.id}`).send({});
    const blank = await agent.patch(`/api/applications/${created.id}`).send({ company: ' ' });

    expect(empty.status).toBe(400);
    expect(blank.status).toBe(400);
    expect(blank.body.error.details.fieldErrors).toHaveProperty('company');
  });

  it('returns 400 when the new salaryMin is above the saved salaryMax', async () => {
    const created = await createAs(agent, { ...newApplication, salaryMin: 80000, salaryMax: 100000 });

    const res = await agent.patch(`/api/applications/${created.id}`).send({ salaryMin: 150000 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('salaryMax');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await agent.patch(`/api/applications/${UNKNOWN_ID}`).send({ notes: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/applications/:id', () => {
  it('deletes the application and its history', async () => {
    const created = await createAs(agent);

    const res = await agent.delete(`/api/applications/${created.id}`);

    expect(res.status).toBe(204);
    await agent.get(`/api/applications/${created.id}`).expect(404);
    const history = await prisma.statusChange.count({ where: { applicationId: created.id } });
    expect(history).toBe(0);
  });

  it.each([
    ['an unknown id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.delete(`/api/applications/${id}`);

    expect(res.status).toBe(404);
  });
});

// Alice owns an application; Bob is logged in as a different user.
describe("ownership: Bob can't reach Alice's application", () => {
  let aliceApp;
  let bobAgent;
  beforeEach(async () => {
    aliceApp = await createAs(agent, { ...newApplication, notes: 'original' });
    bobAgent = await registeredAgent(bob);
  });

  it('does not show it in his list', async () => {
    const res = await bobAgent.get('/api/applications');

    expect(res.body.applications).toEqual([]);
  });

  it('gets the same 404 as for an id that does not exist', async () => {
    const res = await bobAgent.get(`/api/applications/${aliceApp.id}`);
    const missing = await bobAgent.get(`/api/applications/${UNKNOWN_ID}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(missing.body);
  });

  it('cannot update it', async () => {
    const res = await bobAgent.patch(`/api/applications/${aliceApp.id}`).send({ notes: 'hacked' });

    expect(res.status).toBe(404);
    const saved = await prisma.application.findUnique({ where: { id: aliceApp.id } });
    expect(saved.notes).toBe('original');
  });

  it('cannot delete it', async () => {
    const res = await bobAgent.delete(`/api/applications/${aliceApp.id}`);

    expect(res.status).toBe(404);
    await agent.get(`/api/applications/${aliceApp.id}`).expect(200);
  });
});
