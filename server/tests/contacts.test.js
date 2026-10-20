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

const newContact = { name: 'Sam Lee', title: 'Engineering Manager' };

// Creates a contact on an application as the given agent and returns it.
async function addContact(data = newContact, appId = application.id, as = agent) {
  const res = await as.post(`/api/applications/${appId}/contacts`).send(data).expect(201);
  return res.body.contact;
}

describe('auth required', () => {
  it.each([
    ['get', `/api/applications/${UNKNOWN_ID}/contacts`],
    ['post', `/api/applications/${UNKNOWN_ID}/contacts`],
    ['patch', `/api/contacts/${UNKNOWN_ID}`],
    ['delete', `/api/contacts/${UNKNOWN_ID}`],
  ])('%s %s returns 401 without a cookie', async (method, url) => {
    const res = await request(app)[method](url);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/applications/:id/contacts', () => {
  it('creates a contact', async () => {
    const res = await agent.post(`/api/applications/${application.id}/contacts`).send(newContact);

    expect(res.status).toBe(201);
    expect(res.body.contact).toMatchObject({ ...newContact, applicationId: application.id, email: null });
  });

  it('trims the name and lowercases the email', async () => {
    const contact = await addContact({ name: '  Sam Lee ', email: ' Sam.Lee@Globex.COM ' });

    expect(contact).toMatchObject({ name: 'Sam Lee', email: 'sam.lee@globex.com' });
  });

  it('returns 400 with field errors for invalid input', async () => {
    const res = await agent
      .post(`/api/applications/${application.id}/contacts`)
      .send({ name: ' ', email: 'not-an-email', linkedinUrl: 'linkedin' });

    expect(res.status).toBe(400);
    const { fieldErrors } = res.body.error.details;
    expect(fieldErrors).toHaveProperty('name');
    expect(fieldErrors).toHaveProperty('email');
    expect(fieldErrors).toHaveProperty('linkedinUrl');
  });

  it('returns 400 for a linkedinUrl that is not http(s)', async () => {
    const res = await agent
      .post(`/api/applications/${application.id}/contacts`)
      .send({ ...newContact, linkedinUrl: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('linkedinUrl');
  });

  it.each([
    ['an unknown application id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.post(`/api/applications/${id}/contacts`).send(newContact);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Application not found');
  });
});

describe('GET /api/applications/:id/contacts', () => {
  it("lists only this application's contacts, oldest first", async () => {
    await addContact({ name: 'First' });
    await addContact({ name: 'Second' });
    const otherApp = await createAs(agent, { company: 'Initech', roleTitle: 'Developer' });
    await addContact({ name: 'Elsewhere' }, otherApp.id);

    const res = await agent.get(`/api/applications/${application.id}/contacts`);

    expect(res.status).toBe(200);
    expect(res.body.contacts.map((c) => c.name)).toEqual(['First', 'Second']);
  });

  it('returns 404 for an unknown application', async () => {
    await agent.get(`/api/applications/${UNKNOWN_ID}/contacts`).expect(404);
  });
});

describe('PATCH /api/contacts/:contactId', () => {
  it('updates only the fields that are sent', async () => {
    const created = await addContact({ ...newContact, phone: '+1 555 0100' });

    const res = await agent.patch(`/api/contacts/${created.id}`).send({ title: 'Director' });

    expect(res.status).toBe(200);
    expect(res.body.contact).toMatchObject({ name: 'Sam Lee', title: 'Director', phone: '+1 555 0100' });
  });

  it('clears an optional field when it is set to null', async () => {
    const created = await addContact({ ...newContact, email: 'sam@globex.com' });

    const res = await agent.patch(`/api/contacts/${created.id}`).send({ email: null });

    expect(res.status).toBe(200);
    expect(res.body.contact.email).toBeNull();
  });

  it('returns 400 for an empty body or a blank name', async () => {
    const created = await addContact();

    const empty = await agent.patch(`/api/contacts/${created.id}`).send({});
    const blank = await agent.patch(`/api/contacts/${created.id}`).send({ name: ' ' });

    expect(empty.status).toBe(400);
    expect(blank.status).toBe(400);
    expect(blank.body.error.details.fieldErrors).toHaveProperty('name');
  });

  it('ignores an applicationId in the body', async () => {
    const created = await addContact();
    const otherApp = await createAs(agent, { company: 'Initech', roleTitle: 'Developer' });

    const res = await agent.patch(`/api/contacts/${created.id}`).send({ notes: 'x', applicationId: otherApp.id });

    expect(res.body.contact.applicationId).toBe(application.id);
  });

  it.each([
    ['an unknown id', UNKNOWN_ID],
    ['an id that is not a UUID', 'abc'],
  ])('returns 404 for %s', async (_, id) => {
    const res = await agent.patch(`/api/contacts/${id}`).send({ notes: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Contact not found');
  });
});

describe('DELETE /api/contacts/:contactId', () => {
  it('deletes the contact', async () => {
    const created = await addContact();

    const res = await agent.delete(`/api/contacts/${created.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.contact.count()).toBe(0);
  });

  it('returns 404 for an unknown id', async () => {
    await agent.delete(`/api/contacts/${UNKNOWN_ID}`).expect(404);
  });

  it('is removed together with its application', async () => {
    await addContact();

    await agent.delete(`/api/applications/${application.id}`).expect(204);

    expect(await prisma.contact.count()).toBe(0);
  });
});

// Alice owns an application with a contact; Bob is logged in as a different user.
describe("ownership: Bob can't reach Alice's contacts", () => {
  let aliceContact;
  let bobAgent;
  beforeEach(async () => {
    aliceContact = await addContact({ ...newContact, notes: 'original' });
    bobAgent = await registeredAgent(bob);
  });

  it('cannot list or add contacts on her application', async () => {
    await bobAgent.get(`/api/applications/${application.id}/contacts`).expect(404);
    await bobAgent.post(`/api/applications/${application.id}/contacts`).send(newContact).expect(404);

    expect(await prisma.contact.count()).toBe(1);
  });

  it('gets the same 404 as for a contact that does not exist', async () => {
    const res = await bobAgent.patch(`/api/contacts/${aliceContact.id}`).send({ notes: 'hacked' });
    const missing = await bobAgent.patch(`/api/contacts/${UNKNOWN_ID}`).send({ notes: 'hacked' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(missing.body);
    const saved = await prisma.contact.findUnique({ where: { id: aliceContact.id } });
    expect(saved.notes).toBe('original');
  });

  it('cannot delete it', async () => {
    await bobAgent.delete(`/api/contacts/${aliceContact.id}`).expect(404);

    expect(await prisma.contact.count()).toBe(1);
  });
});
